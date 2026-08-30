import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { getTelegramWebhookSecret } from "@/lib/telegram-auth";

export async function GET(req: Request) {
  const authError = requireSuperAdmin(req);
  if (authError) return authError;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const publicBotToken = process.env.TELEGRAM_PUBLIC_BOT_TOKEN;
  const webhookSecret = getTelegramWebhookSecret();
  
  if (!botToken || !webhookSecret) {
    return NextResponse.json({ error: "Telegram non configurato" }, { status: 500 });
  }

  // Costruisce l'URL completo del server in produzione (Vercel) o lo prende da env
  const configuredBaseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL;
  const baseUrl = configuredBaseUrl
    ? configuredBaseUrl.replace(/\/$/, "")
    : new URL(req.url).origin;
  const webhookUrl = `${baseUrl}/api/telegram/webhook`;

  const url = `https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}&secret_token=${encodeURIComponent(webhookSecret)}`;
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
          { command: "azioni", description: "Apri tutte le Actions" },
          { command: "agenti", description: "Avvia gli agenti NeatX" },
          { command: "controllo", description: "Controlla salute e build sito" },
          { command: "report", description: "Genera il report giornaliero" },
          { command: "promemoria", description: "Controlla coda promemoria" },
          { command: "calendario", description: "Aggiorna calendario contenuti" },
          { command: "radar", description: "Avvia il radar virale" },
          { command: "concorrenti", description: "Analizza i concorrenti" },
          { command: "pipeline", description: "Aggiorna pipeline lead" },
          { command: "seo", description: "Avvia SEO blog" },
          { command: "post", description: "Prepara/pubblica un post" },
          { command: "reel", description: "Crea un Reel" },
          { command: "stats", description: "Calcola i profitti e le statistiche" },
          { command: "ultimi", description: "Mostra gli ultimi 3 negozi iscritti" },
          { command: "cerca", description: "Cerca un negozio per nome" },
          { command: "entra", description: "Crea il link per il login magico" },
          { command: "agents", description: "Mostra lo stato degli Agenti AI" },
          { command: "lead", description: "Mostra gli ultimi 5 contatti ricevuti" },
          { command: "aiuto", description: "Mostra la guida ai comandi" }
        ]
      })
    });
    const commandsData = await commandsResponse.json();

    let publicWebhookData = null;
    let publicMenuData = null;

    if (publicBotToken) {
      const publicWebhookUrl = `${baseUrl}/api/telegram/public-bot`;
      const publicUrl = `https://api.telegram.org/bot${publicBotToken}/setWebhook?url=${encodeURIComponent(publicWebhookUrl)}&secret_token=${encodeURIComponent(webhookSecret)}`;
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
  } catch {
    return NextResponse.json({ error: "Impossibile impostare il webhook" }, { status: 500 });
  }
}
