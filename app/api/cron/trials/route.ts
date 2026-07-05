import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTenantAdminUrl } from "@/lib/domains";

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.TRIAL_EMAIL_FROM || "NeatX <noreply@neatx.store>";

  if (!apiKey) return { skipped: true };

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  return { ok: res.ok };
}

function authorize(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const now = new Date();
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 2);

  const expiringSoon = await prisma.tenant.findMany({
    where: {
      ownerEmail: { not: null },
      plan: { not: "premium" },
      trialStatus: { in: ["demo", "trial_active", "published"] },
      trialEndsAt: {
        gte: now,
        lte: soon,
      },
    },
    select: {
      name: true,
      slug: true,
      ownerEmail: true,
      trialEndsAt: true,
    },
  });

  let reminderEmails = 0;
  for (const tenant of expiringSoon) {
    if (!tenant.ownerEmail) continue;
    await sendEmail(
      tenant.ownerEmail,
      `La prova NeatX di ${tenant.name} sta per scadere`,
      `<p>Ciao, la prova gratuita di <strong>${tenant.name}</strong> scade a breve.</p><p>Puoi rientrare qui: <a href="${getTenantAdminUrl(tenant.slug)}">${getTenantAdminUrl(tenant.slug)}</a></p>`
    );
    reminderEmails += 1;
  }

  const expired = await prisma.tenant.updateMany({
    where: {
      plan: { not: "premium" },
      trialStatus: { in: ["demo", "trial_active", "published"] },
      trialEndsAt: {
        lt: now,
      },
    },
    data: {
      trialStatus: "expired",
    },
  });

  return NextResponse.json({
    success: true,
    expiredUpdated: expired.count,
    reminderEmails,
  });
}
