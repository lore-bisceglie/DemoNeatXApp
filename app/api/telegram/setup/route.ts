import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    return NextResponse.json({ error: "Token non configurato" }, { status: 500 });
  }

  // Costruisce l'URL completo del server in produzione (Vercel) o lo prende da env
  const host = req.headers.get("host");
  const protocol = host?.includes("localhost") ? "http" : "https";
  const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;

  const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      webhook_url: webhookUrl,
      telegram_response: data 
    });
  } catch (error) {
    return NextResponse.json({ error: "Impossibile impostare il webhook" }, { status: 500 });
  }
}
