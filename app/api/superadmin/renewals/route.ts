import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

type Renewal = {
  tenantId: string;
  name: string;
  plan: "pro" | "elite";
  renewsAt: string;
  amount: number | null;
  interval: "month" | "year" | null;
  willCancel: boolean;
};

function getPeriodEnd(subscription: Awaited<ReturnType<typeof stripe.subscriptions.retrieve>>) {
  const topLevelEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
  if (typeof topLevelEnd === "number") return topLevelEnd;

  const itemEnds = subscription.items.data
    .map((item) => (item as unknown as { current_period_end?: number }).current_period_end)
    .filter((end): end is number => typeof end === "number");
  return itemEnds.length ? Math.min(...itemEnds) : null;
}

export async function GET(request: Request) {
  const auth = requireSuperAdmin(request);
  if (auth) return auth;

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ renewals: [], unavailable: true });
  }

  try {
    const tenants = await prisma.tenant.findMany({
      where: {
        isDemoData: false,
        plan: { in: ["pro", "elite"] },
        trialStatus: { not: "gifted" },
        stripeSubscriptionId: { not: null },
      },
      select: { id: true, name: true, plan: true, stripeSubscriptionId: true },
    });

    const settled = await Promise.allSettled(tenants.map(async (tenant) => {
      const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId!);
      if (subscription.status !== "active" && subscription.status !== "trialing") return null;

      const periodEnd = getPeriodEnd(subscription);
      if (!periodEnd) return null;

      const price = subscription.items.data[0]?.price;
      return {
        tenantId: tenant.id,
        name: tenant.name,
        plan: tenant.plan === "pro" ? "pro" : "elite",
        renewsAt: new Date(periodEnd * 1000).toISOString(),
        amount: price?.unit_amount ?? null,
        interval: price?.recurring?.interval === "month" || price?.recurring?.interval === "year"
          ? price.recurring.interval
          : null,
        willCancel: subscription.cancel_at_period_end,
      } satisfies Renewal;
    }));

    const renewals = settled
      .flatMap((result) => result.status === "fulfilled" && result.value ? [result.value] : [])
      .sort((a, b) => new Date(a.renewsAt).getTime() - new Date(b.renewsAt).getTime());

    return NextResponse.json({ renewals });
  } catch (error) {
    console.error("Errore lettura prossimi rinnovi Stripe:", error);
    return NextResponse.json({ error: "Impossibile leggere i prossimi rinnovi" }, { status: 500 });
  }
}
