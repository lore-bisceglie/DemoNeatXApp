import { prisma } from "./prisma";

const BASE_URL = (process.env.OPENWA_BASE_URL || "").replace(/\/+$/, "");
const API_KEY = process.env.OPENWA_API_KEY || "";
const SESSION_ID = process.env.OPENWA_SESSION_ID || "";

async function reserveCredit(tenantId: string) {
  const result = await prisma.storeSettings.updateMany({
    where: { tenantId, smsCredits: { gt: 0 } },
    data: { smsCredits: { decrement: 1 } },
  });
  return result.count === 1;
}

async function refundCredit(tenantId: string) {
  await prisma.storeSettings.update({
    where: { tenantId },
    data: { smsCredits: { increment: 1 } },
  });
}

function chatId(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return `${digits.startsWith("39") ? digits : `39${digits}`}@c.us`;
}

export async function sendReminderOpenWa(phone: string, text: string) {
  if (!BASE_URL || !API_KEY || !SESSION_ID) {
    return { success: false as const, error: "OpenWA non configurato" };
  }

  try {
    const response = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/messages/send-text`, {
      method: "POST",
      headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: chatId(phone), text }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await response.json().catch(() => ({}));
    const messageId = data.messageId || data.message_id || data.id;

    if (response.ok && messageId && data.success !== false) {
      return {
        success: true as const,
        messageId: String(messageId),
        channel: "whatsapp" as const,
      };
    }

    return {
      success: false as const,
      error: String(data.error || data.message || "OpenWA ha rifiutato il messaggio"),
    };
  } catch (error) {
    return {
      success: false as const,
      error: error instanceof Error ? error.message : "Errore OpenWA",
    };
  }
}

/** Dedicated OpenWA sender for waitlist notifications. It intentionally does
 * not alter the legacy lib/sms.ts path used by cancellation flows. */
export async function sendWaitlistOpenWa(tenantId: string, phone: string, text: string) {
  if (process.env.REMINDERS_ENABLED !== "true") {
    return { success: false, error: "Promemoria disattivati" };
  }
  if (!BASE_URL || !API_KEY || !SESSION_ID) {
    return { success: false, error: "OpenWA non configurato" };
  }

  const reserved = await reserveCredit(tenantId);
  if (!reserved) return { success: false, error: "Crediti esauriti" };

  try {
    const response = await fetch(`${BASE_URL}/api/sessions/${SESSION_ID}/messages/send-text`, {
      method: "POST",
      headers: { "X-API-Key": API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ chatId: chatId(phone), text }),
    });
    const data = await response.json().catch(() => ({}));
    const messageId = data.messageId || data.message_id || data.id;
    if (response.ok && messageId && data.success !== false) {
      return { success: true, messageId, channel: "whatsapp" as const };
    }
    await refundCredit(tenantId);
    return { success: false, error: data.error || data.message || "OpenWA ha rifiutato il messaggio" };
  } catch (error) {
    await refundCredit(tenantId).catch(() => undefined);
    return { success: false, error: error instanceof Error ? error.message : "Errore OpenWA" };
  }
}
