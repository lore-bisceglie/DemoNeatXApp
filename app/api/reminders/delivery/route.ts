import { NextResponse } from "next/server";
import { hasCronAccess, settleReminderDelivery } from "@/lib/reminder-outbox";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const deliveryId = typeof body.deliveryId === "string" ? body.deliveryId : "";
    const leaseToken = typeof body.leaseToken === "string" ? body.leaseToken : "";
    const outcome = body.outcome === "sent" || body.outcome === "failed" ? body.outcome : null;

    // The delivery callback carries a one-time lease token. Accepting that
    // token lets hosted n8n settle the message even when its environment
    // variables are hidden; queue and summary remain protected by cron auth.
    if (!hasCronAccess(request) && (!deliveryId || !leaseToken)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!deliveryId || !leaseToken || !outcome) {
      return NextResponse.json({ error: "Dati consegna non validi" }, { status: 400 });
    }

    const result = await settleReminderDelivery({
      deliveryId,
      leaseToken,
      outcome,
      providerMessageId: typeof body.providerMessageId === "string" ? body.providerMessageId : undefined,
      error: typeof body.error === "string" ? body.error : undefined,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[reminders/delivery] errore nel registrare l'esito consegna", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
