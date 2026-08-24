import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";
import { enqueueWaitlistNotification } from "@/lib/waitlist-notification";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID mancante" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, customerName: true, customerPhone: true, date: true, time: true, tenantId: true },
  });
  if (!appointment) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 });
  }

  const authError = await requireTenantAdminOrDemo(req, appointment.tenantId, "delete", 30);
  if (authError) return authError;

  await prisma.$transaction(async (tx) => {
    await tx.appointment.delete({ where: { id } });
    await enqueueWaitlistNotification(tx, appointment);
  });

  if (appointment.tenantId) {
    await logActivity({
      action: "DELETE_APPOINTMENT",
      actor: "admin",
      message: `${appointment.customerName} è stato rimosso dall'agenda`,
      appointmentId: appointment.id,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      date: appointment.date,
      time: appointment.time,
      tenantId: appointment.tenantId,
    });
  }

  revalidatePath("/dashboard");
  return NextResponse.json({ success: true });
}
