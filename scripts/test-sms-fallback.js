require('dotenv').config({ path: '.env' });
const twilio = require('twilio');

async function sendSmsFallback() {
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;
  
  const client = twilio(TWILIO_SID, TWILIO_TOKEN);
  const phone = "+393480480942"; // The user's number

  console.log("Simulo il fallback: WhatsApp è bloccato, quindi il sistema passa agli SMS standard...");

  try {
    const msg = await client.messages.create({
      body: "NeatX: Ciao Lorenzo! Visto che WhatsApp è momentaneamente bloccato da Meta, questo è il 'Piano B' in azione. I tuoi clienti riceveranno un SMS standard!",
      from: TWILIO_FROM,
      to: phone
    });
    console.log("SMS Fallback inviato con successo! SID:", msg.sid);
  } catch (err) {
    console.error("Errore SMS Fallback:", err.message);
  }
}

sendSmsFallback();
