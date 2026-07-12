import crypto from "crypto";
import { sendTenantSms } from "@/lib/sms";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

const timeToMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minsToTime = (m: number) => { const h = Math.floor(m / 60).toString().padStart(2, '0'); const min = (m % 60).toString().padStart(2, '0'); return `${h}:${min}`; };

const hasUpstash = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("neatx_auth");
    const isAdmin = authCookie?.value === "true";
    const body = await request.json();
    const {
      customerName,
      customerPhone,
      date,
      time,
      honey,
      source,
      tenantId,
      serviceId,
      duration,
      paymentMethod,
      staffId: explicitStaffId,
      locationId,
    } = body;
    let isPlaygroundDemo = tenantId === "cmqtds1840000yyqbd23x1jdj";
    let isTrialExpired = false;
    if (tenantId) {
      const bookingTenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { isDemoData: true, trialStatus: true, trialEndsAt: true, plan: true },
      });
      isPlaygroundDemo =
        isPlaygroundDemo ||
        Boolean(bookingTenant?.isDemoData && bookingTenant.trialStatus === "demo");
      isTrialExpired = Boolean(
        bookingTenant?.trialEndsAt &&
          new Date(bookingTenant.trialEndsAt) < new Date() &&
          bookingTenant.plan !== "premium" &&
          bookingTenant.trialStatus !== "converted"
      );
    }

    if (!isAdmin && isTrialExpired) {
      return NextResponse.json({ error: "La prova gratuita è scaduta." }, { status: 402 });
    }

    if (!isAdmin && !isPlaygroundDemo && hasUpstash) {
      const { Ratelimit } = await import("@upstash/ratelimit");
      const { Redis } = await import("@upstash/redis");
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      const ratelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "24 h"),
      });
      try {
        const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
        const { success } = await ratelimit.limit(ip);
        if (!success) {
          return NextResponse.json({ error: "Hai raggiunto il limite massimo di prenotazioni." }, { status: 429 });
        }
      } catch (e) {
        console.warn("Rate limit non disponibile, salto controllo:", e);
      }
    }

    if (!isAdmin && honey && honey !== "") {
      return NextResponse.json({ success: true }); // Trappola anti-bot scattata
    }
    
    if (!customerName || !date || !time || !tenantId || !serviceId) {
      return NextResponse.json({ error: "Per favore, compila tutti i campi obbligatori." }, { status: 400 });
    }

    if (!isAdmin && !isPlaygroundDemo && !customerPhone) {
      return NextResponse.json({ error: "Inserisci un numero di telefono valido." }, { status: 400 });
    }

    if (!isPlaygroundDemo && customerName.trim().length < 3) {
      return NextResponse.json({ error: "Il nome inserito è troppo corto." }, { status: 400 });
    }

    // 🌟 VALIDAZIONE LOCATION
    let targetLocationId: string | null = null;
    if (locationId) {
      const location = await prisma.location.findUnique({
        where: { id: locationId },
        select: { id: true, tenantId: true, isActive: true },
      });
      if (!location || location.tenantId !== tenantId || !location.isActive) {
        return NextResponse.json({ error: "Sede non valida o non attiva" }, { status: 400 });
      }
      targetLocationId = location.id;
    } else {
      // Auto-seleziona sede se tenant ha una sola sede attiva
      const locations = await prisma.location.findMany({
        where: { tenantId, isActive: true },
        select: { id: true },
        take: 2,
      });
      if (locations.length === 1) {
        targetLocationId = locations[0].id;
      } else if (locations.length > 1) {
        return NextResponse.json({ error: "Specifica la sede (locationId)" }, { status: 400 });
      }
    }
    if (!targetLocationId) {
      return NextResponse.json({ error: "Nessuna sede disponibile per questo tenant" }, { status: 400 });
    }

    // 🌟 VALIDAZIONE SERVIZIO IN SEDE
    const serviceLocation = await prisma.serviceLocation.findUnique({
      where: { serviceId_locationId: { serviceId, locationId: targetLocationId } },
      select: { isActive: true, price: true },
    });
    if (!serviceLocation || !serviceLocation.isActive) {
      return NextResponse.json({ error: "Servizio non disponibile in questa sede" }, { status: 400 });
    }

    // 🌟 VALIDAZIONE STAFF IN SEDE
    let chosenStaffId = explicitStaffId;
    if (explicitStaffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: explicitStaffId },
        select: { id: true, tenantId: true, locationId: true, services: { select: { id: true } } },
      });
      if (!staff || staff.tenantId !== tenantId || !staff.services.some(s => s.id === serviceId)) {
        return NextResponse.json({ error: "Staff non valido per questo servizio" }, { status: 400 });
      }
      // Staff deve lavorare in questa sede (locationId null = ovunque, o match)
      if (staff.locationId && staff.locationId !== targetLocationId) {
        return NextResponse.json({ error: "Staff non opera in questa sede" }, { status: 400 });
      }
      chosenStaffId = explicitStaffId;
    } else {
      // Auto-assegna staff disponibile in questa sede per questo servizio
      const capableStaff = await prisma.staff.findMany({
        where: {
          tenantId,
          services: { some: { id: serviceId } },
          OR: [{ locationId: null }, { locationId: targetLocationId }],
        },
        select: { id: true },
      });
      if (capableStaff.length > 0) {
        chosenStaffId = capableStaff[0].id;
      }
    }

    // 🌟 CALCOLO FINE SERVIZIO
    const startMins = timeToMins(time);
    const endMins = startMins + parseInt(duration, 10);
    const endTime = minsToTime(endMins);

    // 🌟 VERIFICA SOVRAPPOSIZIONE SOLO PER QUESTA SEDE
    const overlappingApps = await prisma.appointment.findMany({
      where: { date: date, locationId: targetLocationId },
      select: { time: true, endTime: true, customerName: true, staffId: true }
    });

    const hasOverlap = overlappingApps.some(app => {
      const appStart = timeToMins(app.time);
      const appEnd = app.endTime ? timeToMins(app.endTime) : appStart + 15;
      if (chosenStaffId && app.staffId && app.staffId !== chosenStaffId) return false;
      return Math.max(startMins, appStart) < Math.min(endMins, appEnd);
    });

    if (hasOverlap) {
      return NextResponse.json({ error: "Spiacenti, qualcuno ha appena prenotato questo orario!" }, { status: 400 });
    }

    // 🌟 VERIFICA ORARI SEDE
    const location = await prisma.location.findUnique({
      where: { id: targetLocationId },
      select: { openTime: true, closeTime: true, breakStart: true, breakEnd: true, closedDays: true },
    });
    if (location) {
      const openMins = location.openTime ? timeToMins(location.openTime) : 9 * 60;
      const closeMins = location.closeTime ? timeToMins(location.closeTime) : 19 * 60;
      if (startMins < openMins || endMins > closeMins) {
        return NextResponse.json({ error: "Orario fuori dagli orari di apertura della sede" }, { status: 400 });
      }
      if (location.breakStart && location.breakEnd) {
        const breakStartMins = timeToMins(location.breakStart);
        const breakEndMins = timeToMins(location.breakEnd);
        if (startMins < breakEndMins && endMins > breakStartMins) {
          return NextResponse.json({ error: "Orario in pausa pranzo della sede" }, { status: 400 });
        }
      }
      if (location.closedDays) {
        try {
          const closedDaysArray = JSON.parse(location.closedDays);
          const dateObj = new Date(date + 'T12:00:00');
          const dayOfWeek = dateObj.getDay();
          if (closedDaysArray.includes(dayOfWeek)) {
            return NextResponse.json({ error: "Sede chiusa in questo giorno" }, { status: 400 });
          }
        } catch (e) {}
      }
    }

    if (!isAdmin && !isPlaygroundDemo && !customerPhone) {
      return NextResponse.json({ error: "Inserisci un numero di telefono valido." }, { status: 400 });
    }

    if (!isPlaygroundDemo && customerName.trim().length < 3) {
      return NextResponse.json({ error: "Il nome inserito è troppo corto." }, { status: 400 });
    }

    const cleanPhone = customerPhone ? customerPhone.replace(/\D/g, '') : "0000000000";
    const phoneRegex = /^[0-9]{8,15}$/;

    if (!isPlaygroundDemo && !isAdmin && customerPhone && !phoneRegex.test(cleanPhone) && cleanPhone !== "0000" && cleanPhone !== "0000000000") {
      return NextResponse.json({ error: "Inserisci un numero di telefono valido." }, { status: 400 });
    }

    if (!isPlaygroundDemo && !isAdmin && cleanPhone !== "0000" && cleanPhone !== "0000000000") {
      const noShowCount = await prisma.noShow.count({ where: { customerPhone: cleanPhone, tenantId } });
      if (noShowCount >= 3) {
        return NextResponse.json({ error: "Hai mancato troppi appuntamenti. Contatta direttamente l'attività." }, { status: 403 });
      }
    }

    const newCancelToken = crypto.randomUUID();

    const newAppointment = await prisma.appointment.create({
      data: {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        date: date,
        time: time,
        endTime: endTime,
        source: source || "ONLINE",
        cancelToken: newCancelToken,
        tenantId: tenantId,
        serviceId: serviceId,
        isPaid: isPlaygroundDemo && paymentMethod === "online",
        staffId: chosenStaffId || undefined,
        locationId: targetLocationId,
      },
    });

    await logActivity({
      action: "CREATE_APPOINTMENT",
      actor: isAdmin ? "admin" : "client",
      message: isAdmin 
        ? `Nuovo appuntamento inserito per ${customerName}`
        : `${customerName} si è prenotato dal sito web`,
      appointmentId: newAppointment.id,
      customerName: customerName.trim(),
      customerPhone: cleanPhone,
      date: date,
      time: time,
      tenantId: tenantId,
    });

    // 🌟 INVIO SMS/WHATSAPP CON MOTORE REALE
    if (cleanPhone !== "0000000000") {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      const service = await prisma.service.findUnique({ where: { id: serviceId } });
      const locationForSms = targetLocationId ? await prisma.location.findUnique({ where: { id: targetLocationId }, select: { name: true, address: true, phone: true } }) : null;
      
      if (tenant && service) {
        const locationName = locationForSms?.name || tenant.name;
        const locationAddress = locationForSms?.address || tenant.address || '';
        const smsBody = `✅ ${tenant.name} - ${locationName} - Prenotazione Confermata!\n${customerName.trim()}, ti aspettiamo il ${date.split('-').reverse().join('/')} alle ${time} per ${service.name}.\n${locationAddress ? `\nSede: ${locationAddress}` : ''}\n\nPer disdire o spostare clicca qui: https://${tenant.slug}.neatx.store/cancel/${newCancelToken}`;
        const formattedDate = date.split('-').reverse().join('/');
        const cancelUrl = `https://${tenant.slug}.neatx.store/cancel/${newCancelToken}`;
        
        await sendTenantSms(
          tenantId,
          cleanPhone,
          smsBody,
          { storeName: tenant.name, customerName: customerName.trim(), date: formattedDate, time }
        );
      }
    }

    revalidatePath("/dashboard");

    return NextResponse.json({ 
      success: true, 
      cancelToken: newAppointment.cancelToken,
      appointment: newAppointment 
    });

  } catch (error) {
    console.error("Errore Database:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio." }, { status: 500 });
  }
}