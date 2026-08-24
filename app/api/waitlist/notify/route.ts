import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";

/** Enqueue one existing waitlist entry for the same automatic OpenWA sender. */
export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID mancante." }, { status: 400 });

    const entry = await prisma.waitlist.findUnique({ where: { id } });
    if (!entry?.tenantId) return NextResponse.json({ error: "Elemento non trovato." }, { status: 404 });

    const authError = await requireTenantAdminOrDemo(req, entry.tenantId, "waitlist-notify", 30);
    if (authError) return authError;

    const tenant = await prisma.tenant.findUnique({ where: { id: entry.tenantId }, select: { slug: true } });
    if (!tenant?.slug) return NextResponse.json({ error: "Negozio non trovato." }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const existing = await tx.waitlistNotification.findFirst({
        where: { waitlistId: entry.id, status: { in: ["pending", "processing", "sent"] } },
        select: { id: true },
      });
      if (existing) return { queued: false };

      await tx.waitlistNotification.create({
        data: {
          tenantId: entry.tenantId!,
          waitlistId: entry.id,
          name: entry.name,
          phone: entry.phone,
          date: entry.date,
          bookingUrl: `https://${tenant.slug}.neatx.store`,
        },
      });
      await tx.waitlist.delete({ where: { id: entry.id } });
      return { queued: true };
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Errore waitlist notify:", error);
    return NextResponse.json({ error: "Impossibile mettere la notifica in coda." }, { status: 500 });
  }
}
