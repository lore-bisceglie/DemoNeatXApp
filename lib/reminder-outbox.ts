import crypto from "crypto";
import { prisma } from "@/lib/prisma";

const ROME_TIME_ZONE = "Europe/Rome";
const OPENWA_CHANNEL = "OPENWA";
const MAX_BATCH_SIZE = 50;

type ReminderCandidate = {
  id: string;
  tenantId: string | null;
  customerName: string;
  customerPhone: string;
  date: string;
  time: string;
  cancelToken: string;
  service: { name: string } | null;
  tenant: { name: string; slug: string } | null;
};

export function hasCronAccess(request: Request) {
  const authorization = request.headers.get("authorization");
  const acceptedSecrets = [
    process.env.CRON_SECRET,
    process.env.N8N_REMINDER_WEBHOOK_TOKEN,
    process.env.N8N_REMINDER_PREVIEW_TOKEN,
  ].filter(
    (secret): secret is string => Boolean(secret),
  );

  return acceptedSecrets.some((secret) => authorization === `Bearer ${secret}`);
}

function romeDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ROME_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return {
    year: Number(value("year")),
    month: Number(value("month")),
    day: Number(value("day")),
  };
}

export function nextRomeDate(daysFromToday = 1) {
  const today = romeDateParts(new Date());
  // Creiamo la data calendario in UTC solo per sommare i giorni: non è un
  // istante di prenotazione, quindi non può slittare con il fuso del server.
  const calendarDate = new Date(Date.UTC(today.year, today.month - 1, today.day + daysFromToday));
  return calendarDate.toISOString().slice(0, 10);
}

export function toItalianDate(date: string) {
  return date.split("-").reverse().join("/");
}

export function buildReminderMessage(candidate: ReminderCandidate) {
  if (!candidate.tenant) throw new Error("Negozio non trovato per il promemoria");

  const serviceName = candidate.service?.name || "il tuo servizio";
  const cancelUrl = `https://${candidate.tenant.slug}.neatx.store/cancel/${candidate.cancelToken}`;

  return {
    cancelUrl,
    serviceName,
    message:
      `🔔 *Promemoria Appuntamento!*\n\n` +
      `🏢 *${candidate.tenant.name}*\n\n` +
      `👤 *Cliente:* ${candidate.customerName.trim()}\n` +
      `📅 *Data:* DOMANI (${toItalianDate(candidate.date)})\n` +
      `⏰ *Ora:* ${candidate.time}\n` +
      `📌 *Servizio:* ${serviceName}\n\n` +
      `❌ *Per annullare o spostare in autonomia:*\n` +
      `Puoi usare questo link:\n${cancelUrl}\n\n` +
      `_Prenotazione gestita tramite NeatX._ 🚀`,
  };
}

