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
  const commandsUrl = `https://api.telegram.org/bot${botToken}/setMyCommands`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Imposta anche il Menu
    const commandsResponse = await fetch(commandsUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        commands: [
          { command: "stats", description: "Calcola i profitti e le statistiche" },
          { command: "ultimi", description: "Mostra gli ultimi 3 negozi iscritti" },
          { command: "cerca", description: "Cerca un negozio per nome" },
          { command: "aiuto", description: "Mostra la guida ai comandi" }
        ]
      })
    });
    const commandsData = await commandsResponse.json();

    return NextResponse.json({ 
      success: true, 
      webhook_url: webhookUrl,
      telegram_webhook: data,
      telegram_menu: commandsData
    });
  } catch (error) {
    return NextResponse.json({ error: "Impossibile impostare il webhook" }, { status: 500 });
  }
}
