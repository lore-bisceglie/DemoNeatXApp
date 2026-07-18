import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    const phone = searchParams.get("phone");
    const name = searchParams.get("name");
    const date = searchParams.get("date");

    if (!id || !phone || !date) {
      return NextResponse.json(
        { error: "Parametri mancanti" },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: { id: true, tenantId: true, tenant: { select: { slug: true, adminPassword: true } } },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appuntamento non trovato" },
        { status: 404 }
      );
    }

    const authCookie = cookieStore.get("admin_auth_" + appointment.tenant?.slug)?.value;
    if (!appointment.tenant || !isTenantAdminCookieValid(authCookie, appointment.tenant.slug, appointment.tenant.adminPassword)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    await prisma.noShow.create({
      data: {
        customerPhone: phone,
        customerName: name || "Sconosciuto",
        date,
        tenantId: appointment.tenantId,
      },
    });

    await prisma.appointment.delete({
      where: {
        id,
      },
    });

    await logActivity({
      action: "NO_SHOW",
      actor: "admin",
      message: `${name || "Sconosciuto"} segnato come assente (No-Show)`,
      appointmentId: id || undefined,
      customerName: name || "Sconosciuto",
      customerPhone: phone || undefined,
      date: date || undefined,
      tenantId: appointment.tenantId || undefined,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Errore registrazione No-Show:", error);

    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
  }
}
