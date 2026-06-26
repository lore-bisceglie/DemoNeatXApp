import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";

export async function GET() {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split("T")[0];

    const appointments = await prisma.appointment.findMany({
      where: {
        tenantId: DEMO_TENANT_ID,
        date: tomorrowString,
        customerPhone: {
          not: "0000000000",
        },
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json({
      success: true,
      mode: "demo",
      message:
        "Promemoria simulati: nella demo non viene inviato nessun SMS o WhatsApp reale.",
      previewCount: appointments.length,
      appointments: appointments.map((appointment) => ({
        customerName: appointment.customerName,
        customerPhone: appointment.customerPhone,
        date: appointment.date,
        time: appointment.time,
        serviceName: appointment.service?.name || null,
      })),
    });
  } catch (error) {
    console.error("Errore simulazione promemoria:", error);
    return NextResponse.json(
      { error: "Errore durante la simulazione dei promemoria" },
      { status: 500 }
    );
  }
}
