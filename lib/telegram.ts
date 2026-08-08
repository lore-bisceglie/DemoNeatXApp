export async function sendTelegramMessage(message: string, reply_markup?: any) {
  // Nei test automatici (NODE_ENV=test) le notifiche Telegram reali NON
  // devono partire: i test creano negozi/registrazioni finte che altrimenti
  // inonderebbero il canale del proprietario.
  if (process.env.NODE_ENV === "test") {
    return;
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn("[Telegram] Variabili TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID mancanti. Notifica ignorata.");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload: any = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML", // Permette l'uso di <b>, <i>, <code> ecc.
    };
    
    if (reply_markup) {
      payload.reply_markup = reply_markup;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("[Telegram] Errore API:", errorData);
    }
  } catch (error) {
    console.error("[Telegram] Eccezione durante l'invio:", error);
  }
}
