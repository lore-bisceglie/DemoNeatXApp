import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = req.headers.get('x-admin-password');
  if (auth !== 'godmode') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        services: true,
        storeSettings: true
      }
    });

    const now = new Date();
    let mrr = 0;
    let payingCount = 0;
    let trialCount = 0;

    tenants.forEach(t => {
      if (t.plan === 'pro' || t.plan === 'premium') {
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
