import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';

export async function DELETE(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

  try {
    const keepSlugs = ["demo-vetrina", "demo-neatx"];
    
    // Find all tenants to delete
    const tenantsToDelete = await prisma.tenant.findMany({
      where: {
        slug: { notIn: keepSlugs }
      },
      select: { id: true, slug: true }
    });

    if (tenantsToDelete.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: "Nessun test da eliminare." });
    }

    const tenantIds = tenantsToDelete.map(t => t.id);

    // Delete in a transaction to ensure all related data is removed via Prisma Cascade
    await prisma.$transaction([
      prisma.tenant.deleteMany({
        where: { id: { in: tenantIds } }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      count: tenantIds.length, 
      message: `Eliminati ${tenantIds.length} tenants di test.` 
    });
  } catch (error: any) {
    console.error('Errore cleanup:', error);
    return NextResponse.json({ error: error.message || 'Errore interno durante il cleanup' }, { status: 500 });
  }
}
