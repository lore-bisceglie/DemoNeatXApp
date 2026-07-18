import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");
  const success = searchParams.get("success");
  const refresh = searchParams.get("refresh");

  if (!tenantId) {
    return NextResponse.redirect(new URL("/", request.url));
  }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    const fallbackSlug = tenant?.slug || 'admin';
    if (!tenant) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    const authError = await requireTenantAdmin(tenant.id);
    if (authError) return authError;
  
  if (refresh === "true") {
    return NextResponse.redirect(new URL(`/t/${fallbackSlug}/admin?tab=stripe&stripe=incomplete`, request.url));
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
          return NextResponse.redirect(new URL(`/t/${fallbackSlug}/admin?tab=stripe&stripe=connected`, request.url));
        }
      } catch (error) {
        console.error("Error retrieving Stripe account:", error);
      }
    }
  }

  return NextResponse.redirect(new URL(`/t/${fallbackSlug}/admin?tab=stripe&stripe=incomplete`, request.url));
}
