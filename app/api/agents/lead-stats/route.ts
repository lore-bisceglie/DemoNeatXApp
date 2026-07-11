import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;
  const total = await prisma.lead.count();
  const newLeads = await prisma.lead.count({ where: { status: 'new' } });
  const converted = await prisma.lead.count({ where: { status: 'converted' } });
  const recent = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { name: true, source: true, status: true, createdAt: true },
  });

  return NextResponse.json({ total, newLeads, converted, recent });
}
