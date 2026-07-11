import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

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
