import { sendTelegramMessage } from "@/lib/telegram";

/**
 * Monitoraggio errori: manda una notifica Telegram quando una API route
 * fallisce lato server. Completa il sistema esistente (che copriva solo
 * gli errori di rendering del frontend via /api/syslog).
 *
 * Uso nei catch delle route:
 *   try { ... } catch (error) {
 *     await notifyError("book", "Prenotazione", error);
 *     return NextResponse.json({ error: "..." }, { status: 500 });
 *   }
 *
 * Il messaggio è breve e in formato HTML (coerente con le altre
 * notifiche Telegram del progetto). Non blocca mai l'esecuzione.
 */
export async function notifyError(route: string, operation: string, error: unknown) {
  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error && error.stack
      ? error.stack.split("\n").slice(0, 4).join("\n")
      : "";

    const text =
      `🚨 <b>ERRORE SERVER</b>\n\n` +
      `📡 Route: <b>${route}</b>\n` +
      `⚙️ Operazione: <b>${operation}</b>\n\n` +
      `❌ Errore:\n<code>${message}</code>` +
      (stack ? `\n\n<pre>${stack}</pre>` : "");

    await sendTelegramMessage(text);
  } catch (e) {
    // Non bloccare mai la risposta dell'API per un errore di notifica
    console.error("[monitor] Errore invio notifica:", e);
  }
}
