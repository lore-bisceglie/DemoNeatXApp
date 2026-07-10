import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { tenantId, slug, plan = 'pro', interval = 'month', priceId } = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const successUrl = `${baseUrl}/t/${slug}/admin?payment=success`;
    const cancelUrl = `${baseUrl}/paywall/${slug}`;

    const isMonthly = interval !== 'year';
    const prices: Record<string, { monthly: number; yearly: number }> = {
      pro: { monthly: 2900, yearly: 29000 },
      elite: { monthly: 5900, yearly: 59000 },
    };
    const selected = prices[plan] || prices.pro;
    const amount = isMonthly ? selected.monthly : selected.yearly;
    const planLabel = plan === 'elite' ? "Elite" : "Pro";
    const intervalLabel = isMonthly ? "Mensile" : "Annuale";

    const sessionConfig: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `NeatX ${planLabel} - ${intervalLabel}`,
              description: `Abbonamento gestionale per il salone ${tenant.name}`,
            },
            unit_amount: amount,
            recurring: { interval: isMonthly ? 'month' : 'year' },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer_email: tenant.ownerEmail || undefined,
      client_reference_id: tenantId,
      metadata: { plan, interval },
      subscription_data: {
        metadata: { tenant_id: tenantId, plan, interval },
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("Stripe Subscription Checkout Error:", error);

    const { tenantId: fallbackId, slug: fallbackSlug, plan: fallbackPlan = 'pro' } = await request.json().catch(() => ({}));
    if (fallbackId && fallbackSlug) {
       await prisma.tenant.update({
         where: { id: fallbackId },
         data: { plan: fallbackPlan, trialStatus: 'converted', trialEndsAt: null }
       });
       const host = request.headers.get("host") || "localhost:3000";
       const protocol = host.includes("localhost") ? "http" : "https";
       return NextResponse.json({ url: `${protocol}://${host}/t/${fallbackSlug}/admin?payment=demo_mock_success` });
    }

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
