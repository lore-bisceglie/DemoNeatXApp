import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { tenantId, slug, plan = 'pro', interval = 'month' } = await request.json();

    if (!tenantId || !['pro', 'elite'].includes(plan) || !['month', 'year'].includes(interval)) {
      return NextResponse.json({ error: "Dati abbonamento non validi" }, { status: 400 });
    }
    const authError = await requireTenantAdmin(tenantId);
    if (authError) return authError;

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    if (tenant.slug !== slug) {
      return NextResponse.json({ error: "Tenant non valido" }, { status: 400 });
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
      metadata: { type: "subscription", plan, interval },
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

    return NextResponse.json(
      { error: "Errore nel processare il pagamento. Il tuo piano non è stato attivato. " + (error?.message || "Riprova più tardi.") },
      { status: 500 }
    );
  }
}
