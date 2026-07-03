import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = req.headers.get('x-admin-password');
  if (auth !== 'NeatxAdmin2026') {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        services: true
      }
    });
    return NextResponse.json(tenants);
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
