export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug },
      include: {
        services: true,
        staff: {
          include: { services: true }
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Nessun negozio trovato' }, { status: 404 });
    }

    const now = new Date();
    const trialActive = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) > now : false;
    const isPremium = tenant.plan === 'premium' || trialActive;
    const isTrialExpired = tenant.trialEndsAt && now > tenant.trialEndsAt;

    if (isTrialExpired && !isPremium) {
      return NextResponse.json({ ...tenant, trialExpired: true, isPremium });
    }

    return NextResponse.json({ ...tenant, trialExpired: false, isPremium });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
