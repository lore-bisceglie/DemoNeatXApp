import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        { error: "ID appuntamento mancante" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const isPaid =
      typeof body.isPaid === "boolean"
        ? body.isPaid
        : true;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Appuntamento non trovato" },
        { status: 404 }
      );
    }
    const authError = await requireTenantAdminOrDemo(request, existing.tenantId, "payment", 60);
    if (authError) return authError;

    const updatedAppointment = await prisma.appointment.update({
      where: {
        id,
      },
      data: {
        isPaid,
      },
    });

    return NextResponse.json({
      success: true,
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error("Errore salvataggio pagamento:", error);

    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
  }
}
