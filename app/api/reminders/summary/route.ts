import { NextResponse } from "next/server";
import {
  buildReminderSummary,
  hasCronAccess,
  nextRomeDate,
  reminderSummaryToText,
} from "@/lib/reminder-outbox";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

// Riepilogo veritiero di un giro di promemoria. Accesso riservato ai sistemi
// autorizzati (stesso secret di /api/reminders/queue). I dati sono tutti dal
// database: nessun numero inventato.
export async function POST(request: Request) {
  if (!hasCronAccess(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const date = typeof body.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date)
      ? body.date
      : nextRomeDate();

    const summary = await buildReminderSummary(date);

    // Notifica Telegram solo con numeri veri (lib/telegram ignora l'invio nei
    // test con NODE_ENV=test, quindi il canale non viene sporcato).
    await sendTelegramMessage(reminderSummaryToText(summary));

    return NextResponse.json({
      success: true,
      date: summary.date,
      timezone: summary.timezone,
      summary,
    });
  } catch (error) {
    console.error("[reminders/summary] errore nel calcolo del riepilogo", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}