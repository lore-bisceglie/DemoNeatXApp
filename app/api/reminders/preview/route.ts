import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ROME_TIME_ZONE = "Europe/Rome";

function romeDate(daysFromToday = 1) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromToday);

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ROME_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function displayDate(date: string) {
  return date.split("-").reverse().join("/");
}

/**
 * Read-only reminder preview for the n8n test workflow.
 * It never sends messages, decrements credits, or writes reminder state.
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    // Do not confirm the endpoint exists to callers without the key.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || romeDate();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Data non valida. Usa YYYY-MM-DD." }, { status: 400 });
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      date,
      customerPhone: { not: "0000000000" },
      tenant: {
        OR: [
          { plan: { in: ["pro", "elite"] } },
          {
            plan: { notIn: ["pro", "elite"] },
            trialEndsAt: { gt: new Date() },
            trialStatus: { notIn: ["expired"] },
          },
        ],
      },
    },
    include: {
      service: { select: { name: true } },
      tenant: { select: { name: true, slug: true } },
    },
    orderBy: [{ time: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({
    mode: "simulation",
    date,
    timezone: ROME_TIME_ZONE,
    reminderCount: appointments.length,
    reminders: appointments.flatMap((appointment) => {
      if (!appointment.tenant || !appointment.tenantId) return [];

      const serviceName = appointment.service?.name || "il tuo servizio";
      const cancelUrl = `https://${appointment.tenant.slug}.neatx.store/cancel/${appointment.cancelToken}`;
      const message =
        `🔔 *Promemoria Appuntamento!*\n\n` +
        `🏢 *${appointment.tenant.name}*\n\n` +
        `👤 *Cliente:* ${appointment.customerName.trim()}\n` +
        `📅 *Data:* DOMANI (${displayDate(date)})\n` +
        `⏰ *Ora:* ${appointment.time}\n` +
        `📌 *Servizio:* ${serviceName}\n\n` +
        `❌ *Per annullare o spostare in autonomia:*\n` +
        `Puoi usare questo link:\n${cancelUrl}\n\n` +
        `_Prenotazione gestita tramite NeatX._ 🚀`;

      return [{
        appointmentId: appointment.id,
        tenantId: appointment.tenantId,
        tenantName: appointment.tenant.name,
        phone: appointment.customerPhone,
        customerName: appointment.customerName.trim(),
        serviceName,
        date,
        time: appointment.time,
        cancelUrl,
        message,
        delivery: "simulated",
      }];
    }),
  });
}
