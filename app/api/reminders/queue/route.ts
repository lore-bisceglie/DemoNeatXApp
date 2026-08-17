import { NextResponse } from "next/server";
import { claimReminderBatch, hasCronAccess, nextRomeDate } from "@/lib/reminder-outbox";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasCronAccess(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // A single kill switch for the entire reminder system. This protects the
  // queue as well as the scheduled dispatcher: turning reminders off cannot
  // leave already configured automation sending messages in the background.
  if (process.env.REMINDERS_ENABLED !== "true") {
    return NextResponse.json({
      success: true,
      mode: "disabled",
      reminderCount: 0,
      reminders: [],
    });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const date = typeof body.date === "string" ? body.date : nextRomeDate();
    const limit = typeof body.limit === "number" ? body.limit : undefined;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "Data non valida" }, { status: 400 });
    }

    return NextResponse.json(await claimReminderBatch({ date, limit }));
  } catch (error) {
    console.error("[reminders/queue] errore", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
