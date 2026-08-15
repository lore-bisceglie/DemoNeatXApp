import { prisma } from "./prisma";

// UltraMsg configuration
const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || "";
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || "";

interface WhatsAppTemplateVars {
  storeName: string;
  customerName: string;
  date: string;
  time: string;
  serviceName?: string;
  cancelUrl?: string;
}

function formatPhone(raw: string): string {
  let p = raw.replace(/\D/g, "");
  if (!p.startsWith("39")) {
    p = `39${p}`;
  }
  return `+${p}`;
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
  smsBody: string,
  _whatsappVars?: WhatsAppTemplateVars,
  _locationId?: string
) {
  if (process.env.REMINDERS_ENABLED !== "true") {
    return { success: false, disabled: true, error: "Promemoria disattivati" };
  }
  if (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN) {
    return { success: false, error: "UltraMsg non configurato" };
  }

  try {
    const creditReserved = await reserveCredit(tenantId);
    if (!creditReserved) {
      console.warn(`[whatsapp] Salone ${tenantId} crediti esauriti`);
      return { success: false, error: "Crediti esauriti" };
    }

    const phone = formatPhone(toPhone);
    const url = `https://api.ultramsg.com/${ULTRAMSG_INSTANCE_ID}/messages/chat`;

    const payload = new URLSearchParams({
      token: ULTRAMSG_TOKEN,
      to: phone,
      body: smsBody,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString(),
    });

    const data = await response.json();

    if (response.ok && data.id) {
      console.log(`[WHATSAPP] Inviato a ${phone} (id: ${data.id})`);
      return { success: true, messageId: data.id, channel: "whatsapp" as const };
    } else {
      await refundCredit(tenantId);
      console.error(`[whatsapp] Fallito:`, data);
      // Keep the provider response available to the preview-only reminder
      // endpoint so the automation can report a useful diagnostic. The
      // production reminder UI still receives a generic failure message.
      const providerError =
        typeof data?.error === "string" ? data.error :
        typeof data?.message === "string" ? data.message :
        "Errore invio WhatsApp";
      return { success: false, error: providerError };
    }
  } catch (err: any) {
    await refundCredit(tenantId).catch(() => undefined);
    console.error("[whatsapp] Errore critico:", err);
    return { success: false, error: err.message || "Errore interno" };
  }
}

export const sendTenantSms = sendTenantMessage;
