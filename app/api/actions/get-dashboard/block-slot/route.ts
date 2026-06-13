import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();
  const date = formData.get("date") as string;
  const time = formData.get("time") as string;
  
  if (date && time) {
    // 🛡️ SCUDO DI VALIDAZIONE: Controlla se c'è già qualcosa in quel giorno/orario
    const existingAppointment = await prisma.appointment.findFirst({
      where: { 
        date: date, 
        time: time 
      }
    });

    if (existingAppointment) {
      // PERICOLO: C'è già un appuntamento (o un'altra pausa)! 
      // Blocchiamo la creazione e rimbalziamo l'utente alla dashboard con un codice di errore nell'URL
      return NextResponse.redirect(new URL("/dashboard?error=overlap", req.url));
    }

    // VIA LIBERA: L'orario è vuoto, procediamo a creare la pausa
    await prisma.appointment.create({
      data: { customerName: "☕ PAUSA", customerPhone: "0000000000", date, time }
    });
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}