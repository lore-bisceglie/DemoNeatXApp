import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { tenantId, slug, plan = 'pro', priceId } = await request.json();

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

    // Creo una sessione di abbonamento (mode: "subscription") usando l'account Stripe del proprietario della piattaforma (NeatX)
    const sessionConfig: any = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: plan === 'elite' ? "NeatX Elite - Abbonamento Mensile" : "NeatX Pro - Abbonamento Mensile",
              description: `Abbonamento gestionale per il salone ${tenant.name}`,
            },
            unit_amount: plan === 'elite' ? 5900 : 2900, // 59€ o 29€
            recurring: {
              interval: 'month',
            }
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      customer_email: tenant.ownerEmail || undefined, // Aggiunto per le fatture automatiche
      client_reference_id: tenantId, // Questo viene poi intercettato dal webhook!
      metadata: {
        plan: plan // Passiamo il piano richiesto nei metadata
      },
      success_url: successUrl,
      cancel_url: cancelUrl,
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("Stripe Subscription Checkout Error:", error);
    
    // DEMO MOCK: Se c'è un errore (es. nessuna chiave stripe su Vercel), simuliamo il pagamento per la demo
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
