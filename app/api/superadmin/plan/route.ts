import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { awardReferrerForConversion } from '@/lib/referral';
import { logActivity } from '@/lib/activity';

export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

  try {
    const { tenantId, plan, giftedPlan, giftedMonths } = await req.json();

    if (!tenantId || !plan) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    if (plan === 'gifted') {
      const giftPlan = giftedPlan === 'pro' ? 'pro' : 'elite';
      const months = Math.min(Math.max(Number(giftedMonths) || 0, 1), 36);
      const giftedUntil = new Date();
      giftedUntil.setMonth(giftedUntil.getMonth() + months);
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: giftPlan,
          trialStatus: 'gifted',
          trialEndsAt: giftedUntil,
        },
      });
    } else if (plan === 'pro' || plan === 'elite') {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: plan,
          trialStatus: 'converted',
          trialEndsAt: null,
          emailVerified: true,
          emailVerifyToken: null,
          emailVerifyExpiresAt: null,
        }
      });
      await awardReferrerForConversion(tenantId, 'superadmin');
    } else if (plan === 'expire') {
      // Forza scadenza trial
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: 'basic',
          trialStatus: 'active',
          trialEndsAt: new Date(Date.now() - 1000 * 60 * 60 * 24) // Ieri
        }
      });
    } else {
      // Revert to basic / trial
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 14);
      
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: 'basic',
          trialStatus: 'active',
          trialEndsAt: trialEnds
        }
      });
    }

    const planMessages: Record<string, string> = {
      pro: "Piano cambiato in Pro dal Super Admin.",
      elite: "Piano cambiato in Elite dal Super Admin.",
      expire: "Trial forzato come scaduto dal Super Admin.",
      basic: "Trial riattivato dal Super Admin.",
      gifted: "Abbonamento regalato dal Super Admin.",
    };
    await logActivity({
      tenantId,
      actor: "superadmin",
      action: "plan_updated",
      message: planMessages[plan] || "Piano aggiornato dal Super Admin.",
      metadata: { plan },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
