import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantAdminUrl } from "@/lib/domains";
import { sendTrialReminder3Days, sendTrialReminder1Day, sendTrialExpiredOffer } from "@/lib/email";
import { sendTelegramMessage } from "@/lib/telegram";

function authorize(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const TRIAL_EMAIL_ACTIONS = {
  reminder3Days: "EMAIL_TRIAL_REMINDER_3_DAYS",
  reminder1Day: "EMAIL_TRIAL_REMINDER_1_DAY",
  expiredOffer: "EMAIL_TRIAL_EXPIRED_OFFER",
} as const;

async function wasTrialEmailSent(tenantId: string, action: string) {
  return Boolean(await prisma.activityLog.findFirst({
    where: { tenantId, action },
    select: { id: true },
  }));
}

async function recordTrialEmail(tenantId: string, action: string, message: string) {
  await prisma.activityLog.create({
    data: { tenantId, action, actor: "system", message },
  });
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const now = new Date();
  const results = { reminder3Days: 0, reminder1Day: 0, expiredOffers: 0, expired: 0, hotLeads: [] as string[] };

  // --- TENANT CON TRIAL IN SCADENZA TRA 3 GIORNI ---
  const in2Days = new Date(now.getTime() + 2 * 86400000);
  const in3Days = new Date(now.getTime() + 3 * 86400000);
  const day3Tenants = await prisma.tenant.findMany({
    where: {
      ownerEmail: { not: null },
      isDemoData: false,
      trialStatus: { in: ["trial_active", "demo", "published"] },
      trialEndsAt: { gt: in2Days, lte: in3Days },
    },
    select: { id: true, name: true, slug: true, ownerEmail: true, ownerName: true, trialEndsAt: true },
  });
  for (const t of day3Tenants) {
    if (!t.ownerEmail) continue;
    const daysLeft = Math.ceil((t.trialEndsAt!.getTime() - now.getTime()) / 86400000);
    if (daysLeft === 3 && !await wasTrialEmailSent(t.id, TRIAL_EMAIL_ACTIONS.reminder3Days)) {
      const sent = await sendTrialReminder3Days(t.ownerEmail, t.name, t.ownerName || "titolare", getTenantAdminUrl(t.slug));
      if (sent) {
        await recordTrialEmail(t.id, TRIAL_EMAIL_ACTIONS.reminder3Days, "Promemoria prova: scadenza tra 3 giorni");
        results.reminder3Days++;
        results.hotLeads.push(`${t.name} (scade tra 3gg)`);
      }
    }
  }

  // --- TENANT CON TRIAL IN SCADENZA TRA 1 GIORNO ---
  const in1Day = new Date(now);
  in1Day.setDate(in1Day.getDate() + 1);
  const day1Tenants = await prisma.tenant.findMany({
    where: {
      ownerEmail: { not: null },
      isDemoData: false,
      trialStatus: { in: ["trial_active", "demo", "published"] },
      trialEndsAt: { gt: now, lte: in1Day },
    },
    select: { id: true, name: true, slug: true, ownerEmail: true, ownerName: true, trialEndsAt: true },
  });
  for (const t of day1Tenants) {
    if (!t.ownerEmail) continue;
    const daysLeft = Math.ceil((t.trialEndsAt!.getTime() - now.getTime()) / 86400000);
    if (daysLeft > 0 && daysLeft <= 1 && !await wasTrialEmailSent(t.id, TRIAL_EMAIL_ACTIONS.reminder1Day)) {
      const sent = await sendTrialReminder1Day(t.ownerEmail, t.name, t.ownerName || "titolare", getTenantAdminUrl(t.slug));
      if (sent) {
        await recordTrialEmail(t.id, TRIAL_EMAIL_ACTIONS.reminder1Day, "Promemoria prova: ultimo giorno");
        results.reminder1Day++;
        results.hotLeads.push(`${t.name} (ULTIMO GIORNO!)`);
      }
    }
  }

  // --- TENANT CON TRIAL APPENA SCADUTO (da 1 a 3 giorni fa) ---
  const expiredSince = new Date(now);
  expiredSince.setDate(expiredSince.getDate() - 3);
  const expiredTenants = await prisma.tenant.findMany({
    where: {
      ownerEmail: { not: null },
      isDemoData: false,
      trialStatus: { in: ["trial_active", "demo", "published"] },
      trialEndsAt: { gte: expiredSince, lt: now },
    },
    select: { id: true, name: true, slug: true, ownerEmail: true, ownerName: true },
  });
  for (const t of expiredTenants) {
    if (!t.ownerEmail) continue;
    if (await wasTrialEmailSent(t.id, TRIAL_EMAIL_ACTIONS.expiredOffer)) continue;
    const sent = await sendTrialExpiredOffer(t.ownerEmail, t.name, t.ownerName || "titolare", `${process.env.NEXT_PUBLIC_APP_URL || "https://neatx.store"}/paywall/${t.slug}`);
    if (sent) {
      await recordTrialEmail(t.id, TRIAL_EMAIL_ACTIONS.expiredOffer, "Prova scaduta: invito alla riattivazione");
      results.expiredOffers++;
      results.hotLeads.push(`${t.name} (scaduto - offerta riattivazione)`);
    }
  }

  // --- SCADENZA AUTOMATICA (trial scaduto da >3gg) ---
  const expiredCutoff = new Date(now);
  expiredCutoff.setDate(expiredCutoff.getDate() - 3);
  const expiredResult = await prisma.tenant.updateMany({
    where: {
      isDemoData: false,
      trialStatus: { in: ["demo", "trial_active", "published"] },
      trialEndsAt: { lt: expiredCutoff },
    },
    data: { trialStatus: "expired", plan: "basic" },
  });
  results.expired = expiredResult.count;

  // --- NOTIFICA TELEGRAM HOT LEADS ---
  if (results.hotLeads.length > 0) {
    const msg = "🔥 <b>SALES PIPELINE NEATX</b>\n\n" +
      results.hotLeads.map(l => `• ${l}`).join("\n");
    await sendTelegramMessage(msg).catch((e) => console.error("[Cron Trials] Errore Telegram:", e));
  }

  return NextResponse.json({ success: true, ...results });
}
