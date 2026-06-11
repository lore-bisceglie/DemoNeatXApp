import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function timeToMins(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minsToTime(m: number) {
  const h = Math.floor(m / 60).toString().padStart(2, '0');
  const min = (m % 60).toString().padStart(2, '0');
  return `${h}:${min}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const tenantId = searchParams.get("tenantId");
  const durationStr = searchParams.get("duration");

  if (!date || !tenantId || !durationStr) {
    return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
  }

  const duration = parseInt(durationStr, 10);

  try {
    const appointments = await prisma.appointment.findMany({
      where: { date: date, tenantId: tenantId }
    });

    const services = await prisma.service.findMany({
      where: { tenantId: tenantId }
    });
    
    const durateServizi: Record<string, number> = {};
    services.forEach(s => durateServizi[s.id] = s.duration);

    const isHoliday = appointments.some(app => app.time === "ALL_DAY" || app.customerName.includes("FERIE"));
    if (isHoliday) {
      return NextResponse.json({ slots: [], isHoliday: true });
    }

    const bookedIntervals = appointments.map(app => {
      const startMins = timeToMins(app.time);
      const appDuration = (app.serviceId && durateServizi[app.serviceId]) ? durateServizi[app.serviceId] : 30;
      return { start: startMins, end: startMins + appDuration };
    });

    const workPeriods = [
      { start: timeToMins("09:00"), end: timeToMins("12:00") },
      { start: timeToMins("14:00"), end: timeToMins("19:00") }
    ];

    const availableSlots: string[] = [];
    const step = 15; 

    for (const period of workPeriods) {
      for (let current = period.start; current + duration <= period.end; current += step) {
        const slotStart = current;
        const slotEnd = current + duration;

        let hasOverlap = false;
        let touchesExisting = false;

        for (const booked of bookedIntervals) {
          if (slotStart < booked.end && slotEnd > booked.start) {
            hasOverlap = true;
            break;
          }
          if (slotStart === booked.end || slotEnd === booked.start) {
            touchesExisting = true;
          }
        }

        if (!hasOverlap) {
          const isTondo = (slotStart % 30 === 0); 
          const touchesBoundary = (slotStart === period.start || slotEnd === period.end); 

          if (isTondo || touchesBoundary || touchesExisting) {
            availableSlots.push(minsToTime(slotStart));
          }
        }
      }
    }

    return NextResponse.json({ slots: availableSlots, isHoliday: false });
    
  } catch (error) {
    return NextResponse.json({ error: "Errore di connessione" }, { status: 500 });
  }
}