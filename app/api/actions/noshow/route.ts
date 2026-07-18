import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logActivity } from "@/lib/activity";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Parametri mancanti" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      select: {
        id: true,
        tenantId: true,
        customerPhone: true,
        customerName: true,
        date: true,
        time: true,
      },
    });

    if (!appointment || !appointment.tenantId) {
      return NextResponse.json(
        { error: "Appuntamento non trovato" },
        { status: 404 }
      );
    }

    const tenantId = appointment.tenantId;
    const authError = await requireTenantAdminOrDemo(request, tenantId, "no-show", 30);
    if (authError) return authError;

    await prisma.$transaction([
      prisma.noShow.create({
        data: {
          customerPhone: appointment.customerPhone,
          customerName: appointment.customerName,
          date: appointment.date,
          tenantId,
        },
      }),
      prisma.appointment.delete({ where: { id } }),
    ]);

    await logActivity({
      action: "NO_SHOW",
      actor: "admin",
      message: `${appointment.customerName} segnato come assente (No-Show)`,
      appointmentId: id,
      customerName: appointment.customerName,
      customerPhone: appointment.customerPhone,
      date: appointment.date,
      time: appointment.time,
      tenantId,
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
