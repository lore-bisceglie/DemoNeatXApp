import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        services: true,
        storeSettings: true,
        locations: {
          include: { settings: true },
          orderBy: { isMain: 'desc' },
        },
      }
    });

    const now = new Date();
    let mrr = 0;
    let payingCount = 0;
    let trialCount = 0;

    tenants.forEach(t => {
      if (t.plan === 'pro') {
        payingCount++;
        mrr += 29;
      } else if (t.plan === 'elite') {
        payingCount++;
        mrr += 59;
      } else if (t.trialEndsAt && t.trialEndsAt > now) {
        trialCount++;
      }
    });

    return NextResponse.json({
      tenants,
      stats: {
        mrr,
        payingCount,
        trialCount
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
