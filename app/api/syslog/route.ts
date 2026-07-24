import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { message, stack, url } = await req.json();
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    
    if (!botToken || !chatId) {
      return NextResponse.json({ success: false, reason: "Telegram non configurato" });
    }

    const text = `🚨 <b>CRASH FRONTEND (Next.js)</b>\n\n<b>URL:</b> ${url || "Sconosciuto"}\n\n<b>Errore:</b>\n<code>${message || "Errore Sconosciuto"}</code>\n\n<b>Stack Trace parziale:</b>\n<pre>${stack ? stack.substring(0, 600) : "Nessuno stack"}</pre>`;

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML"
      })
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ success: false });
  }
}
