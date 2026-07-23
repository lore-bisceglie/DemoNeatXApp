import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAdmin } from "@/lib/auth";
import { ensureReferralCode } from '@/lib/referral';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId richiesto' }, { status: 400 });
  }
  const authError = await requireTenantAdmin(tenantId);
  if (authError) return authError;

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, referralCode: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
  }

  const referralCode = await ensureReferralCode(tenant.id);

  // Conta referral fatti
  const referralCount = await prisma.tenant.count({
    where: { referredByCode: referralCode, trialStatus: 'converted' },
  });

  const totalReferrals = await prisma.tenant.count({
    where: { referredByCode: referralCode },
  });

  const creditsEarned = referralCount * 100; // 100 crediti SMS per ogni referral convertito

  return NextResponse.json({
    referralCode,
    referralLink: `https://neatx.store/registrazione?ref=${referralCode}`,
    totalReferrals,
    convertedReferrals: referralCount,
    creditsEarned,
  });
}
