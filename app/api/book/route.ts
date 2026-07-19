import crypto from "crypto";
import { sendTenantSms } from "@/lib/sms";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { isTenantAdminCookieValid } from "@/lib/auth";
import { appointmentConflictsWithSlot } from "@/lib/booking-conflict";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";
import { parseClosedDays, parseDaySchedule } from "@/lib/opening-hours";

const timeToMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minsToTime = (m: number) => { const h = Math.floor(m / 60).toString().padStart(2, '0'); const min = (m % 60).toString().padStart(2, '0'); return `${h}:${min}`; };

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
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
      paymentMethod,
      privacyAccepted,
      staffId: explicitStaffId,
      locationId,
    } = body;
    let isPlaygroundDemo = tenantId === "cmqtds1840000yyqbd23x1jdj";
    let isTrialExpired = false;
    const bookingTenant = tenantId
      ? await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            slug: true,
            isDemoData: true,
            trialStatus: true,
            trialEndsAt: true,
            plan: true,
            openTime: true,
            closeTime: true,
            breakStart: true,
            breakEnd: true,
            closedDays: true,
          },
        })
      : null;
    if (!bookingTenant) {
      return NextResponse.json({ error: "Negozio non trovato." }, { status: 404 });
    }
    const tenantAuthCookie = cookieStore.get(`admin_auth_${bookingTenant.slug}`)?.value;
    const isAdmin = isTenantAdminCookieValid(tenantAuthCookie, bookingTenant.slug);
    isPlaygroundDemo =
      isPlaygroundDemo ||
      Boolean(bookingTenant.isDemoData && bookingTenant.trialStatus === "demo");
    isTrialExpired = Boolean(
      bookingTenant.trialEndsAt &&
        new Date(bookingTenant.trialEndsAt) < new Date() &&
        bookingTenant.plan !== "pro" && bookingTenant.plan !== "elite" &&
        bookingTenant.trialStatus !== "converted"
    );
    const isPublicDemoWalkIn = isPlaygroundDemo && source === "WALK_IN";

    if (!isAdmin && !isPublicDemoWalkIn && privacyAccepted !== true) {
      return NextResponse.json(
        { error: "Accetta la Privacy Policy per continuare." },
        { status: 400 },
      );
    }

    if (!isAdmin && isTrialExpired) {
      return NextResponse.json({ error: "La prova gratuita è scaduta." }, { status: 402 });
    }

    if (!isAdmin) {
      const rate = await checkRequestRateLimit(
        request,
        `booking:${tenantId}`,
        isPlaygroundDemo ? 30 : 10,
        60 * 60,
      );
      if (!rate.success) {
        return NextResponse.json(
          { error: "Hai raggiunto il limite massimo di prenotazioni." },
          { status: 429 },
        );
      }
    }

    if (!isAdmin && honey && honey !== "") {
      return NextResponse.json({ success: true }); // Trappola anti-bot scattata
    }
    
    if (!customerName || !date || !time || !tenantId || !serviceId) {
      return NextResponse.json({ error: "Per favore, compila tutti i campi obbligatori." }, { status: 400 });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
      return NextResponse.json({ error: "Data o orario non validi." }, { status: 400 });
    }
    const bookingDate = new Date(`${date}T12:00:00`);
    if (Number.isNaN(bookingDate.getTime())) {
      return NextResponse.json({ error: "Data non valida." }, { status: 400 });
    }
    const todayInRome = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    if (date < todayInRome) {
      return NextResponse.json({ error: "Non puoi prenotare una data passata." }, { status: 400 });
    }
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 60);
    if (bookingDate > maxDate) {
      return NextResponse.json({ error: "Puoi prenotare con massimo 60 giorni di anticipo." }, { status: 400 });
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, tenantId },
      select: { id: true, duration: true },
    });
    if (!service || service.duration < 5 || service.duration > 720) {
      return NextResponse.json({ error: "Servizio non valido." }, { status: 400 });
    }

    if (!isAdmin && !isPlaygroundDemo && !customerPhone) {
      return NextResponse.json({ error: "Inserisci un numero di telefono valido." }, { status: 400 });
    }

    if (!isPlaygroundDemo && customerName.trim().length < 3) {
      return NextResponse.json({ error: "Il nome inserito è troppo corto." }, { status: 400 });
    }

    // 🌟 VALIDAZIONE LOCATION
    let targetLocationId: string | null = null;
    const activeLocations = await prisma.location.findMany({
      where: { tenantId, isActive: true },
      select: { id: true },
      take: 2,
    });

    if (activeLocations.length > 0) {
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
        if (activeLocations.length === 1) {
          targetLocationId = activeLocations[0].id;
        } else if (activeLocations.length > 1) {
          return NextResponse.json({ error: "Specifica la sede (locationId)" }, { status: 400 });
        }
      }
    }

    // 🌟 VALIDAZIONE SERVIZIO IN SEDE (solo se tenant ha sedi configurate)
    if (activeLocations.length > 0) {
      const serviceLocation = await prisma.serviceLocation.findUnique({
        where: { serviceId_locationId: { serviceId, locationId: targetLocationId! } },
        select: { isActive: true, price: true },
      });
      if (!serviceLocation || !serviceLocation.isActive) {
        return NextResponse.json({ error: "Servizio non disponibile in questa sede" }, { status: 400 });
      }
    }

    // 🌟 VALIDAZIONE STAFF IN SEDE
    let chosenStaffId = explicitStaffId;
    let candidateStaffIds: string[] = [];
    if (explicitStaffId) {
      const staff = await prisma.staff.findUnique({
        where: { id: explicitStaffId },
        select: { id: true, tenantId: true, locationId: true, services: { select: { id: true } }, locations: { select: { locationId: true } } },
      });
      if (!staff || staff.tenantId !== tenantId || !staff.services.some(s => s.id === serviceId)) {
        return NextResponse.json({ error: "Staff non valido per questo servizio" }, { status: 400 });
      }
      // Staff deve lavorare in questa sede (StaffLocation, locationId null = ovunque, o match legacy)
      const worksHere = staff.locations?.some((l: any) => l.locationId === targetLocationId)
        || (!staff.locations?.length && !staff.locationId)
        || (!staff.locations?.length && staff.locationId === targetLocationId);
      if (!worksHere) {
        return NextResponse.json({ error: "Staff non opera in questa sede" }, { status: 400 });
      }
      chosenStaffId = explicitStaffId;
    } else {
      // Auto-assegna staff disponibile in questa sede per questo servizio
      const staffWhere: any = {
        tenantId,
        services: { some: { id: serviceId } },
      };
      if (targetLocationId) {
        staffWhere.OR = [
          { locations: { some: { locationId: targetLocationId } } },
          { AND: [{ locations: { none: {} } }, { locationId: null }] },
          { AND: [{ locations: { none: {} } }, { locationId: targetLocationId }] },
        ];
      }
      const capableStaff = await prisma.staff.findMany({
        where: staffWhere,
        select: { id: true },
      });
      if (capableStaff.length > 0) {
        candidateStaffIds = capableStaff.map((member) => member.id);
      }
    }

    // 🌟 CALCOLO FINE SERVIZIO
    const startMins = timeToMins(time);
    const safeDuration = service.duration;
    const endMins = startMins + safeDuration;
    const endTime = minsToTime(endMins);

    // 🌟 VERIFICA SOVRAPPOSIZIONE SOLO PER QUESTA SEDE
    const overlappingApps = await prisma.appointment.findMany({
      where: { date, tenantId },
      select: {
        time: true,
        endTime: true,
        customerName: true,
        staffId: true,
        locationId: true,
      },
    });

    if (!explicitStaffId && candidateStaffIds.length > 0) {
      chosenStaffId = candidateStaffIds.find((candidateId) =>
        !overlappingApps.some((app) =>
          appointmentConflictsWithSlot(
            app,
            startMins,
            endMins,
            candidateId,
            targetLocationId,
          ),
        ),
      );
      if (!chosenStaffId) {
        return NextResponse.json({ error: "Nessun operatore disponibile in questo orario." }, { status: 409 });
      }
    }

    const hasOverlap = overlappingApps.some((app) =>
      appointmentConflictsWithSlot(
        app,
        startMins,
        endMins,
        chosenStaffId,
        targetLocationId,
      ),
    );

    if (hasOverlap) {
      return NextResponse.json({ error: "Spiacenti, qualcuno ha appena prenotato questo orario!" }, { status: 400 });
    }

    // 🌟 VERIFICA ORARI SEDE
    const location = targetLocationId ? await prisma.location.findUnique({
      where: { id: targetLocationId },
      select: { openTime: true, closeTime: true, breakStart: true, breakEnd: true, closedDays: true },
    }) : bookingTenant;
    if (location) {
      const dayOfWeek = new Date(date + 'T12:00:00Z').getUTCDay();
      const daySchedule = parseDaySchedule(
        location.closedDays,
        dayOfWeek,
        location.openTime,
        location.closeTime,
        location.breakStart,
        location.breakEnd,
      );
      if (daySchedule.isClosed) {
        return NextResponse.json({ error: "Sede chiusa in questo giorno" }, { status: 400 });
      }
      const openMins = timeToMins(daySchedule.open);
      const closeMins = timeToMins(daySchedule.close);
      if (startMins < openMins || endMins > closeMins) {
        return NextResponse.json({ error: "Orario fuori dagli orari di apertura della sede" }, { status: 400 });
      }
      if (daySchedule.breakStart && daySchedule.breakEnd) {
        const breakStartMins = timeToMins(daySchedule.breakStart);
        const breakEndMins = timeToMins(daySchedule.breakEnd);
        if (startMins < breakEndMins && endMins > breakStartMins) {
          return NextResponse.json({ error: "Orario in pausa della sede" }, { status: 400 });
        }
      }
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

    const newAppointment = await prisma.$transaction(
      async (tx) => {
        const currentAppointments = await tx.appointment.findMany({
          where: { date, tenantId },
          select: {
            time: true,
            endTime: true,
            customerName: true,
            staffId: true,
            locationId: true,
          },
        });
        const slotTaken = currentAppointments.some((app) =>
          appointmentConflictsWithSlot(
            app,
            startMins,
            endMins,
            chosenStaffId,
            targetLocationId,
          ),
        );
        if (slotTaken) throw new Error("SLOT_TAKEN");

        return tx.appointment.create({
          data: {
            customerName: customerName.trim(),
            customerPhone: cleanPhone,
            date,
            time,
            endTime,
            source: source || "ONLINE",
            cancelToken: newCancelToken,
            tenantId,
            serviceId,
            isPaid: isPlaygroundDemo && paymentMethod === "online",
            paymentStatus:
              isPlaygroundDemo && paymentMethod === "online" ? "PAID" : "NONE",
            staffId: chosenStaffId || undefined,
            locationId: targetLocationId,
          },
        });
      },
      { isolationLevel: "Serializable" }
    ).catch((error) => {
      if (
        (error instanceof Error && error.message === "SLOT_TAKEN") ||
        (typeof error === "object" && error !== null && "code" in error && error.code === "P2034")
      ) return null;
      throw error;
    });

    if (!newAppointment) {
      return NextResponse.json(
        { error: "Spiacenti, qualcuno ha appena prenotato questo orario!" },
        { status: 409 }
      );
    }

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

    // 🌟 INVIO SMS/WHATSAPP CON MOTORE REALE DISATTIVATO
    // Il cliente invia la conferma manualmente via wa.me dal front-end.
    // Il motore Green-API viene usato solo per i promemoria del giorno prima.

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
