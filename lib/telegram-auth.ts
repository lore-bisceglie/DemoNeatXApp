import { createHash } from "crypto";

export function getTelegramWebhookSecret() {
  if (process.env.TELEGRAM_WEBHOOK_SECRET) {
    return process.env.TELEGRAM_WEBHOOK_SECRET;
  }

  const botToken =
    process.env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_PUBLIC_BOT_TOKEN;
  if (!botToken) return "";

  return createHash("sha256")
    .update(`neatx-telegram-webhook-v1\0${botToken}`)
    .digest("hex");
}
