import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const publicBotToken = process.env.TELEGRAM_PUBLIC_BOT_TOKEN;
  
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
          { command: "entra", description: "Crea il link per il login magico" },
          { command: "agents", description: "Mostra lo stato degli Agenti AI" },
          { command: "lead", description: "Mostra gli ultimi 5 contatti ricevuti" },
          { command: "avvisa", description: "Manda una mail a tutti i negozi" },
          { command: "aiuto", description: "Mostra la guida ai comandi" }
        ]
      })
    });
    const commandsData = await commandsResponse.json();

    let publicWebhookData = null;
    let publicMenuData = null;

    if (publicBotToken) {
      const publicWebhookUrl = `${protocol}://${host}/api/telegram/public-bot`;
      const publicUrl = `https://api.telegram.org/bot${publicBotToken}/setWebhook?url=${encodeURIComponent(publicWebhookUrl)}`;
      const publicRes = await fetch(publicUrl);
      publicWebhookData = await publicRes.json();

      const publicCommandsUrl = `https://api.telegram.org/bot${publicBotToken}/setMyCommands`;
      const publicCommandsRes = await fetch(publicCommandsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commands: [
            { command: "start", description: "Avvia il calcolatore perdite" }
          ]
        })
      });
      publicMenuData = await publicCommandsRes.json();
    }

    return NextResponse.json({ 
      success: true, 
      webhook_url: webhookUrl,
      telegram_webhook: data,
      telegram_menu: commandsData,
      public_webhook: publicWebhookData,
      public_menu: publicMenuData
    });
  } catch (error) {
    return NextResponse.json({ error: "Impossibile impostare il webhook" }, { status: 500 });
  }
}
