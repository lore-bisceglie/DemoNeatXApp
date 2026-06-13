import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const formData = await req.formData();
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 1. 🛡️ SCUDO DI VALIDAZIONE PER LE FERIE
    // Creiamo una lista di tutte le date che l'estetista vuole bloccare
    const datesToCheck: string[] = [];
    const checkLoop = new Date(start);
    while (checkLoop <= end) {
      datesToCheck.push(checkLoop.toISOString().split("T")[0]);
      checkLoop.setDate(checkLoop.getDate() + 1);
    }

    // Cerchiamo nel database se c'è ALMENO UN cliente VERO in quei giorni
    // Il trucco: i clienti veri non hanno il numero 0000000000
    const existingRealAppointments = await prisma.appointment.findFirst({
      where: {
        date: { in: datesToCheck },
        customerPhone: { not: "0000000000" } 
      }
    });

    if (existingRealAppointments) {
      // PERICOLO: C'è un cliente in mezzo alle ferie! 
      // Blocchiamo tutto e mandiamo un errore alla dashboard
      return NextResponse.redirect(new URL("/dashboard?error=overlap_holiday", req.url));
    }

    // 2. VIA LIBERA: Nessun cliente vero in quei giorni. Procediamo!
    const loop = new Date(start);
    
    // Ciclo magico che blocca tutti i giorni nel range
    while (loop <= end) {
      const d = loop.toISOString().split("T")[0];
      
      // Prima eliminiamo eventuali vecchie pause o ferie in quel giorno per evitare doppioni sporchi nel database
      await prisma.appointment.deleteMany({
        where: { date: d, customerPhone: "0000000000" }
      });

      // Creiamo la giornata di ferie pulita
      await prisma.appointment.create({
        data: { customerName: "🌴 FERIE", customerPhone: "0000000000", date: d, time: "ALL_DAY" }
      });
      
      loop.setDate(loop.getDate() + 1);
    }
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}