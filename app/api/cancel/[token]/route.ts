import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTenantSms } from "@/lib/sms";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token: tokenFromParams } = await context.params;
    const { searchParams } = new URL(request.url);

    const token = tokenFromParams || searchParams.get("token");

    if (!token) {
      return NextResponse.json({
        appointment: null,
      });
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        cancelToken: token,
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json({
      appointment,
    });
  } catch (error) {
    console.error("Errore recupero appuntamento da token:", error);

    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token: tokenFromParams } = await context.params;
    const body = await request.json().catch(() => ({}));

    const token = body.token || tokenFromParams;

    if (!token) {
      return NextResponse.json(
        { error: "Token mancante" },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: {
        cancelToken: token,
      },
    });

    if (appointment) {
      await prisma.appointment.delete({
        where: {
          id: appointment.id,
        },
      });

      // 🌟 INVIO SMS CANCELLAZIONE
      if (appointment.customerPhone && appointment.customerPhone !== "0000000000") {
        const tenant = await prisma.tenant.findUnique({ where: { id: appointment.tenantId } });
        if (tenant) {
          const smsBody = `❌ ${tenant.name} - Cancellazione Confermata\nCiao ${appointment.customerName.trim()}, abbiamo cancellato il tuo appuntamento del ${appointment.date.split('-').reverse().join('/')} alle ${appointment.time}. Alla prossima!`;
          await sendTenantSms(appointment.tenantId, appointment.customerPhone, smsBody);
        }
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Errore cancellazione appuntamento:", error);

    return NextResponse.json(
      { error: "Errore interno" },
      { status: 500 }
    );
  }
}