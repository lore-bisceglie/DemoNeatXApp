import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get('tenantId');

  if (!tenantId) {
    return NextResponse.json({ error: 'tenantId richiesto' }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true, name: true, slug: true, referralCode: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
  }

  // Genera referral code se non esiste
  if (!tenant.referralCode) {
    const code = tenant.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 12) || tenant.slug.toUpperCase().slice(0, 12);
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { referralCode: code },
    });
    tenant.referralCode = code;
  }

  // Conta referral fatti
  const referralCount = await prisma.tenant.count({
    where: { referredByCode: tenant.referralCode, trialStatus: 'converted' },
  });

  const totalReferrals = await prisma.tenant.count({
    where: { referredByCode: tenant.referralCode },
  });

  const creditsEarned = referralCount * 100; // 100 crediti SMS per ogni referral convertito

  return NextResponse.json({
    referralCode: tenant.referralCode,
    referralLink: `https://neatx.store/registrazione?ref=${tenant.referralCode}`,
    totalReferrals,
    convertedReferrals: referralCount,
    creditsEarned,
  });
}
