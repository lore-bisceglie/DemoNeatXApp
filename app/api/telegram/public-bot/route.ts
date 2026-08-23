import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";
import { getTelegramWebhookSecret } from "@/lib/telegram-auth";

async function answerCallbackQuery(botToken: string, callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text || "" }),
  });
}

async function editMessageText(botToken: string, chatId: string, messageId: number, text: string, replyMarkup?: any) {
  const payload: any = {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function sendMessage(botToken: string, chatId: string, text: string, replyMarkup?: any) {
  const payload: any = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function POST(req: Request) {
  const webhookSecret = getTelegramWebhookSecret();
  if (
    !webhookSecret ||
    req.headers.get("x-telegram-bot-api-secret-token") !== webhookSecret
  ) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const botToken = process.env.TELEGRAM_PUBLIC_BOT_TOKEN;

    if (!botToken) {
      console.warn("Manca TELEGRAM_PUBLIC_BOT_TOKEN");
      return NextResponse.json({ ok: true });
    }

    if (body.callback_query) {
      const cb = body.callback_query;
      const chatId = cb.message.chat.id.toString();
      const messageId = cb.message.message_id;
      const data = String(cb.data || "");

      if (data === "step1") {
        await answerCallbackQuery(botToken, cb.id);
        await editMessageText(
          botToken,
          chatId,
          messageId,
          "🧾 <b>Qual è il tuo scontrino medio?</b>\nSeleziona il prezzo medio di un tuo servizio, trattamento o consulenza:",
          {
            inline_keyboard: [
              [{ text: "15€ - 20€", callback_data: "step2_18" }],
              [{ text: "25€ - 30€", callback_data: "step2_28" }],
              [{ text: "40€ o più", callback_data: "step2_45" }],
            ],
          }
        );
      } else if (data.startsWith("step2_")) {
        const price = data.replace("step2_", "");
        await answerCallbackQuery(botToken, cb.id);
        await editMessageText(
          botToken,
          chatId,
          messageId,
          "📅 <b>Quanti clienti saltano l'appuntamento?</b>\nTra dimenticanze, ritardi pesanti e buchi in agenda, quanti appuntamenti perdi in media ogni settimana?",
          {
            inline_keyboard: [
              [{ text: "2 - 3 clienti", callback_data: `step3_${price}_2.5` }],
              [{ text: "4 - 6 clienti", callback_data: `step3_${price}_5` }],
              [{ text: "Più di 10", callback_data: `step3_${price}_12` }],
            ],
          }
        );
      } else if (data.startsWith("step3_")) {
        const parts = data.split("_");
        const price = parseFloat(parts[1]);
        const missed = parseFloat(parts[2]);

        const weeklyLoss = price * missed;
        const monthlyLoss = weeklyLoss * 4;
        const yearlyLoss = monthlyLoss * 12;

        await answerCallbackQuery(botToken, cb.id);

        const text =
          "🚨 <b>Analisi completata</b>\n\n" +
          `Stai perdendo circa <b>${monthlyLoss.toFixed(0)}€ al mese</b>, cioè <b>${yearlyLoss.toFixed(0)}€ all'anno</b>, per appuntamenti saltati o gestiti male.\n\n` +
          "Con <b>NeatX</b> puoi mettere online la tua agenda, far scegliere gli orari ai clienti, richiedere acconti quando serve e ridurre i buchi senza rincorrere messaggi tutto il giorno.\n\n" +
          "<b>Promemoria automatici:</b> NeatX invia ai clienti un promemoria WhatsApp prima dell'appuntamento, usando i crediti del negozio.\n\n" +
          "Clicca qui sotto per creare gratis il tuo negozio di prova.";

        await editMessageText(botToken, chatId, messageId, text, {
          inline_keyboard: [
            [{ text: "Inizia prova gratuita 14 giorni", url: "https://www.neatx.store/onboarding?source=telegram_funnel" }],
          ],
        });

        const userFirstName = escapeHtml(cb.from?.first_name || "Un imprenditore");
        const userUsername = cb.from?.username ? `@${escapeHtml(cb.from.username)}` : "(senza username Telegram)";

        await sendTelegramMessage(
          "🧲 <b>LEAD MAGNET COMPLETATO</b> 🧲\n\n" +
          `👤 <b>${userFirstName}</b> ${userUsername} ha completato il calcolatore pubblico.\n` +
          `💰 Perdita stimata: <b>${monthlyLoss.toFixed(0)}€ al mese</b>.\n\n` +
          "Azione consigliata: controlla se si registra. Se non entra entro 10 minuti, puoi contattarlo manualmente dal suo username se disponibile."
        );
      }

      return NextResponse.json({ ok: true });
    }

    if (body.message && body.message.text) {
      const text = String(body.message.text).trim();
      const chatId = body.message.chat.id.toString();

      if (text === "/start") {
        await sendMessage(
          botToken,
          chatId,
          "👋 Ciao! Sono l'assistente NeatX per professionisti che lavorano su appuntamento.\n\nVuoi stimare quanti soldi perdi ogni mese tra appuntamenti saltati, ritardi e buchi in agenda?\n\nPremi il bottone qui sotto: il calcolo richiede meno di 10 secondi.",
          {
            inline_keyboard: [
              [{ text: "Avvia il calcolatore", callback_data: "step1" }],
            ],
          }
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Errore Webhook Bot Pubblico:", error);
    return NextResponse.json({ ok: true });
  }
}
