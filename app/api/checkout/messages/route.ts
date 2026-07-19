import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { requireTenantAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const PACKAGES: Record<string, { credits: number; priceInCents: number; label: string }> = {
  sms_500:  { credits: 500,  priceInCents: 2900,  label: '500 Messaggi' },
  sms_1000: { credits: 1000, priceInCents: 5500,  label: '1000 Messaggi' },
  sms_2000: { credits: 2000, priceInCents: 9900,  label: '2000 Messaggi' },
};

export async function POST(req: Request) {
  try {
    const { tenantId, packageId, slug } = await req.json();

    if (!tenantId || !packageId) {
      return NextResponse.json({ error: 'Dati mancanti' }, { status: 400 });
    }
    const authError = await requireTenantAdmin(tenantId);
    if (authError) return authError;

    if (process.env.REMINDERS_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Ricariche non disponibili finché i promemoria WhatsApp sono disattivati.' },
        { status: 503 }
      );
    }
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { slug: true },
    });
    if (!tenant || (slug && slug !== tenant.slug)) {
      return NextResponse.json({ error: 'Tenant non valido' }, { status: 400 });
    }

    const pkg = PACKAGES[packageId];
    if (!pkg) {
      return NextResponse.json({ error: 'Pacchetto non valido' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: pkg.label,
              description: `Pacchetto ${pkg.credits} messaggi WhatsApp/SMS per il tuo salone`,
            },
            unit_amount: pkg.priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      client_reference_id: tenantId,
      metadata: {
        type: 'message_package',
        credits: String(pkg.credits),
        packageId,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://neatx.store'}/t/${tenant.slug}/admin?tab=agenda&recharge=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://neatx.store'}/t/${tenant.slug}/admin?tab=agenda&recharge=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Errore creazione checkout messaggi:', error);
    return NextResponse.json({ error: error.message || 'Errore interno' }, { status: 500 });
  }
}
