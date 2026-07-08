import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", { 
  apiVersion: "2024-04-10" as any 
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const success = searchParams.get("success");
  const refresh = searchParams.get("refresh");

  if (!tenantId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  
  if (refresh === "true") {
    // L'utente è uscito prima di finire, lo rimandiamo al pannello admin o gli diamo un nuovo link
    return NextResponse.redirect(new URL(`/t/${tenant?.slug || 'demo'}/admin?stripe=incomplete`, request.url));
  }

  if (success === "true") {
    // Controlliamo su Stripe se ha davvero finito (anti-furbetti)
    const settings = await prisma.storeSettings.findUnique({ where: { tenantId } });
    if (settings?.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(settings.stripeAccountId);
        if (account.details_submitted) {
          await prisma.storeSettings.update({
            where: { tenantId },
            data: { stripeOnboardingComplete: true }
          });
          return NextResponse.redirect(new URL(`/t/${tenant?.slug || 'demo'}/admin?stripe=connected`, request.url));
        }
      } catch (error) {
        console.error("Error retrieving Stripe account:", error);
      }
    }
  }

  // Fallback
  return NextResponse.redirect(new URL(`/t/${tenant?.slug || 'demo'}/admin?stripe=incomplete`, request.url));
}
