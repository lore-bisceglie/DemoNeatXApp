import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { cookies } from "next/headers";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

const timeToMins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const minsToTime = (m: number) => { const h = Math.floor(m / 60).toString().padStart(2, '0'); const min = (m % 60).toString().padStart(2, '0'); return `${h}:${min}`; };

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "24 h"),
});

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
    } = body;
    const isDemoTenant = tenantId === "cmqtds1840000yyqbd23x1jdj";

    if (!isAdmin && !isDemoTenant) {
      const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: "Hai raggiunto il limite massimo di prenotazioni." }, { status: 429 });
      }
    }

    if (!isAdmin && honey && honey !== "") {
      return NextResponse.json({ success: true }); // Trappola anti-bot scattata
    }
    
    if (!customerName || !date || !time || !tenantId || !serviceId) {
      return NextResponse.json({ error: "Per favore, compila tutti i campi obbligatori." }, { status: 400 });
    }

    if (!isDemoTenant && customerName.trim().length < 3) {
      return NextResponse.json({ error: "Il nome inserito è troppo corto." }, { status: 400 });
    }

    const cleanPhone = customerPhone ? customerPhone.replace(/\s+/g, '') : "0000000000";
    const phoneRegex = /^[0-9]{8,15}$/;

    if (!isDemoTenant && !isAdmin && customerPhone && !phoneRegex.test(cleanPhone) && cleanPhone !== "0000" && cleanPhone !== "0000000000") {
      return NextResponse.json({ error: "Inserisci un numero di telefono valido." }, { status: 400 });
    }

    if (!isDemoTenant && !isAdmin && cleanPhone !== "0000" && cleanPhone !== "0000000000") {
      const noShowCount = await prisma.noShow.count({ where: { customerPhone: cleanPhone, tenantId } });
      if (noShowCount >= 3) {
        return NextResponse.json({ error: "Hai mancato troppi appuntamenti. Contatta direttamente l'attivita." }, { status: 403 });
      }
    }

    // 🌟 CALCOLO FINE SERVIZIO E DOPPIA VERIFICA SOVRAPPOSIZIONE
    const startMins = timeToMins(time);
    const endMins = startMins + parseInt(duration, 10);
    const endTime = minsToTime(endMins);

    const overlappingApps = await prisma.appointment.findMany({
      where: { date: date, tenantId: tenantId },
      select: { time: true, endTime: true, customerName: true }
    });

    const hasOverlap = overlappingApps.some(app => {
      const appStart = timeToMins(app.time);
      const appEnd = app.endTime ? timeToMins(app.endTime) : appStart + 15;
      return Math.max(startMins, appStart) < Math.min(endMins, appEnd);
    });

    if (hasOverlap) {
      return NextResponse.json({ error: "Spiacenti, qualcuno ha appena prenotato questo orario!" }, { status: 400 });
    }

    const newCancelToken = crypto.randomUUID();

    const newAppointment = await prisma.appointment.create({
      data: {
        customerName: customerName.trim(),
        customerPhone: cleanPhone,
        date: date,
        time: time,
        endTime: endTime, // 🌟 Salviamo l'impronta temporale
        source: source || "ONLINE",
        cancelToken: newCancelToken,
        tenantId: tenantId,
        serviceId: serviceId,
        isPaid: isDemoTenant && paymentMethod === "online",
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
