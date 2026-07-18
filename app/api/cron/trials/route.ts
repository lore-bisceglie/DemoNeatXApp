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

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const now = new Date();
  const results = { reminder3Days: 0, reminder1Day: 0, expiredOffers: 0, expired: 0, hotLeads: [] as string[] };

  // --- TENANT CON TRIAL IN SCADENZA TRA 3 GIORNI ---
  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);
  const day3Tenants = await prisma.tenant.findMany({
    where: {
      ownerEmail: { not: null },
      plan: { notIn: ["pro", "elite"] },
      trialStatus: { in: ["trial_active", "demo", "published"] },
      trialEndsAt: { gte: new Date(now.getTime() - 86400000), lte: new Date(in3Days.getTime() + 86400000) },
    },
    select: { id: true, name: true, slug: true, ownerEmail: true, ownerName: true, trialEndsAt: true },
  });
  for (const t of day3Tenants) {
    if (!t.ownerEmail) continue;
    const daysLeft = Math.ceil((t.trialEndsAt!.getTime() - now.getTime()) / 86400000);
    if (daysLeft === 3) {
      await sendTrialReminder3Days(t.ownerEmail, t.name, t.ownerName || "titolare", getTenantAdminUrl(t.slug));
      results.reminder3Days++;
      results.hotLeads.push(`${t.name} (scade tra 3gg)`);
    }
  }

  // --- TENANT CON TRIAL IN SCADENZA TRA 1 GIORNO ---
  const in1Day = new Date(now);
  in1Day.setDate(in1Day.getDate() + 1);
  const day1Tenants = await prisma.tenant.findMany({
    where: {
      ownerEmail: { not: null },
      plan: { notIn: ["pro", "elite"] },
      trialStatus: { in: ["trial_active", "demo", "published"] },
      trialEndsAt: { gte: new Date(now.getTime() - 86400000), lte: new Date(in1Day.getTime() + 86400000) },
    },
    select: { id: true, name: true, slug: true, ownerEmail: true, ownerName: true, trialEndsAt: true },
  });
  for (const t of day1Tenants) {
    if (!t.ownerEmail) continue;
    const daysLeft = Math.ceil((t.trialEndsAt!.getTime() - now.getTime()) / 86400000);
    if (daysLeft <= 1) {
      await sendTrialReminder1Day(t.ownerEmail, t.name, t.ownerName || "titolare", getTenantAdminUrl(t.slug));
      results.reminder1Day++;
      results.hotLeads.push(`${t.name} (ULTIMO GIORNO!)`);
    }
  }

  // --- TENANT CON TRIAL APPENA SCADUTO (da 1 a 3 giorni fa) ---
  const expiredSince = new Date(now);
  expiredSince.setDate(expiredSince.getDate() - 3);
  const expiredTenants = await prisma.tenant.findMany({
    where: {
      ownerEmail: { not: null },
      plan: { notIn: ["pro", "elite"] },
      trialStatus: { in: ["trial_active", "demo", "published"] },
      trialEndsAt: { gte: expiredSince, lt: now },
    },
    select: { id: true, name: true, slug: true, ownerEmail: true, ownerName: true },
  });
  for (const t of expiredTenants) {
    if (!t.ownerEmail) continue;
    await sendTrialExpiredOffer(t.ownerEmail, t.name, t.ownerName || "titolare", `${process.env.NEXT_PUBLIC_APP_URL || "https://neatx.store"}/paywall/${t.slug}`);
    results.expiredOffers++;
    results.hotLeads.push(`${t.name} (scaduto - offerta riattivazione)`);
  }

  // --- SCADENZA AUTOMATICA (trial scaduto da >3gg) ---
  const expiredCutoff = new Date(now);
  expiredCutoff.setDate(expiredCutoff.getDate() - 3);
  const expiredResult = await prisma.tenant.updateMany({
    where: {
      plan: { notIn: ["pro", "elite"] },
      trialStatus: { in: ["demo", "trial_active", "published"] },
      trialEndsAt: { lt: expiredCutoff },
    },
    data: { trialStatus: "expired" },
  });
  results.expired = expiredResult.count;

  // --- NOTIFICA TELEGRAM HOT LEADS ---
  if (results.hotLeads.length > 0) {
    const msg = "🔥 <b>SALES PIPELINE NEATX</b>\n\n" +
      results.hotLeads.map(l => `• ${l}`).join("\n");
    await sendTelegramMessage(msg).catch(() => {});
  }

  return NextResponse.json({ success: true, ...results });
}
