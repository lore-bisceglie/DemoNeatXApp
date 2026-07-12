import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTenantSms } from "@/lib/sms";

export const dynamic = "force-dynamic";

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
        customerPhone: {
          not: "0000000000",
        },
      },
      include: {
        service: true,
        tenant: true,
      },
    });

    let successCount = 0;
    let failedCount = 0;

    for (const appt of appointments) {
      if (appt.tenantId && appt.tenant && appt.customerPhone && appt.customerPhone !== "0000000000") {
        const cancelUrl = `https://${appt.tenant.slug}.neatx.store/cancel/${appt.cancelToken}`;
        
        // Testo SMS di fallback
        const smsBody = `⏰ Promemoria da ${appt.tenant.name}\nCiao ${appt.customerName.trim()}, ti ricordiamo l'appuntamento di domani alle ${appt.time} per ${appt.service?.name || 'il tuo servizio'}.\n\nSe non puoi venire, disdici qui: ${cancelUrl}`;
        
        const whatsappVars = {
          storeName: appt.tenant.name,
          customerName: appt.customerName.trim(),
          date: tomorrowString,
          time: appt.time,
        };
        
        const result = await sendTenantSms(appt.tenantId, appt.customerPhone, smsBody, whatsappVars);
        if (result.success) {
          successCount++;
        } else {
          failedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      mode: "live",
      message: "Cron promemoria completato",
      processed: appointments.length,
      successCount,
      failedCount
    });
  } catch (error) {
    console.error("Errore nel cron demo:", error);

    return NextResponse.json(
      { error: "Errore interno del server" },
      { status: 500 }
    );
  }
}
