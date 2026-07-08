import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendTelegramMessage } from "@/lib/telegram";

const prisma = new PrismaClient();

// Invia una risposta al click di un bottone inline per far smettere di caricare l'orologino
async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text: text || "",
    }),
  });
}

// Aggiorna un messaggio (es. rimuove i bottoni dopo che è stato premuto)
async function editMessageText(chatId: string, messageId: number, text: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return;
  
  const url = `https://api.telegram.org/bot${botToken}/editMessageText`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: "HTML"
    }),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authorizedChatId = process.env.TELEGRAM_CHAT_ID;

    // 1. Gestione Callback Query (Bottoni Inline)
    if (body.callback_query) {
      const cb = body.callback_query;
      const chatId = cb.message.chat.id.toString();
      const messageId = cb.message.message_id;
      const data = cb.data; // es. "approve_123" o "delete_123"

      // Sicurezza: esegue comandi solo se cliccati dal Boss
      if (chatId !== authorizedChatId) {
        await answerCallbackQuery(cb.id, "Non sei autorizzato.");
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith("delete_")) {
        const tenantId = data.replace("delete_", "");
        try {
          await prisma.tenant.delete({ where: { id: tenantId } });
          await answerCallbackQuery(cb.id, "❌ Salone eliminato definitivamente!");
          await editMessageText(chatId, messageId, `<s>${cb.message.text}</s>\n\n<b>[Eliminato come SPAM]</b>`);
        } catch (e) {
          await answerCallbackQuery(cb.id, "Errore durante l'eliminazione.");
        }
      } 
      else if (data.startsWith("approve_")) {
        const tenantId = data.replace("approve_", "");
        try {
          // Aggiorniamo il piano a Premium
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { plan: "PRO" }
          });
          await answerCallbackQuery(cb.id, "✅ Salone promosso a PRO!");
          await editMessageText(chatId, messageId, `${cb.message.text}\n\n<b>[Approvato: Piano PRO attivo]</b>`);
        } catch (e) {
          await answerCallbackQuery(cb.id, "Errore durante l'approvazione.");
        }
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Gestione Messaggi di Testo (Comandi)
    if (body.message && body.message.text) {
      const text = body.message.text.trim();
      const chatId = body.message.chat.id.toString();

      // Sicurezza
      if (chatId !== authorizedChatId) {
        return NextResponse.json({ ok: true });
      }

      if (text === "/stats") {
        // Calcolo rapido statistiche
        const tenantsCount = await prisma.tenant.count();
        const appointmentsCount = await prisma.appointment.count();
        const mrr = tenantsCount * 29.99; // Stima di 30€ al mese per salone
        
        const reply = `📊 <b>STATISTICHE NEATX</b>\n\n🏢 <b>Saloni iscritti:</b> ${tenantsCount}\n📅 <b>Prenotazioni totali:</b> ${appointmentsCount}\n💰 <b>MRR Stimato:</b> ${mrr.toFixed(2)}€`;
        await sendTelegramMessage(reply);
      } 
      else if (text === "/ultimi") {
        const latest = await prisma.tenant.findMany({
          take: 3,
          orderBy: { createdAt: "desc" },
          select: { name: true, category: true, city: true }
        });
        
        let reply = `🆕 <b>ULTIMI 3 SALONI ISCRITTI</b>\n\n`;
        latest.forEach((t, i) => {
          reply += `${i+1}. <b>${t.name}</b> (${t.category})\n📍 ${t.city}\n\n`;
        });
        await sendTelegramMessage(reply);
      }
      else if (text === "/start") {
        await sendTelegramMessage("🤖 <b>NeatX Maggiordomo</b>\nAi tuoi ordini, Capo. Usa /stats o /ultimi.");
      }

      return NextResponse.json({ ok: true });
    }

    // Se arrivano altri tipi di aggiornamenti
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Errore Webhook Telegram:", error);
    return NextResponse.json({ ok: true }); // Restituiamo sempre 200 a Telegram per non fargli ritentare in loop
  }
}
