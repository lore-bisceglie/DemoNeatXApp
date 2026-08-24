import { Prisma } from "@prisma/client";

/** Move the oldest waitlist entry for a released appointment into the durable
 * notification queue. Kept in one place so every release path behaves alike. */
export async function enqueueWaitlistNotification(
  tx: Prisma.TransactionClient,
  appointment: { tenantId: string | null; date: string },
) {
  if (!appointment.tenantId || !appointment.date) return false;

  const entry = await tx.waitlist.findFirst({
    where: { tenantId: appointment.tenantId, date: appointment.date },
    orderBy: { createdAt: "asc" },
  });
  if (!entry) return false;

  const tenant = await tx.tenant.findUnique({
    where: { id: appointment.tenantId },
    select: { slug: true },
  });
  if (!tenant?.slug) return false;

  const existing = await tx.waitlistNotification.findFirst({
    where: { waitlistId: entry.id, status: { in: ["pending", "processing", "sent"] } },
    select: { id: true },
  });
  if (!existing) {
    await tx.waitlistNotification.create({
      data: {
        tenantId: appointment.tenantId,
        waitlistId: entry.id,
        name: entry.name,
        phone: entry.phone,
        date: appointment.date,
        bookingUrl: `https://${tenant.slug}.neatx.store`,
      },
    });
  }
  await tx.waitlist.delete({ where: { id: entry.id } });
  return true;
}
