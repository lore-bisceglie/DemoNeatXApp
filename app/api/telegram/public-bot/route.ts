import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

async function answerCallbackQuery(botToken: string, callbackQueryId: string, text?: string) {
  const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text: text || "" }),
  });
}

async function editMessageText(botToken: string, chatId: string, messageId: number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${botToken}/editMessageText`;
  const payload: any = {
    chat_id: chatId,
    message_id: messageId,
    text: text,
    parse_mode: "HTML",
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function sendMessage(botToken: string, chatId: string, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const payload: any = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
  };
  if (replyMarkup) payload.reply_markup = replyMarkup;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const botToken = process.env.TELEGRAM_PUBLIC_BOT_TOKEN;

    if (!botToken) {
      console.warn("Manca TELEGRAM_PUBLIC_BOT_TOKEN");
      return NextResponse.json({ ok: true });
    }

    // 1. Gestione Callback Query (Bottoni Inline)
    if (body.callback_query) {
      const cb = body.callback_query;
      const chatId = cb.message.chat.id.toString();
      const messageId = cb.message.message_id;
      const data = cb.data;

      if (data === "step1") {
        await answerCallbackQuery(botToken, cb.id);
        const text = "🛒 <b>Qual è il tuo scontrino medio?</b>\nSeleziona l'opzione che si avvicina di più al prezzo di un tuo servizio, seduta o consulenza media:";
        const markup = {
          inline_keyboard: [
            [{ text: "15€ - 20€", callback_data: "step2_18" }],
            [{ text: "25€ - 30€", callback_data: "step2_28" }],
            [{ text: "40€ o più", callback_data: "step2_45" }]
          ]
        };
        await editMessageText(botToken, chatId, messageId, text, markup);
      } 
      else if (data.startsWith("step2_")) {
        const price = data.replace("step2_", "");
        await answerCallbackQuery(botToken, cb.id);
        const text = "📅 <b>Quanti clienti ti danno buca?</b>\nTra dimenticanze e ritardi pesanti, quanti appuntamenti saltano in media ogni settimana?";
        const markup = {
          inline_keyboard: [
            [{ text: "2 - 3 clienti", callback_data: `step3_${price}_2.5` }],
            [{ text: "4 - 6 clienti", callback_data: `step3_${price}_5` }],
            [{ text: "Più di 10 (Aiuto!)", callback_data: `step3_${price}_12` }]
          ]
        };
        await editMessageText(botToken, chatId, messageId, text, markup);
      }
      else if (data.startsWith("step3_")) {
        const parts = data.split("_");
        const price = parseFloat(parts[1]);
        const missed = parseFloat(parts[2]);
        
        const weeklyLoss = price * missed;
        const monthlyLoss = weeklyLoss * 4;
        const yearlyLoss = monthlyLoss * 12;

        await answerCallbackQuery(botToken, cb.id);
        
        const text = `🚨 <b>ANALISI COMPLETATA</b> 🚨\n\nStai letteralmente bruciando circa <b>${monthlyLoss.toFixed(0)}€ al mese</b> (ben ${yearlyLoss.toFixed(0)}€ all'anno!) a causa dei clienti sbadati.\n\nQuei soldi dovrebbero essere nelle tue tasche. Le aziende più avanzate risolvono il problema inviando promemoria automatici su WhatsApp.\n\nCon <b>NeatX</b> puoi creare il tuo sistema di promemoria e gestione appuntamenti che lavora per te giorno e notte.\n\n👉 <b>Recupera i tuoi soldi oggi stesso:</b> Clicca qui sotto per configurare gratis la tua Intelligenza Artificiale in 30 secondi.`;
        
        const markup = {
          inline_keyboard: [
            [{ text: "🚀 Inizia Prova Gratuita (14 Giorni)", url: "https://demo-neatx.vercel.app/onboarding?source=telegram_funnel" }]
          ]
        };
        
        await editMessageText(botToken, chatId, messageId, text, markup);
        
        // Estraiamo i dati di chi sta cliccando
        const userFirstName = cb.from?.first_name || "Un imprenditore";
        const userUsername = cb.from?.username ? `@${cb.from.username}` : "(Senza Username Telegram)";

        // Alert the Boss (using the private Maggiordomo)
        await sendTelegramMessage(`🕵️‍♂️ <b>LEAD MAGNET ALERT</b>\n\n<b>${userFirstName}</b> ${userUsername} ha appena completato il Calcolatore Pubblico! 💸\nHa scoperto di perdere <b>${monthlyLoss.toFixed(0)}€ al mese</b>.\n\nSi è spaventato ed è molto probabile che clicchi il link di iscrizione a NeatX. Tienilo d'occhio! Se non si iscrive entro 10 minuti, scrivigli in privato cliccando sul suo username!`);
      }

      return NextResponse.json({ ok: true });
    }

    // 2. Gestione Messaggi di Testo (/start)
    if (body.message && body.message.text) {
      const text = body.message.text.trim();
      const chatId = body.message.chat.id.toString();

      if (text === "/start") {
        const reply = "👋 Ciao! Sono l'Assistente Virtuale per Professionisti e Imprenditori.\n\nSapevi che chi lavora su appuntamento perde in media il 15% del fatturato mensile a causa di clienti ritardatari o dimenticanze?\n\n👇 <b>Premi il bottone qui sotto per scoprire in 10 secondi esatti quanti soldi ti stanno rubando ogni mese:</b>";
        const markup = {
          inline_keyboard: [
            [{ text: "💸 Avvia il Calcolatore", callback_data: "step1" }]
          ]
        };
        await sendMessage(botToken, chatId, reply, markup);
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Errore Webhook Bot Pubblico:", error);
    return NextResponse.json({ ok: true }); 
  }
}
