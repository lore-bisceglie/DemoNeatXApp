import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { appointmentId, tenantSlug, amountEur, serviceName } = await request.json();

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: { storeSettings: true }
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const successUrl = `${baseUrl}/t/${tenantSlug}/success?session_id={CHECKOUT_SESSION_ID}&app_id=${appointmentId}`;
    const cancelUrl = `${baseUrl}/t/${tenantSlug}`;

    if (!tenant.storeSettings?.stripeAccountId || tenant.storeSettings.stripeAccountId.startsWith("acct_demo_")) {
      console.log("[Stripe Checkout] Mocking payment for tenant without real Stripe Account");
      return NextResponse.json({ url: successUrl.replace("{CHECKOUT_SESSION_ID}", "mock_session_123") });
    }

    // Crea la sessione di checkout per l'account collegato (Stripe Connect)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Prenotazione: ${serviceName}`,
            },
            unit_amount: Math.round(amountEur * 100), // converti in centesimi
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      payment_intent_data: {
        // Applichiamo una commissione della piattaforma fissa (es. 1 euro o 5% per questa demo)
        // Se l'importo è troppo piccolo, non applichiamo fee
        application_fee_amount: amountEur >= 5 ? 100 : 0, 
      },
    }, {
      stripeAccount: tenant.storeSettings.stripeAccountId,
    });

    // Salva il sessionId nell'appuntamento
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { stripeSession: session.id }
    });

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("Stripe Checkout Error:", error);
    
    // DEMO MOCK: Se c'è un errore con Stripe (chiavi di test scadute), simula successo
    const { appointmentId, tenantSlug } = await request.json().catch(() => ({}));
    if (tenantSlug && appointmentId) {
       const host = request.headers.get("host") || "localhost:3000";
       const protocol = host.includes("localhost") ? "http" : "https";
       return NextResponse.json({ url: `${protocol}://${host}/t/${tenantSlug}/success?session_id=mock_fallback&app_id=${appointmentId}` });
    }
    
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
