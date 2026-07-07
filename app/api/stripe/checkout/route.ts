import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { tenantId, slug } = await req.json();

    if (!tenantId || !slug) {
      return NextResponse.json({ error: 'Mancano tenantId o slug' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    // URL di base dinamico per i redirect post-pagamento
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.get('host') || 'neatx.store';
    const domain = host.includes('localhost') ? `${slug}.localhost:3000` : `${slug}.neatx.store`;
    const baseUrl = `${protocol}://${domain}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'paypal'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Abbonamento Pro - NeatX',
              description: `Licenza mensile per ${tenant.name}`,
            },
            unit_amount: 2900, // 29.00 EUR
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${baseUrl}/admin?payment=success`,
      cancel_url: `${baseUrl}/paywall/${slug}?payment=cancelled`,
      client_reference_id: tenant.id, // CRUCIALE: serve al webhook per sapere chi ha pagato!
      customer_email: tenant.ownerEmail || undefined,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