export async function claimReminderBatch({ date, limit }: { date: string; limit?: number }) {
  const now = new Date();
  const take = Math.min(Math.max(limit || 20, 1), MAX_BATCH_SIZE);

  const candidates = await prisma.appointment.findMany({
    where: {
      date,
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
      service: { select: { name: true } },
      tenant: { select: { name: true, slug: true } },
    },
    orderBy: [{ time: "asc" }, { createdAt: "asc" }],
    take: take * 3,
  });

  const reminders = [];
  let skippedNoCredits = 0;
  let skippedAlreadyHandled = 0;

  for (const candidate of candidates) {
    if (reminders.length >= take || !candidate.tenantId || !candidate.tenant) continue;

    try {
      const claimed = await prisma.$transaction(async (tx) => {
        const existing = await tx.reminderDelivery.findUnique({
          where: {
            appointmentId_channel: {
              appointmentId: candidate.id,
              channel: OPENWA_CHANNEL,
            },
          },
          select: {
            id: true,
            status: true,
            lastAttemptAt: true,
            creditReserved: true,
          },
        });

        if (existing) {
          // A worker can disappear after reserving the credit but before
          // sending the message. Keep a short lease window, then make the
          // same appointment eligible again instead of permanently losing it.
          const leaseIsFresh = existing.lastAttemptAt
            ? now.getTime() - existing.lastAttemptAt.getTime() < 10 * 60 * 1000
            : false;

          if (existing.status === "SENT" || (existing.status === "PROCESSING" && leaseIsFresh)) {
            return { type: "already" as const };
          }

          if (!existing.creditReserved) {
            const credit = await tx.storeSettings.updateMany({
              where: { tenantId: candidate.tenantId!, smsCredits: { gt: 0 } },
              data: { smsCredits: { decrement: 1 } },
            });

            if (credit.count !== 1) return { type: "no-credit" as const };
          }

          const delivery = await tx.reminderDelivery.update({
            where: { id: existing.id },
            data: {
              status: "PROCESSING",
              leaseToken: crypto.randomUUID(),
              creditReserved: true,
              attemptCount: { increment: 1 },
              lastAttemptAt: now,
              lastError: null,
              failedAt: null,
            },
            select: { id: true, leaseToken: true },
          });

          return { type: "claimed" as const, delivery };
        }

        const credit = await tx.storeSettings.updateMany({
          where: { tenantId: candidate.tenantId!, smsCredits: { gt: 0 } },
          data: { smsCredits: { decrement: 1 } },
        });

        if (credit.count !== 1) return { type: "no-credit" as const };

        const delivery = await tx.reminderDelivery.create({
          data: {
            appointmentId: candidate.id,
            tenantId: candidate.tenantId!,
            channel: OPENWA_CHANNEL,
            status: "PROCESSING",
            leaseToken: crypto.randomUUID(),
            creditReserved: true,
            attemptCount: 1,
            lastAttemptAt: now,
          },
          select: { id: true, leaseToken: true },
        });

        return { type: "claimed" as const, delivery };
      });

      if (claimed.type === "already") {
        skippedAlreadyHandled++;
        continue;
      }

      if (claimed.type === "no-credit") {
        skippedNoCredits++;
        continue;
      }

      const content = buildReminderMessage(candidate);
      reminders.push({
        deliveryId: claimed.delivery.id,
        leaseToken: claimed.delivery.leaseToken,
        appointmentId: candidate.id,
        tenantId: candidate.tenantId,
        tenantName: candidate.tenant.name,
        phone: candidate.customerPhone,
        customerName: candidate.customerName.trim(),
        date: candidate.date,
        time: candidate.time,
        serviceName: content.serviceName,
        cancelUrl: content.cancelUrl,
        message: content.message,
      });
    } catch (error) {
      // Una collisione sull'unicità significa che un altro worker ha già
      // prelevato il promemoria: non è un errore da ritentare qui.
      const code = typeof error === "object" && error && "code" in error
        ? (error as { code?: string }).code
        : undefined;
      if (code === "P2002") {
        skippedAlreadyHandled++;
        continue;
      }
      throw error;
    }
  }

  return {
    date,
    timezone: ROME_TIME_ZONE,
    reminderCount: reminders.length,
    skippedNoCredits,
    skippedAlreadyHandled,
    reminders,
  };
}

export async function settleReminderDelivery({
  deliveryId,
  leaseToken,
  outcome,
  providerMessageId,
  error,
}: {
  deliveryId: string;
  leaseToken: string;
  outcome: "sent" | "failed";
  providerMessageId?: string;
  error?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const delivery = await tx.reminderDelivery.findUnique({
      where: { id: deliveryId },
      select: { id: true, tenantId: true, leaseToken: true, status: true, creditReserved: true },
    });

    if (!delivery || delivery.leaseToken !== leaseToken) {
      return { success: false as const, reason: "not-found" as const };
    }

    if (delivery.status === "SENT") {
      return { success: true as const, alreadySettled: true };
    }

    if (delivery.status !== "PROCESSING") {
      return { success: false as const, reason: "not-processing" as const };
    }

    if (outcome === "sent") {
      await tx.reminderDelivery.update({
        where: { id: delivery.id },
        data: {
          status: "SENT",
          creditReserved: false,
          providerMessageId: providerMessageId?.slice(0, 255) || null,
          lastError: null,
          sentAt: new Date(),
        },
      });

      return { success: true as const, alreadySettled: false };
    }

    await tx.reminderDelivery.update({
      where: { id: delivery.id },
      data: {
        status: "FAILED",
        creditReserved: false,
        lastError: error?.slice(0, 500) || "Errore invio OpenWA",
        failedAt: new Date(),
      },
    });

    if (delivery.creditReserved) {
      await tx.storeSettings.updateMany({
        where: { tenantId: delivery.tenantId },
        data: { smsCredits: { increment: 1 } },
      });
    }

    return { success: true as const, alreadySettled: false };
  });
}
