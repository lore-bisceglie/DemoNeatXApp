require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const twilio = require('twilio');

async function sendTest() {
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const WHATSAPP_MSG_SVC_SID = process.env.TWILIO_WHATSAPP_MSG_SVC_SID;
  const WHATSAPP_TEMPLATE_SID = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;

  if (!TWILIO_SID) {
    console.log("No Twilio env vars found.");
    return;
  }

  const client = twilio(TWILIO_SID, TWILIO_TOKEN);
  const phone = "+393480480942"; // The user's number from DB

  console.log("Invio test WhatsApp a:", phone);

  try {
    const msg = await client.messages.create({
      contentSid: WHATSAPP_TEMPLATE_SID,
      contentVariables: JSON.stringify({
        "1": "NeatX Test",
        "2": "Lorenzo",
        "3": "16 Luglio 2026",
        "4": "16:00"
      }),
      messagingServiceSid: WHATSAPP_MSG_SVC_SID,
      to: `whatsapp:${phone}`
    });
    console.log("Inviato con successo! SID:", msg.sid);
  } catch (err) {
    console.error("Errore:", err.message);
  }
}

sendTest().finally(() => prisma.$disconnect());
