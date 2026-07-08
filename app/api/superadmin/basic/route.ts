import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const auth = req.headers.get('x-admin-password');
  if (auth !== 'NeatxAdmin2026') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const { tenantId } = await req.json();
    if (!tenantId) return NextResponse.json({ error: 'ID mancante' }, { status: 400 });

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        plan: 'basic',
        // Non tocchiamo il trialStatus, così se era converted resta converted ma con meno poteri
      }
    });

    return NextResponse.json({ success: true, tenant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
