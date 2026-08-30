import { NextResponse } from "next/server";
import {
  buildReminderSummary,
  claimReminderBatch,
  nextRomeDate,
  reminderSummaryToText,
  settleReminderDelivery,
} from "@/lib/reminder-outbox";
import { sendReminderOpenWa } from "@/lib/openwa";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ROME_TIME_ZONE = "Europe/Rome";
const REMINDER_HOUR = 18;
const BATCH_SIZE = 100;
const SEND_CONCURRENCY = 4;

function romeHour(date: Date) {
  return Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: ROME_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(date));
}

export function isReminderWindow(date = new Date()) {
  return romeHour(date) === REMINDER_HOUR;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 401 });
  }

  if (process.env.REMINDERS_ENABLED !== "true") {
    return NextResponse.json({ success: true, mode: "disabled", processed: 0 });
  }

  const now = new Date();
  if (!isReminderWindow(now)) {
    return NextResponse.json({
      success: true,
      mode: "outside-window",
      timezone: ROME_TIME_ZONE,
      romeHour: romeHour(now),
      processed: 0,
    });
  }

  try {
    const date = nextRomeDate();
    const batch = await claimReminderBatch({ date, limit: BATCH_SIZE });
    let sent = 0;
    let failed = 0;

    for (let index = 0; index < batch.reminders.length; index += SEND_CONCURRENCY) {
      const chunk = batch.reminders.slice(index, index + SEND_CONCURRENCY);
      const results = await Promise.all(chunk.map(async (reminder) => {
        const provider = await sendReminderOpenWa(reminder.phone, reminder.message);
        const settlement = await settleReminderDelivery({
          deliveryId: reminder.deliveryId,
          leaseToken: reminder.leaseToken,
          outcome: provider.success ? "sent" : "failed",
          providerMessageId: provider.success ? provider.messageId : undefined,
          error: provider.success ? undefined : provider.error,
        });

        if (!settlement.success) {
          console.error("[Cron Reminders] Esito non registrato", reminder.deliveryId, settlement.reason);
          return false;
        }
        return provider.success;
      }));

      sent += results.filter(Boolean).length;
      failed += results.filter((result) => !result).length;
    }

    const summary = await buildReminderSummary(date);
    if (batch.reminderCount > 0) {
      await sendTelegramMessage(reminderSummaryToText(summary));
    }

    const payload = {
      success: true,
      mode: "vercel-openwa",
      date,
      queued: batch.reminderCount,
      sent,
      failed,
      skippedNoCredits: batch.skippedNoCredits,
      skippedAlreadyHandled: batch.skippedAlreadyHandled,
      summary,
    };

    if (failed > 0) {
      console.error("[Cron Reminders] Uno o più invii non sono riusciti", payload);
      return NextResponse.json({ ...payload, success: false }, { status: 502 });
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("[Cron Reminders] Errore dispatcher Vercel", error);
    return NextResponse.json({ error: "Dispatcher promemoria non disponibile" }, { status: 500 });
  }
}
