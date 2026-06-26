import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: "Accesso negato" },
        { status: 401 }
      );
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateFormatter = new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = dateFormatter.formatToParts(tomorrow);
    const day = parts.find((p) => p.type === "day")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const year = parts.find((p) => p.type === "year")?.value;

    const tomorrowString = `${year}-${month}-${day}`;

    const appointments = await prisma.appointment.findMany({
      where: {
        date: tomorrowString,
        tenantId: DEMO_TENANT_ID,
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
        "Cron promemoria simulato: nella demo non parte nessun SMS reale.",
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
    console.error("Errore nel cron demo:", error);

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
