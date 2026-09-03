import { NextResponse } from "next/server";
import {
  buildReminderSummary,
  claimReminderBatch,
  nextRomeDate,
  reminderSummaryToText,
  settleReminderDelivery,
} from "@/lib/reminder-outbox";
import { getOpenWaSessionHealth, sendReminderOpenWa } from "@/lib/openwa";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ROME_TIME_ZONE = "Europe/Rome";
const REMINDER_HOUR = 18;
const BATCH_SIZE = 100;
const SEND_CONCURRENCY = 4;
const OPENWA_CONFLICT_RETRY_DELAY_MS = 8_000;

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function sendReminderWithRecovery(phone: string, message: string) {
  const firstAttempt = await sendReminderOpenWa(phone, message);
  if (firstAttempt.success || !firstAttempt.retryable) return firstAttempt;

  // OpenWA returned an HTTP 409: the provider rejected the request before it
  // produced a message id. Wait briefly for the WhatsApp session to become
  // available again, then make one—and only one—safe recovery attempt.
  console.warn("[Cron Reminders] OpenWA Conflict: controllo sessione e ritento una volta", {
    httpStatus: firstAttempt.httpStatus,
  });
  await delay(OPENWA_CONFLICT_RETRY_DELAY_MS);

  const session = await getOpenWaSessionHealth();
  if (!session.ready) {
    return {
      success: false as const,
      error: `OpenWA Conflict; sessione non pronta${session.status ? ` (${session.status})` : ""}: ${session.error}`,
      retryable: false,
    };
  }

  const retryAttempt = await sendReminderOpenWa(phone, message);
  if (!retryAttempt.success) {
    console.error("[Cron Reminders] Recupero OpenWA non riuscito", {
      httpStatus: retryAttempt.httpStatus,
      error: retryAttempt.error,
    });
  }
  return retryAttempt;
}

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

  console.info("[Cron Reminders] Invocazione autenticata ricevuta", {
    source: request.headers.get("x-vercel-cron") === "1" ? "vercel-cron" : "manual-or-backup",
  });

  if (process.env.REMINDERS_ENABLED !== "true") {
    console.warn("[Cron Reminders] Automazione disattivata da REMINDERS_ENABLED");
    return NextResponse.json({ success: true, mode: "disabled", processed: 0 });
  }

  const now = new Date();
  if (!isReminderWindow(now)) {
    console.info("[Cron Reminders] Invocazione fuori dalla finestra italiana", {
      timezone: ROME_TIME_ZONE,
      romeHour: romeHour(now),
    });
    return NextResponse.json({
      success: true,
      mode: "outside-window",
      timezone: ROME_TIME_ZONE,
      romeHour: romeHour(now),
      processed: 0,
    });
  }

  try {
    const session = await getOpenWaSessionHealth();
    if (!session.ready) {
      const detail = `⚠️ <b>Promemoria non avviati</b>\n\n` +
        `La sessione WhatsApp OpenWA non è pronta${session.status ? ` (${session.status})` : ""}.\n` +
        `Nessun messaggio è stato preso in carico.\n` +
        `<code>${session.error}</code>`;
      console.error("[Cron Reminders] Sessione OpenWA non pronta", session);
      await sendTelegramMessage(detail).catch((error) => {
        console.error("[Cron Reminders] Avviso Telegram sessione non pronta non inviato", error);
      });
      return NextResponse.json({
        success: false,
        mode: "openwa-session-unavailable",
        status: session.status,
        error: session.error,
      }, { status: 503 });
    }

    const date = nextRomeDate();
    const batch = await claimReminderBatch({ date, limit: BATCH_SIZE });
    let sent = 0;
    let failed = 0;

    for (let index = 0; index < batch.reminders.length; index += SEND_CONCURRENCY) {
      const chunk = batch.reminders.slice(index, index + SEND_CONCURRENCY);
      const results = await Promise.all(chunk.map(async (reminder) => {
        const provider = await sendReminderWithRecovery(reminder.phone, reminder.message);
        if (!provider.success) {
          console.error("[Cron Reminders] Invio OpenWA fallito", {
            deliveryId: reminder.deliveryId,
            tenantId: reminder.tenantId,
            httpStatus: provider.httpStatus,
            error: provider.error,
          });
        }
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

    const summary = await buildReminderSummary(date, {
      skippedNoCreditsByTenant: batch.skippedNoCreditsByTenant,
    });
    let telegramSummarySent = false;
    try {
      // Anche un giro con zero appuntamenti deve lasciare una traccia visibile:
      // così distinguiamo "cron eseguito, nessun destinatario" da "cron mai partito".
      await sendTelegramMessage(reminderSummaryToText(summary));
      telegramSummarySent = true;
    } catch (error) {
      // Telegram è osservabilità, non deve trasformare un invio WhatsApp riuscito
      // in un falso fallimento del dispatcher.
      console.error("[Cron Reminders] Riepilogo Telegram non inviato", error);
    }

    const payload = {
      success: true,
      mode: "vercel-openwa",
      date,
      queued: batch.reminderCount,
      sent,
      failed,
      skippedNoCredits: batch.skippedNoCredits,
      skippedNoCreditsByTenant: batch.skippedNoCreditsByTenant,
      skippedAlreadyHandled: batch.skippedAlreadyHandled,
      telegramSummarySent,
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
