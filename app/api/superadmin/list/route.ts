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

    const totalAppointments = await prisma.appointment.count();
    const allAppointments = await prisma.appointment.findMany({
      select: { service: { select: { price: true } } }
    });
    const totalRevenue = allAppointments.reduce((acc: number, curr: any) => acc + (curr.service?.price || 0), 0);
    const totalNoShows = await prisma.noShow.count();

    return NextResponse.json({
      tenants,
      stats: {
        totalAppointments,
        totalRevenue,
        totalNoShows
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
