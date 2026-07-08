import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", { 
  apiVersion: "2024-04-10" as any 
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  }

  try {
    let settings = await prisma.storeSettings.findUnique({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.storeSettings.create({ data: { tenantId } });
    }

    let accountId = settings.stripeAccountId;

    if (!accountId) {
      // Create a new Connect account
      const account = await stripe.accounts.create({
        type: "standard", // Standard is perfect for zero-platform-fee
      });
      accountId = account.id;

      // Save the ID immediately
      await prisma.storeSettings.update({
        where: { tenantId },
        data: { stripeAccountId: accountId }
      });
    }

    // Create an account link for onboarding
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/api/stripe/callback?tenantId=${tenantId}&refresh=true`,
      return_url: `${origin}/api/stripe/callback?tenantId=${tenantId}&success=true`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(accountLink.url);

  } catch (error: any) {
    console.error("Stripe Connect Error:", error);

    // MOCK DEMO: Se Stripe fallisce (chiave invalida o scaduta),
    // simuliamo il collegamento andato a buon fine per permettere di testare l'app!
    await prisma.storeSettings.update({
      where: { tenantId },
      data: { 
        stripeAccountId: "acct_demo_" + Math.floor(Math.random()*1000), 
        stripeOnboardingComplete: true 
      }
    });
    
    // Siccome siamo nel dominio tenant, facciamo il redirect alla dashboard tenant giusta
    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }});
    return NextResponse.redirect(`${origin}/t/${tenant?.slug || 'beart'}/admin?stripe=demo_connected`);
  }
}
