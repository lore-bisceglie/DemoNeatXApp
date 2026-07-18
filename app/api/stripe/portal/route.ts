import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { slug } = await req.json();
    if (!slug) {
      return NextResponse.json({ error: "Slug richiesto" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const authCookie = cookieStore.get("admin_auth_" + slug)?.value;

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      return NextResponse.json({ error: "Negozio non trovato" }, { status: 404 });
    }

    if (!isTenantAdminCookieValid(authCookie, slug)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    if (!tenant.stripeCustomerId) {
      return NextResponse.json({ error: "Nessun abbonamento attivo trovato. Contatta il supporto." }, { status: 400 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: tenant.stripeCustomerId,
      return_url: `${baseUrl}/t/${slug}/admin`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Errore creazione portale Stripe:", error);
    return NextResponse.json({ error: error.message || "Errore interno" }, { status: 500 });
  }
}
