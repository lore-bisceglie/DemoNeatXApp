import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTenantSms } from "@/lib/sms";
import { sendTelegramMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

function formatDate(isoDate: string) {
  return isoDate.split("-").reverse().join("/");
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (
      process.env.NODE_ENV === "production" &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json({ error: "Accesso negato" }, { status: 401 });
    }

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const parts = new Intl.DateTimeFormat("it-IT", {
      timeZone: "Europe/Rome",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(tomorrow);

    const day   = parts.find(p => p.type === "day")?.value;
    const month = parts.find(p => p.type === "month")?.value;
    const year  = parts.find(p => p.type === "year")?.value;
    const tomorrowString = `${year}-${month}-${day}`;

    const appointments = await prisma.appointment.findMany({
      where: {
        date: tomorrowString,
        customerPhone: { not: "0000000000" },
        tenant: {
          OR: [
            { plan: { in: ["pro", "elite"] } },
            {
              plan: { notIn: ["pro", "elite"] },
              trialEndsAt: { gt: now },
              trialStatus: { notIn: ["expired"] },
            },
          ],
        },
      },
      include: {
        service: true,
        tenant: true,
        location: { select: { id: true } },
      },
    });

    let successCount = 0;
    let failedCount = 0;
    let skippedCredits = 0;

    for (const appt of appointments) {
      if (!appt.tenantId || !appt.tenant || !appt.customerPhone || appt.customerPhone === "0000000000") continue;

      const cancelUrl = `https://${appt.tenant.slug}.neatx.store/cancel/${appt.cancelToken}`;
      const displayDate = formatDate(tomorrowString);

      const serviceName = appt.service?.name || "il tuo servizio";
      const smsBody = `🔔 *Promemoria Appuntamento!*\n🏢 *${appt.tenant.name}*\n\n👤 *Cliente:* ${appt.customerName.trim()}\n📅 *Data:* DOMANI (${displayDate})\n⏰ *Ora:* ${appt.time}\n📌 *Servizio:* ${serviceName}\n\n❌ *Per annullare o spostare in autonomia:*\nPuoi usare questo link:\n${cancelUrl}\n\n_Prenotazione gestita tramite NeatX._ 🚀`;

      const whatsappVars = {
        storeName: appt.tenant.name,
        customerName: appt.customerName.trim(),
        date: displayDate,
        time: appt.time,
      };

      const result = await sendTenantSms(
        appt.tenantId,
        appt.customerPhone,
        smsBody,
        whatsappVars,
        appt.locationId || undefined
      );

      if (result.success) {
        successCount++;
      } else if (result.error === "Crediti esauriti") {
        skippedCredits++;
      } else {
        failedCount++;
      }
    }

    const total = appointments.length;
    if (total > 0) {
      const msg =
        `Promemoria giornalieri NeatX\n\n` +
        `Data: ${formatDate(tomorrowString)}\n` +
        `Inviati: ${successCount}\n` +
        `Falliti: ${failedCount}\n` +
        `Saltati (crediti esauriti): ${skippedCredits}\n` +
        `Totale appuntamenti: ${total}`;
      await sendTelegramMessage(msg).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      mode: "live",
      date: tomorrowString,
      processed: total,
      successCount,
      failedCount,
      skippedCredits,
    });
  } catch (error) {
    console.error("Errore nel cron promemoria:", error);
    return NextResponse.json({ error: "Errore interno del server" }, { status: 500 });
  }
}
