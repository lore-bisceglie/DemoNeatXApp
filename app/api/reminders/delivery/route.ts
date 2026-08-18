import { NextResponse } from "next/server";
import { hasCronAccess, settleReminderDelivery } from "@/lib/reminder-outbox";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hasCronAccess(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const deliveryId = typeof body.deliveryId === "string" ? body.deliveryId : "";
    const leaseToken = typeof body.leaseToken === "string" ? body.leaseToken : "";
    const outcome = body.outcome === "sent" || body.outcome === "failed" ? body.outcome : null;

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
