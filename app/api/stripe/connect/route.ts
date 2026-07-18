import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { requireTenantAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
  }

  const authError = await requireTenantAdmin(tenantId);
  if (authError) return authError;

  try {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    let settings = await prisma.storeSettings.findUnique({ where: { tenantId } });
    if (!settings) {
      settings = await prisma.storeSettings.create({ data: { tenantId } });
    }

    let accountId = settings.stripeAccountId;

    const createAccount = async () => {
      const account = await stripe.accounts.create({
        type: "express",
        capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true },
        },
        business_type: "individual",
        business_profile: {
          url: `https://${tenant.slug}.neatx.store`,
          product_description: "Prenotazioni appuntamenti e servizi per il settore benessere",
        },
      });
      return account.id;
    };

    if (!accountId) {
      accountId = await createAccount();
      await prisma.storeSettings.update({
        where: { tenantId },
        data: { stripeAccountId: accountId }
      });
    }

    try {
      const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/api/stripe/callback?tenantId=${tenantId}&refresh=true`,
        return_url: `${origin}/api/stripe/callback?tenantId=${tenantId}&success=true`,
        type: "account_onboarding",
      });
      return NextResponse.json({ url: accountLink.url });
    } catch (linkError: any) {
      console.error("Stripe Account Link Error, retrying with new account:", linkError);
      await prisma.storeSettings.update({
        where: { tenantId },
        data: { stripeAccountId: null }
      });
      accountId = await createAccount();
      await prisma.storeSettings.update({
        where: { tenantId },
        data: { stripeAccountId: accountId }
      });
      const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${origin}/api/stripe/callback?tenantId=${tenantId}&refresh=true`,
        return_url: `${origin}/api/stripe/callback?tenantId=${tenantId}&success=true`,
        type: "account_onboarding",
      });
      return NextResponse.json({ url: accountLink.url });
    }

  } catch (error: any) {
    console.error("Stripe Connect Error:", error);

    return NextResponse.json(
      { error: "Errore nel collegamento a Stripe. Il conto non è stato collegato. " + (error?.message || "Riprova più tardi.") },
      { status: 500 }
    );
  }
}
