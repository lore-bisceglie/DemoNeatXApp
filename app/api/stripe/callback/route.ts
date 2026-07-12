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
    return NextResponse.redirect(new URL(`/t/${tenant?.slug || 'demo'}/admin?tab=stripe&stripe=incomplete`, request.url));
  }

  if (success === "true") {
    const settings = await prisma.storeSettings.findUnique({ where: { tenantId } });
    if (settings?.stripeAccountId) {
      try {
        const account = await stripe.accounts.retrieve(settings.stripeAccountId);
        if (account.details_submitted) {
          await prisma.storeSettings.update({
            where: { tenantId },
            data: { stripeOnboardingComplete: true }
          });
          return NextResponse.redirect(new URL(`/t/${tenant?.slug || 'demo'}/admin?tab=stripe&stripe=connected`, request.url));
        }
      } catch (error) {
        console.error("Error retrieving Stripe account:", error);
      }
    }
  }

  return NextResponse.redirect(new URL(`/t/${tenant?.slug || 'demo'}/admin?tab=stripe&stripe=incomplete`, request.url));
}
