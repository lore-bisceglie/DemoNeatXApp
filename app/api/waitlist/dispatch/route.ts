import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWaitlistOpenWa } from "@/lib/openwa";
import { hasCronAccess } from "@/lib/reminder-outbox";

export const dynamic = "force-dynamic";

/**
 * Called by the dedicated n8n waitlist workflow. The endpoint owns the
 * claim/send/settle cycle so credits and the existing WhatsApp provider stay
 * in one place. n8n only schedules this call and records the result.
 */
export async function POST(request: Request) {
  if (!hasCronAccess(request)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (process.env.REMINDERS_ENABLED !== "true") {
    return NextResponse.json({ success: true, mode: "disabled", sent: 0, failed: 0 });
  }

  const body = await request.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body?.limit) || 20, 1), 50);
  const staleBefore = new Date(Date.now() - 15 * 60_000);

  try {
    const claimed = await prisma.$transaction(async (tx) => {
      await tx.waitlistNotification.updateMany({
        where: { status: "processing", claimedAt: { lt: staleBefore } },
        data: { status: "pending", claimedAt: null },
      });
      const rows = await tx.waitlistNotification.findMany({
        where: { status: "pending", attempts: { lt: 3 } },
        orderBy: { createdAt: "asc" },
        take: limit,
      });
      if (!rows.length) return [];
      await tx.waitlistNotification.updateMany({
        where: { id: { in: rows.map((row) => row.id) } },
        data: { status: "processing", claimedAt: new Date(), attempts: { increment: 1 } },
      });
      return rows;
    });

    let sent = 0;
    let failed = 0;
    for (const row of claimed) {
      const message = `🎉 Posto liberato!\nCiao ${row.name}, si è liberato un posto per il ${row.date.split("-").reverse().join("/")}. Prenota subito: ${row.bookingUrl}`;
      try {
        const result = await sendWaitlistOpenWa(row.tenantId, row.phone, message);
        if (!result.success) throw new Error(result.error || "Invio non riuscito");
        await prisma.waitlistNotification.update({
          where: { id: row.id },
          data: { status: "sent", sentAt: new Date(), claimedAt: null, lastError: null },
        });
        sent++;
      } catch (error) {
        await prisma.waitlistNotification.update({
          where: { id: row.id },
          data: { status: row.attempts + 1 >= 3 ? "failed" : "pending", claimedAt: null, lastError: String(error) },
        });
        failed++;
      }
    }
    return NextResponse.json({ success: true, claimed: claimed.length, sent, failed });
  } catch (error) {
    console.error("[waitlist/dispatch] errore", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
