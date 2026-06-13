import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function timeToMins(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;

  if (date && time) {
    const appointments = await prisma.appointment.findMany({ where: { date: date } });
    const services = await prisma.service.findMany();
    const durateServizi: Record<string, number> = {};
    services.forEach((s: any) => durateServizi[s.id] = s.duration);

    const pauseStart = timeToMins(time);
    const pauseEnd = pauseStart + 15;
    let isOverlapping = false;

    for (const app of appointments) {
      // Ignoriamo le ferie e le altre pause dal calcolo
      if (app.time === "ALL_DAY" || app.customerName.includes("FERIE") || app.customerName.includes("PAUSA")) continue;

      const appStart = timeToMins(app.time);
      const appDuration = (app.serviceId && durateServizi[app.serviceId]) ? durateServizi[app.serviceId] : 15;
      const appEnd = appStart + appDuration;

      // Se c'è un incastro con un VERO cliente, scatta l'allarme
      if (pauseStart < appEnd && pauseEnd > appStart) {
        isOverlapping = true;
        break;
      }
    }

    if (isOverlapping) {
      // 🚨 LA NOSTRA SPIA SEGRETA 🚨
      return NextResponse.redirect(new URL("/dashboard?error=SCUDO_PAUSA_ATTIVO", req.url));
    }

    await prisma.appointment.create({
      data: { customerName: "☕ PAUSA", customerPhone: "0000000000", date, time }
    });
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}