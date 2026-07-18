import { prisma } from "./prisma";

// Green-API configuration
const GREEN_API_ID_INSTANCE = process.env.GREEN_API_ID_INSTANCE || "";
const GREEN_API_TOKEN_INSTANCE = process.env.GREEN_API_TOKEN_INSTANCE || "";

interface WhatsAppTemplateVars {
  storeName: string;
  customerName: string;
  date: string;
  time: string;
}

function formatPhone(raw: string): string {
  // Mantieni solo i numeri
  let p = raw.replace(/\D/g, "");
  // Aggiungi 39 se non c'è, perché Green API vuole il formato internazionale senza +
  if (!p.startsWith("39")) {
    p = `39${p}`;
  }
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
  if (!GREEN_API_ID_INSTANCE || !GREEN_API_TOKEN_INSTANCE) {
    console.error("[whatsapp] Credenziali Green API mancanti");
    return { success: false, error: "Green API non configurato" };
  }

  try {
    const hasCredits = await checkCredits(tenantId);
    if (!hasCredits) {
      console.warn(`[whatsapp] Salone ${tenantId} crediti esauriti`);
      return { success: false, error: "Crediti esauriti" };
    }

    const phone = formatPhone(toPhone);
    // Endpoint ufficiale che instrada automaticamente la richiesta verso il
    // server corretto dell'istanza.
    const url = `https://api.green-api.com/waInstance${GREEN_API_ID_INSTANCE}/sendMessage/${GREEN_API_TOKEN_INSTANCE}`;
    
    // In WhatsApp con Green API mandiamo il body diretto, non ci serve il template.
    const payload = {
      chatId: `${phone}@c.us`,
      message: smsBody,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.idMessage) {
      await deductCredit(tenantId);
      console.log(`[WHATSAPP] Inviato a ${phone} (id: ${data.idMessage})`);
      return { success: true, messageId: data.idMessage, channel: "whatsapp" as const };
    } else {
      console.error(`[whatsapp] Fallito:`, data);
      return { success: false, error: "Errore invio WhatsApp" };
    }
  } catch (err: any) {
    console.error("[whatsapp] Errore critico:", err);
    return { success: false, error: err.message || "Errore interno" };
  }
}

export const sendTenantSms = sendTenantMessage;
