import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';

export async function GET(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;
  const leadStats = await prisma.lead.aggregate({
    _count: { id: true },
    _max: { createdAt: true },
  });

  const totalLeads = leadStats._count.id;
  const lastLeadDate = leadStats._max.createdAt;

  const newLeads = await prisma.lead.count({ where: { status: 'new' } });
  const convertedLeads = await prisma.lead.count({ where: { status: 'converted' } });

  const activeTrials = await prisma.tenant.count({
    where: { trialStatus: { in: ['trial_active', 'demo', 'published'] },     plan: { notIn: ['pro', 'elite'] } },
  });

  const payingTenants = await prisma.tenant.count({
    where: { trialStatus: 'converted' },
  });

  const expiredTrials = await prisma.tenant.count({
    where: { trialStatus: 'expired' },
  });

  return NextResponse.json({
    leads: { total: totalLeads, new: newLeads, converted: convertedLeads, lastLead: lastLeadDate },
    tenants: { activeTrials, paying: payingTenants, expired: expiredTrials },
  });
}
