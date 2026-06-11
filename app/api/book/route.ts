import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 🌟 LA SPIA: Questo stamperà nel terminale di VS Code i dati esatti che arrivano
    console.log("📥 DATI RICEVUTI DAL SITO:", body); 

    const { customerName, customerPhone, date, time, honey, tenantId, serviceId } = body;

    // Honeypot anti-bot
    if (honey && honey !== "") {
      return NextResponse.json({ success: true });
    }
    
    // Controllo sicurezza base
    if (!customerName || !customerPhone || !date || !time || !tenantId) {
      return NextResponse.json({ error: "Per favore, compila tutti i campi." }, { status: 400 });
    }

    // Selezioniamo il controllo doppio
    const appuntamentoEsistente = await prisma.appointment.findFirst({
      where: { date: date, time: time, tenantId: tenantId },
    });

    if (appuntamentoEsistente) {
      return NextResponse.json({ error: "Orario occupato!" }, { status: 400 });
    }

    // 🌟 SALVATAGGIO REALE: Qui forziamo l'inserimento del serviceId
    const newAppointment = await prisma.appointment.create({
      data: {
        customerName: customerName,
        customerPhone: customerPhone,
        date: date,
        time: time,
        tenantId: tenantId, 
        serviceId: serviceId || null, // Assicuriamoci che venga salvato!
      },
    });

    console.log("✅ SALVATO NEL DB CON SUCCESSO!");
    return NextResponse.json({ success: true, appointment: newAppointment });

  } catch (error) {
    console.error("❌ Errore salvataggio:", error);
    return NextResponse.json({ error: "Errore durante il salvataggio." }, { status: 500 });
  }
}