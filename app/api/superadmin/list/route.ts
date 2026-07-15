import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        // Campi identità
        id: true,
        slug: true,
        name: true,
        category: true,
        city: true,
        ownerName: true,
        ownerEmail: true,       // Visibile al superadmin per supporto
        logoUrl: true,
        themeColor: true,
        description: true,
        phone: true,
        address: true,
        instagramUrl: true,
        facebookUrl: true,
        tiktokUrl: true,
        websiteUrl: true,
        mapsLink: true,
        bookingUrl: true,
        openTime: true,
        closeTime: true,
        breakStart: true,
        breakEnd: true,
        closedDays: true,
        // Stato abbonamento (necessario per stats)
        trialStartedAt: true,
        trialEndsAt: true,
        trialStatus: true,
        isDemoData: true,
        activationRequested: true,
        publishedAt: true,
        convertedAt: true,
        plan: true,
        createdAt: true,
        // NO: adminPassword, ownerPasswordHash, stripeCustomerId,
        //     stripeSubscriptionId, staffSheetUrl, referralCode,
        //     referredByCode, emailVerifyToken
        services: {
          select: { id: true, name: true, price: true, duration: true },
        },
        storeSettings: {
          select: {
            id: true,
            paymentStrategy: true,
            stripeOnboardingComplete: true,
            smsCredits: true,
          },
        },
        locations: {
          orderBy: { isMain: 'desc' },
          select: {
            id: true,
            name: true,
            address: true,
            isMain: true,
            isActive: true,
          },
        },
      },
    });

    const now = new Date();
    let mrr = 0;
    let payingCount = 0;
    let trialCount = 0;

    tenants.forEach(t => {
      if (t.plan === 'pro') {
        payingCount++;
        mrr += 29;
      } else if (t.plan === 'elite') {
        payingCount++;
        mrr += 59;
      } else if (t.trialEndsAt && t.trialEndsAt > now) {
        trialCount++;
      }
    });

    return NextResponse.json({
      tenants,
      stats: {
        mrr,
        payingCount,
        trialCount,
      },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Errore interno';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
