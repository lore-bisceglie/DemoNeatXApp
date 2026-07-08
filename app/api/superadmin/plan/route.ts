import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = req.headers.get('x-admin-password');
  if (auth !== 'godmode') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { tenantId, plan } = await req.json();

    if (!tenantId || !plan) {
      return NextResponse.json({ error: 'Campi mancanti' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    if (plan === 'premium' || plan === 'pro' || plan === 'elite') {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: plan,
          trialStatus: 'converted',
          trialEndsAt: null
        }
      });
    } else {
      // Revert to basic / trial
      const trialEnds = new Date();
      trialEnds.setDate(trialEnds.getDate() + 7);
      
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          plan: 'basic',
          trialStatus: 'active',
          trialEndsAt: trialEnds
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
