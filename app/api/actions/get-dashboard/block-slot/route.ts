import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Funzione matematica per convertire l'orario in minuti (es. 14:00 -> 840)
function timeToMins(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export async function POST(req: Request) {
  const formData = await req.formData();
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;

  if (date && time) {
    // 1. Carichiamo tutti gli appuntamenti di quella giornata
    const appointments = await prisma.appointment.findMany({
      where: { date: date }
    });

    // 2. Carichiamo i servizi per sapere quanto durano
    const services = await prisma.service.findMany();
    const durateServizi: Record<string, number> = {};
    services.forEach((s: any) => durateServizi[s.id] = s.duration);

    // 3. Calcoliamo lo spazio della pausa (ogni slot di pausa dura 15 minuti)
    const pauseStart = timeToMins(time);
    const pauseEnd = pauseStart + 15;

    let isOverlapping = false;

    // 4. Verifichiamo se c'è "schianto" con altri appuntamenti
    for (const app of appointments) {
      if (app.time === "ALL_DAY") continue; // Ignoriamo le ferie

      const appStart = timeToMins(app.time);
      // Se è un cliente prendiamo la sua durata, se è un'altra pausa vale 15 min
      const appDuration = (app.serviceId && durateServizi[app.serviceId]) ? durateServizi[app.serviceId] : 15;
      const appEnd = appStart + appDuration;

      // C'è sovrapposizione se la pausa inizia PRIMA della fine dell'appuntamento 
      // E finisce DOPO l'inizio dell'appuntamento
      if (pauseStart < appEnd && pauseEnd > appStart) {
        isOverlapping = true;
        break;
      }
    }

    // 5. Se rileva uno schianto, blocca l'inserimento nel database!
    if (isOverlapping) {
      return NextResponse.redirect(new URL("/dashboard?error=overlap", req.url));
    }

    // 6. Se è tutto libero, crea la pausa in sicurezza
    await prisma.appointment.create({
      data: { customerName: "☕ PAUSA", customerPhone: "0000000000", date, time }
    });
  }

  return NextResponse.redirect(new URL("/dashboard", req.url));
}