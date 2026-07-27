import { prisma } from "./prisma";

// Meta WhatsApp Cloud API configuration
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const WHATSAPP_CLOUD_TOKEN = process.env.WHATSAPP_CLOUD_TOKEN || "";

interface WhatsAppTemplateVars {
  storeName: string;
  customerName: string;
  date: string;
  time: string;
  serviceName?: string;
  cancelUrl?: string;
}

function formatPhone(raw: string): string {
  // Mantieni solo i numeri
  let p = raw.replace(/\D/g, "");
  // Aggiungi 39 se non c'è, perché Meta Cloud API vuole il prefisso internazionale
  if (!p.startsWith("39")) {
    p = `39${p}`;
  }
  return p;
}

async function reserveCredit(tenantId: string) {
  const reserved = await prisma.storeSettings.updateMany({
    where: { tenantId, smsCredits: { gt: 0 } },
    data: { smsCredits: { decrement: 1 } },
  });
  return reserved.count === 1;
}

async function refundCredit(tenantId: string) {
  await prisma.storeSettings.update({
    where: { tenantId },
    data: { smsCredits: { increment: 1 } },
  });
}

export async function sendTenantMessage(
  tenantId: string,
  toPhone: string,
  _smsBody: string, // non usato con Meta Template, ignorato
  whatsappVars?: WhatsAppTemplateVars,
  _locationId?: string
) {
  if (process.env.REMINDERS_ENABLED !== "true") {
    return { success: false, disabled: true, error: "Promemoria disattivati" };
  }
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_CLOUD_TOKEN) {
    return { success: false, error: "Meta WhatsApp API non configurato" };
  }

  try {
    const creditReserved = await reserveCredit(tenantId);
    if (!creditReserved) {
      console.warn(`[whatsapp] Salone ${tenantId} crediti esauriti`);
      return { success: false, error: "Crediti esauriti" };
    }

    const phone = formatPhone(toPhone);
    const url = `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    
    // Payload per il template di promemoria ufficiale (Utility)
    const payload = {
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: "appointment_reminder",
        language: { code: "it" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: whatsappVars?.customerName || "Cliente" }, // {{1}}
              { type: "text", text: whatsappVars?.storeName || "il salone" }, // {{2}}
              { type: "text", text: whatsappVars?.date || "" }, // {{3}}
              { type: "text", text: whatsappVars?.time || "" }, // {{4}}
              { type: "text", text: whatsappVars?.serviceName || "Servizio" }, // {{5}}
              { type: "text", text: whatsappVars?.cancelUrl || "qui" } // {{6}}
            ]
          }
        ]
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${WHATSAPP_CLOUD_TOKEN}`
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.messages && data.messages.length > 0) {
      console.log(`[WHATSAPP] Inviato a ${phone} (id: ${data.messages[0].id})`);
      return { success: true, messageId: data.messages[0].id, channel: "whatsapp" as const };
    } else {
      await refundCredit(tenantId);
      console.error(`[whatsapp] Fallito:`, data);
      return { success: false, error: "Errore invio WhatsApp Meta" };
    }
  } catch (err: any) {
    await refundCredit(tenantId).catch(() => undefined);
    console.error("[whatsapp] Errore critico:", err);
    return { success: false, error: err.message || "Errore interno" };
  }
}

export const sendTenantSms = sendTenantMessage;
