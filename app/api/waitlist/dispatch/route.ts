import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWaitlistOpenWa } from "@/lib/openwa";
import { hasCronAccess } from "@/lib/reminder-outbox";
import { getAvailabilityForDate } from "@/lib/availability";
import { enqueueWaitlistNotification } from "@/lib/waitlist-notification";

export const dynamic = "force-dynamic";

async function promoteWaitlistsWithAvailability() {
  const entries = await prisma.waitlist.findMany({
    where: { tenantId: { not: null } },
    select: { tenantId: true, date: true },
    distinct: ["tenantId", "date"],
    orderBy: { createdAt: "asc" },
  });

  let promoted = 0;
  for (const entry of entries) {
    if (!entry.tenantId) continue;
    const services = await prisma.service.findMany({
      where: { tenantId: entry.tenantId },
      select: { id: true },
      take: 12,
    });
    let hasFreeSlot = false;
    for (const service of services) {
      try {
        const availability = await getAvailabilityForDate({
          tenantId: entry.tenantId,
          date: entry.date,
          serviceId: service.id,
        });
        if (availability.slots.length > 0) {
          hasFreeSlot = true;
          break;
        }
      } catch {
        // Invalid/expired dates are ignored; booking rules remain authoritative.
      }
    }
    if (!hasFreeSlot) continue;

    const moved = await prisma.$transaction((tx) =>
      enqueueWaitlistNotification(tx, { tenantId: entry.tenantId, date: entry.date }),
    );
    if (moved) promoted++;
  }
  return promoted;
}

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
    // Safety net for stale pages: promote entries even when the slot was
    // already free before the customer joined the waitlist.
    const promoted = await promoteWaitlistsWithAvailability();
    const claimed = await prisma.$transaction(async (tx) => {
      await tx.waitlistNotification.updateMany({
        where: { status: "processing", claimedAt: { lt: staleBefore } },
        data: { status: "pending", claimedAt: null },
      });
      const rows = await tx.waitlistNotification.findMany({
        where: { status: "pending", attempts: { lt: 3 } },
        orderBy: { createdAt: "asc" },
        take: limit,
        include: { tenant: { select: { name: true } } },
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
      const shopName = row.tenant.name || "il negozio";
      const formattedDate = row.date.split("-").reverse().join("/");
      const message = `🎉 Si è liberato un posto da ${shopName}!\n\nCiao ${row.name}, si è liberato un posto per la data che avevi richiesto: ${formattedDate}.\n\nSe vuoi approfittarne, puoi prenotare subito qui:\n${row.bookingUrl}\n\nIl posto potrebbe essere preso da un altro cliente.`;
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
    return NextResponse.json({ success: true, promoted, claimed: claimed.length, sent, failed });
  } catch (error) {
    console.error("[waitlist/dispatch] errore", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
