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

    // 4. Invia l'SMS tramite le API REST di Twilio (senza bisogno della libreria SDK)
    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");
    
    const twilioResponse = await fetch(
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

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("❌ Errore API Twilio:", twilioData);
      return { success: false, error: twilioData.message || "Errore sconosciuto Twilio" };
    }

    // 5. Se l'invio ha successo, scala 1 credito dal saldo del salone
    await prisma.storeSettings.update({
      where: { tenantId },
      data: {
        smsCredits: { decrement: 1 },
      },
    });

    console.log(
      `✅ SMS inviato a ${formattedPhone} per il tenant ${tenantId}. Crediti residui: ${storeSettings.smsCredits - 1}`
    );

    return { success: true, messageId: twilioData.sid };
  } catch (error) {
    console.error("❌ Errore critico nel motore SMS:", error);
    return { success: false, error: "Errore interno del motore SMS" };
  }
}
