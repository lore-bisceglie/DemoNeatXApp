import { prisma } from "./prisma";

// Green-API configuration
const GREEN_API_ID_INSTANCE = process.env.GREEN_API_ID_INSTANCE || "";
const GREEN_API_TOKEN_INSTANCE = process.env.GREEN_API_TOKEN_INSTANCE || "";
const ULTRAMSG_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID || "";
const ULTRAMSG_TOKEN = process.env.ULTRAMSG_TOKEN || "";

type WhatsAppProvider = "ultramsg" | "greenapi";

function getWhatsAppProvider(): WhatsAppProvider {
  const configured = process.env.WHATSAPP_PROVIDER?.trim().toLowerCase();
  if (configured === "greenapi" || configured === "ultramsg") return configured;
  return ULTRAMSG_INSTANCE_ID && ULTRAMSG_TOKEN ? "ultramsg" : "greenapi";
}

interface WhatsAppTemplateVars {
  storeName: string;
  customerName: string;
  date: string;
  time: string;
}

function formatPhone(raw: string, provider: WhatsAppProvider): string {
  // Mantieni solo i numeri
  let p = raw.replace(/\D/g, "");
  // Aggiungi il prefisso italiano se manca quello internazionale.
  if (!p.startsWith("39")) {
    p = `39${p}`;
  }
  return provider === "ultramsg" ? `+${p}` : p;
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
  const provider = getWhatsAppProvider();
  if (provider === "ultramsg" && (!ULTRAMSG_INSTANCE_ID || !ULTRAMSG_TOKEN)) {
    return { success: false, error: "UltraMsg non configurato" };
  }
  if (provider === "greenapi" && (!GREEN_API_ID_INSTANCE || !GREEN_API_TOKEN_INSTANCE)) {
    return { success: false, error: "Green API non configurato" };
  }

  try {
    const creditReserved = await reserveCredit(tenantId);
    if (!creditReserved) {
      console.warn(`[whatsapp] Salone ${tenantId} crediti esauriti`);
      return { success: false, error: "Crediti esauriti" };
    }

    const phone = formatPhone(toPhone, provider);
    let url: string;
    let headers: Record<string, string>;
    let body: string;

    if (provider === "ultramsg") {
      url = `https://api.ultramsg.com/${encodeURIComponent(ULTRAMSG_INSTANCE_ID)}/messages/chat`;
      headers = { "Content-Type": "application/x-www-form-urlencoded" };
      body = new URLSearchParams({
        token: ULTRAMSG_TOKEN,
        to: phone,
        body: smsBody,
      }).toString();
    } else {
      url = `https://api.green-api.com/waInstance${GREEN_API_ID_INSTANCE}/sendMessage/${GREEN_API_TOKEN_INSTANCE}`;
      headers = { "Content-Type": "application/json" };
      body = JSON.stringify({ chatId: `${phone}@c.us`, message: smsBody });
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { Accept: "application/json", ...headers },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const responseText = await response.text();
    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(responseText) as Record<string, unknown>;
    } catch {
      // UltraMsg/Green API errors are occasionally returned as plain text.
      // Treat them as failed sends so the reserved credit is refunded.
    }
    const sent = provider === "ultramsg"
      ? (data.sent === true || data.sent === "true") && data.id !== undefined
      : typeof data.idMessage === "string" && data.idMessage.length > 0;

    if (response.ok && sent) {
      const messageId = String(provider === "ultramsg" ? data.id : data.idMessage);
      console.log(`[WHATSAPP:${provider}] Inviato a ${phone} (id: ${messageId})`);
      return { success: true, messageId, channel: "whatsapp" as const };
    } else {
      await refundCredit(tenantId);
      console.error(`[whatsapp] Fallito:`, data);
      return { success: false, error: "Errore invio WhatsApp" };
    }
  } catch (err: any) {
    await refundCredit(tenantId).catch(() => undefined);
    console.error("[whatsapp] Errore critico:", err);
    return { success: false, error: err.message || "Errore interno" };
  }
}

export const sendTenantSms = sendTenantMessage;

