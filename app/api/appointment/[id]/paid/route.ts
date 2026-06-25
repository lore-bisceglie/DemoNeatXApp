import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));

    const isPaid =
      typeof body.isPaid === "boolean"
        ? body.isPaid
        : true;

    if (!id) {
      return NextResponse.json(
        { error: "ID appuntamento mancante" },
        { status: 400 }
      );
    }

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