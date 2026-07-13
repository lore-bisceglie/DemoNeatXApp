import { prisma } from "./prisma";
import twilio from "twilio";

const WHATSAPP_TEMPLATE_SID = process.env.TWILIO_WHATSAPP_TEMPLATE_SID || "";
const WHATSAPP_MSG_SVC_SID = process.env.TWILIO_WHATSAPP_MSG_SVC_SID || "";

interface WhatsAppTemplateVars {
  storeName: string;
  customerName: string;
  date: string;
  time: string;
}

function formatPhone(raw: string): string {
  let p = raw.replace(/[^0-9+]/g, "");
  if (!p.startsWith("+")) p = `+39${p}`;
  return p;
}

async function deductCredit(tenantId: string) {
  await prisma.storeSettings.update({
    where: { tenantId },
    data: { smsCredits: { decrement: 1 } },
  });
}

async function checkCredits(tenantId: string): Promise<boolean> {
  const store = await prisma.storeSettings.findUnique({ where: { tenantId } });
  return !!store && store.smsCredits > 0;
}

export async function sendTenantMessage(
  tenantId: string,
  toPhone: string,
  smsBody: string,
  whatsappVars?: WhatsAppTemplateVars,
  locationId?: string
) {
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_TOKEN = process.env.TWILIO_AUTH_TOKEN;
  const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER;

  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.error("[sms] Credenziali Twilio mancanti");
    return { success: false, error: "Twilio non configurato" };
  }

  try {
    const hasCredits = await checkCredits(tenantId);
    if (!hasCredits) {
      console.warn(`[sms] Salone ${tenantId} crediti esauriti`);
      return { success: false, error: "Crediti esauriti" };
    }

    const phone = formatPhone(toPhone);
    const client = twilio(TWILIO_SID, TWILIO_TOKEN);

    // TRY 1: WhatsApp via MessagingService + template approvato
    if (WHATSAPP_MSG_SVC_SID) {
      try {
        let msg;
        if (whatsappVars && WHATSAPP_TEMPLATE_SID) {
          msg = await client.messages.create({
            contentSid: WHATSAPP_TEMPLATE_SID,
            contentVariables: JSON.stringify({
              "1": whatsappVars.storeName,
              "2": whatsappVars.customerName,
              "3": whatsappVars.date,
              "4": whatsappVars.time,
            }),
            messagingServiceSid: WHATSAPP_MSG_SVC_SID,
            to: `whatsapp:${phone}`,
          });
        } else {
          msg = await client.messages.create({
            body: smsBody,
            messagingServiceSid: WHATSAPP_MSG_SVC_SID,
            to: `whatsapp:${phone}`,
          });
        }
        if (!msg.errorCode) {
          await deductCredit(tenantId);
          console.log(`[WHATSAPP] Inviato a ${phone} (sid: ${msg.sid})`);
          return { success: true, messageId: msg.sid, channel: "whatsapp" as const };
        }
        console.warn(`[sms] WhatsApp fallito (${msg.errorCode}), passo a SMS...`);
      } catch (waErr: any) {
        console.warn(`[sms] WhatsApp eccezione: ${waErr.message}, passo a SMS...`);
      }
    }

    // PIANO B: SMS classico
    try {
      const msg = await client.messages.create({
        body: smsBody,
        from: TWILIO_FROM,
        to: phone,
      });
      await deductCredit(tenantId);
      console.log(`[SMS] Inviato a ${phone} (sid: ${msg.sid})`);
      return { success: true, messageId: msg.sid, channel: "sms" as const };
    } catch (smsErr: any) {
      console.error(`[sms] SMS fallito: ${smsErr.message}`);
      return { success: false, error: smsErr.message || "Errore SMS" };
    }
  } catch (err: any) {
    console.error("[sms] Errore critico:", err);
    return { success: false, error: err.message || "Errore interno" };
  }
}

export const sendTenantSms = sendTenantMessage;
