import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const auth = req.headers.get('x-admin-password');
  if (auth !== 'godmode') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { tenantId, days = 30, plan } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId mancante' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    // Aggiungi i giorni al trial o rinnova per i prossimi X giorni
    const newTrialEndsAt = new Date();
    newTrialEndsAt.setDate(newTrialEndsAt.getDate() + days);

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        trialEndsAt: newTrialEndsAt,
        ...(plan && { plan })
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Unlock Error:", error);
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
