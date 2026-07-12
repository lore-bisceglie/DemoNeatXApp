import { prisma } from "./prisma";

// ContentSid del template WhatsApp approvato su Twilio
const WHATSAPP_TEMPLATE_SID = process.env.TWILIO_WHATSAPP_TEMPLATE_SID || "";

interface WhatsAppTemplateVars {
  storeName: string;      // {{1}}
  customerName: string;   // {{2}}
  date: string;           // {{3}}
  time: string;           // {{4}}
  cancelUrl: string;      // {{5}}
}

export async function sendTenantMessage(
  tenantId: string,
  toPhone: string,
  smsBody: string,
  whatsappVars?: WhatsAppTemplateVars
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
        `⚠️ Tentativo di invio bloccato: Il salone (tenantId: ${tenantId}) non ha crediti sufficienti (${storeSettings?.smsCredits || 0}).`
      );
      return { success: false, error: "Crediti esauriti o non trovati" };
    }

    // 3. Formatta il numero di telefono
    let formattedPhone = toPhone.replace(/[^0-9+]/g, "");
    if (!formattedPhone.startsWith("+")) {
      formattedPhone = `+39${formattedPhone}`;
    }

    const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString("base64");

    // 4. TENTATIVO 1: WhatsApp Business con template approvato
    let sent = false;
    let messageId = "";
    let channel = "sms";

    if (whatsappVars) {
      try {
        console.log(`📱 Tentativo WhatsApp (template) per ${formattedPhone}...`);

        // Usa ContentSid + ContentVariables per il template approvato da Meta
        const whatsappBody = new URLSearchParams({
          To: `whatsapp:${formattedPhone}`,
          From: `whatsapp:${TWILIO_FROM}`,
          ContentSid: WHATSAPP_TEMPLATE_SID,
          ContentVariables: JSON.stringify({
            "1": whatsappVars.storeName,
            "2": whatsappVars.customerName,
            "3": whatsappVars.date,
            "4": whatsappVars.time,
            "5": whatsappVars.cancelUrl,
          }),
        });

        const whatsappResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: whatsappBody.toString(),
          }
        );

        const whatsappData = await whatsappResponse.json();

        if (whatsappResponse.ok && !whatsappData.error_code) {
          console.log(`✅ WhatsApp inviato a ${formattedPhone} per il tenant ${tenantId}`);
          sent = true;
          messageId = whatsappData.sid;
          channel = "whatsapp";
        } else {
          console.warn(`⚠️ WhatsApp fallito (${whatsappData.error_code || whatsappData.status}): ${whatsappData.message || ""}, provo SMS...`);
        }
      } catch (whatsappError) {
        console.warn(`⚠️ WhatsApp errore di rete, provo SMS...`, whatsappError);
      }
    }

    // 5. TENTATIVO 2 (Fallback): SMS classico
    if (!sent) {
      console.log(`📨 ${whatsappVars ? "Fallback" : "Invio"} SMS per ${formattedPhone}...`);

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
            Body: smsBody,
          }).toString(),
        }
      );

      const smsData = await smsResponse.json();

      if (!smsResponse.ok) {
        console.error("❌ Errore API Twilio (SMS):", smsData);
        return { success: false, error: smsData.message || "Errore sconosciuto Twilio" };
      }

      console.log(`✅ SMS inviato a ${formattedPhone} per il tenant ${tenantId}`);
      messageId = smsData.sid;
      channel = "sms";
    }

    // 6. Scala 1 credito dal saldo del salone
    await prisma.storeSettings.update({
      where: { tenantId },
      data: {
        smsCredits: { decrement: 1 },
      },
    });

    console.log(
      `💰 [${channel.toUpperCase()}] Crediti residui per ${tenantId}: ${storeSettings.smsCredits - 1}`
    );

    return { success: true, messageId, channel };
  } catch (error) {
    console.error("❌ Errore critico nel motore messaggi:", error);
    return { success: false, error: "Errore interno del motore messaggi" };
  }
}

// Alias retrocompatibile per i file che usano ancora il vecchio nome
export const sendTenantSms = sendTenantMessage;
