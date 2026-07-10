import { prisma } from "./prisma";

export async function sendTenantSms(
  tenantId: string,
  toPhone: string,
  messageBody: string
) {
  // 1. Controlla se Twilio è configurato
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.error("❌ Credenziali Twilio mancanti nel file .env!");
    return { success: false, error: "Twilio non configurato" };
  }

  try {
    // 2. Controlla i crediti del salone nel database
    const storeSettings = await prisma.storeSettings.findUnique({
      where: { tenantId },
    });

    if (!storeSettings || storeSettings.smsCredits <= 0) {
      console.warn(
        `⚠️ Tentativo di invio SMS bloccato: Il salone (tenantId: ${tenantId}) non ha crediti sufficienti (${storeSettings?.smsCredits || 0}).`
      );
      return { success: false, error: "Crediti SMS esauriti o non trovati" };
    }

    // 3. Formatta il numero di telefono per Twilio (aggiunge il + se manca, e rimuove gli spazi)
    let formattedPhone = toPhone.replace(/[^0-9+]/g, "");
    if (!formattedPhone.startsWith("+")) {
      // Assumiamo prefisso italiano di default se non è specificato
      formattedPhone = `+39${formattedPhone}`;
    }

    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

    // 4. TENTATIVO 1: WhatsApp Business (gratuito, tasso di lettura 98%)
    let sent = false;
    let messageId = "";

    try {
      console.log(`📱 Tentativo WhatsApp per ${formattedPhone}...`);
      
      const whatsappResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: `whatsapp:${formattedPhone}`,
            From: `whatsapp:${TWILIO_FROM}`,
            Body: messageBody,
          }).toString(),
        }
      );

      const whatsappData = await whatsappResponse.json();

      if (whatsappResponse.ok && !whatsappData.error_code) {
        console.log(`✅ WhatsApp inviato a ${formattedPhone} per il tenant ${tenantId}`);
        sent = true;
        messageId = whatsappData.sid;
      } else {
        console.warn(`⚠️ WhatsApp fallito (${whatsappData.error_code || whatsappData.status}), provo SMS...`);
      }
    } catch (whatsappError) {
      console.warn(`⚠️ WhatsApp errore di rete, provo SMS...`, whatsappError);
    }

    // 5. TENTATIVO 2 (Fallback): SMS classico se WhatsApp non ha funzionato
    if (!sent) {
      console.log(`📨 Fallback SMS per ${formattedPhone}...`);
      
      const smsResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: formattedPhone,
            From: TWILIO_FROM,
            Body: messageBody,
          }).toString(),
        }
      );

      const smsData = await smsResponse.json();

      if (!smsResponse.ok) {
        console.error("❌ Errore API Twilio (SMS fallback):", smsData);
        return { success: false, error: smsData.message || "Errore sconosciuto Twilio" };
      }

      console.log(`✅ SMS fallback inviato a ${formattedPhone} per il tenant ${tenantId}`);
      messageId = smsData.sid;
    }

    // 6. Scala 1 credito dal saldo del salone (sia per WhatsApp che per SMS)
    await prisma.storeSettings.update({
      where: { tenantId },
      data: {
        smsCredits: { decrement: 1 },
      },
    });

    console.log(
      `💰 Crediti residui per ${tenantId}: ${storeSettings.smsCredits - 1}`
    );

    return { success: true, messageId };
  } catch (error) {
    console.error("❌ Errore critico nel motore messaggi:", error);
    return { success: false, error: "Errore interno del motore messaggi" };
  }
}
