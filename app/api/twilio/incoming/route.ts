import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Questo endpoint viene chiamato da Twilio ogni volta che un cliente risponde
// al numero NeatX su WhatsApp o SMS.
// Configurare su Twilio: Phone Numbers → Il tuo numero → Messaging → Webhook URL
// URL: https://neatx.store/api/twilio/incoming

export async function POST(req: Request) {
  try {
    const formData = await req.text();
    const params = new URLSearchParams(formData);

    const from = params.get("From") || "";
    const body = params.get("Body") || "";
    const isWhatsApp = from.startsWith("whatsapp:");

    console.log(`📩 Messaggio in entrata da ${from}: "${body}"`);

    // Risposta automatica TwiML
    const autoReply = isWhatsApp
      ? "Ciao! 👋 Questo è un servizio automatico per la gestione appuntamenti e non leggiamo i messaggi.\n\nPer parlare con il salone, contattali direttamente sul loro numero.\n\nSe devi annullare un appuntamento, clicca il link nel promemoria che hai ricevuto. Grazie! 🙏"
      : "Ciao! Questo è un servizio automatico. Per parlare con il salone, contattali direttamente. Per annullare un appuntamento, usa il link nel promemoria. Grazie!";

    // Twilio si aspetta una risposta TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${autoReply}</Message>
</Response>`;

    return new Response(twiml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Errore incoming message:", error);
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { status: 200, headers: { "Content-Type": "text/xml" } }
    );
  }
}
