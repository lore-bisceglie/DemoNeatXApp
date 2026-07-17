import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';

export async function DELETE(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

  try {
    const body = await req.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'ID negozio mancante' }, { status: 400 });
    }

    // Protezione Demo Pubbliche
    const target = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (target?.slug === 'demo-vetrina' || target?.slug === 'demo-neatx') {
      return NextResponse.json({ error: 'Operazione non consentita: Non puoi cancellare una Demo protetta.' }, { status: 403 });
    }

    // Per cancellare un negozio senza errori di Foreign Key, eliminiamo prima tutti i dati collegati
    await prisma.$transaction([
      prisma.appointment.deleteMany({ where: { tenantId } }),
      prisma.blockedSlot.deleteMany({ where: { tenantId } }),
      prisma.service.deleteMany({ where: { tenantId } }),
      prisma.storeSettings.deleteMany({ where: { tenantId } }),
      prisma.noShow.deleteMany({ where: { tenantId } }),
      prisma.waitlist.deleteMany({ where: { tenantId } }),
      prisma.customerNote.deleteMany({ where: { tenantId } }),
      prisma.activityLog.deleteMany({ where: { tenantId } }),
      prisma.staff.deleteMany({ where: { tenantId } }),
      // Infine eliminiamo il negozio stesso
      prisma.tenant.delete({ where: { id: tenantId } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore Cancellazione Negozio:', error);
    return NextResponse.json({ error: 'Errore durante la cancellazione' }, { status: 500 });
  }
}
