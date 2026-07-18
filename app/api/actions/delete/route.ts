import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID mancante" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    select: { id: true, customerName: true, customerPhone: true, date: true, time: true, tenantId: true, tenant: { select: { slug: true, adminPassword: true } } },
  });
  if (!appointment) {
    return NextResponse.json({ error: "Appuntamento non trovato" }, { status: 404 });
  }

  const authCookie = cookieStore.get("admin_auth_" + appointment.tenant?.slug)?.value;
  if (!appointment.tenant || !isTenantAdminCookieValid(authCookie, appointment.tenant.slug, appointment.tenant.adminPassword)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  await prisma.appointment.delete({ where: { id } });

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