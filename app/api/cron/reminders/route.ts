import { NextResponse } from "next/server";
import { nextRomeDate } from "@/lib/reminder-outbox";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Accesso negato" }, { status: 401 });
  }

  if (process.env.REMINDERS_ENABLED !== "true") {
    return NextResponse.json({ success: true, mode: "disabled", processed: 0 });
  }

  const webhookUrl = process.env.N8N_REMINDER_WEBHOOK_URL;
  const webhookToken = process.env.N8N_REMINDER_WEBHOOK_TOKEN;
  if (!webhookUrl || !webhookToken) {
    console.error("[Cron Reminders] Workflow n8n non configurato");
    return NextResponse.json(
      { error: "Workflow promemoria non configurato" },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-neatx-reminder-token": webhookToken,
      },
      body: JSON.stringify({
        date: nextRomeDate(),
        // The workflow sends sequentially. A small batch prevents a new shop
        // from creating a sudden burst of messages from the central number.
        limit: 10,
        source: "vercel-cron",
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      console.error("[Cron Reminders] n8n ha risposto", response.status, detail);
      return NextResponse.json({ error: "Workflow promemoria non disponibile" }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      mode: "openwa",
      date: nextRomeDate(),
      dispatched: true,
    });
  } catch (error) {
    console.error("[Cron Reminders] Impossibile contattare n8n", error);
    return NextResponse.json({ error: "Workflow promemoria non raggiungibile" }, { status: 502 });
  }
}
