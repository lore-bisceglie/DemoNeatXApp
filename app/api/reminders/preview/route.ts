import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendTenantMessage } from "@/lib/sms";

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

function isPreviewRequestAuthorized(request: Request) {
  const previewToken = process.env.N8N_REMINDER_PREVIEW_TOKEN;
  // Do not use `Authorization`: Vercel Preview reserves it for deployment protection.
  const requestToken = request.headers.get("x-neatx-preview-token");
  return Boolean(previewToken && requestToken === previewToken);
}

function buildReminderMessage(input: {
  tenantName: string;
  tenantSlug: string;
  customerName: string;
  date: string;
  time: string;
  serviceName: string;
  cancelToken: string;
}) {
  const cancelUrl = `https://${input.tenantSlug}.neatx.store/cancel/${input.cancelToken}`;
  const message =
    `🔔 *Promemoria Appuntamento!*\n\n` +
    `🏢 *${input.tenantName}*\n\n` +
    `👤 *Cliente:* ${input.customerName}\n` +
    `📅 *Data:* DOMANI (${displayDate(input.date)})\n` +
    `⏰ *Ora:* ${input.time}\n` +
    `📌 *Servizio:* ${input.serviceName}\n\n` +
    `❌ *Per annullare o spostare in autonomia:*\n` +
    `Puoi usare questo link:\n${cancelUrl}\n\n` +
    `_Prenotazione gestita tramite NeatX._ 🚀`;

  return { cancelUrl, message };
}

/**
 * Read-only reminder preview for the n8n Preview workflow.
 * It never sends messages, decrements credits, or writes reminder state.
 */
export async function GET(request: Request) {
  if (!isPreviewRequestAuthorized(request)) {
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
      const { cancelUrl, message } = buildReminderMessage({
        tenantName: appointment.tenant.name,
        tenantSlug: appointment.tenant.slug,
        customerName: appointment.customerName.trim(),
        date,
        time: appointment.time,
        serviceName,
        cancelToken: appointment.cancelToken,
      });

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

/**
 * Explicit one-at-a-time delivery endpoint for the n8n Preview workflow.
 * It is unavailable unless both the preview token and the dedicated preview
 * send switch are configured in Vercel. It is never called by the live cron.
 */
export async function POST(request: Request) {
  if (!isPreviewRequestAuthorized(request)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (process.env.N8N_REMINDER_SEND_ENABLED !== "true") {
    return NextResponse.json({
      error: "Invio preview disattivato. Attiva N8N_REMINDER_SEND_ENABLED solo in Preview.",
    }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const appointmentId = typeof body?.appointmentId === "string" ? body.appointmentId : "";

  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId obbligatorio" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      service: { select: { name: true } },
      tenant: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!appointment?.tenant || !appointment.tenantId || !appointment.customerPhone || appointment.customerPhone === "0000000000") {
    return NextResponse.json({ error: "Appuntamento non inviabile" }, { status: 400 });
  }

  const serviceName = appointment.service?.name || "il tuo servizio";
  const { cancelUrl, message } = buildReminderMessage({
    tenantName: appointment.tenant.name,
    tenantSlug: appointment.tenant.slug,
    customerName: appointment.customerName.trim(),
    date: appointment.date,
    time: appointment.time,
    serviceName,
    cancelToken: appointment.cancelToken,
  });

  const result = await sendTenantMessage(
    appointment.tenantId,
    appointment.customerPhone,
    message,
    undefined,
    appointment.locationId || undefined,
  );

  if (!result.success) {
    return NextResponse.json({
      error: result.error || "Invio WhatsApp non riuscito",
      disabled: result.disabled === true,
    }, { status: 502 });
  }

  return NextResponse.json({
    mode: "sent-from-n8n-preview",
    appointmentId: appointment.id,
    destination: appointment.customerPhone,
    messageId: result.messageId,
    cancelUrl,
  });
}
