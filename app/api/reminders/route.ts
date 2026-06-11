import { NextResponse } from "next/server";
import twilio from "twilio";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // 1. Inizializza Twilio con le tue chiavi segrete dal file .env
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // 2. Calcola la data di domani
    const domani = new Date();
    domani.setDate(domani.getDate() + 1);
    const dataDomani = domani.toISOString().split("T")[0];

    // 3. Cerca gli appuntamenti di domani nel Database
    const appuntamenti = await prisma.appointment.findMany({
      where: { date: dataDomani },
    });

    if (appuntamenti.length === 0) {
      return NextResponse.json({ message: "Nessun appuntamento per domani." });
    }

    // 4. Invia un messaggio WhatsApp a tutti i clienti trovati
    let inviati = 0;
    for (const app of appuntamenti) {
      
      // Controllo intelligente del numero di telefono
      let numeroDestinatario = app.customerPhone;
      
      // Se il cliente ha dimenticato il "+39", lo aggiunge il codice in automatico
      if (!numeroDestinatario.startsWith('+')) {
        numeroDestinatario = '+39' + numeroDestinatario;
      }

      // Spedizione su rete WhatsApp
      await client.messages.create({
        body: `Ciao ${app.customerName}, ti ricordiamo il tuo appuntamento domani alle ${app.time} da Acconciature da Mito!`,
        from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`,
        to: `whatsapp:${numeroDestinatario}` 
      });
      
      inviati++;
    }

    return NextResponse.json({ message: `Inviati ${inviati} promemoria WhatsApp con successo!` });

  } catch (error) {
    console.error("Errore nell'invio dei messaggi:", error);
    return NextResponse.json(
      { error: "Errore durante l'invio dei promemoria" },
      { status: 500 }
    );
  }
}