import { NextResponse } from "next/server";
import { getTenantAdminUrl, ROOT_DOMAIN } from "@/lib/domains";
import { prisma } from "@/lib/prisma";
import { verifyTenantSessionToken, createTenantSessionToken } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const secret = url.searchParams.get("secret");

    if (!slug || !secret) {
      return NextResponse.json({ error: "Link non valido (parametri mancanti)." }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || !verifyTenantSessionToken(secret, slug, tenant.sessionVersion)) {
      return NextResponse.json({ error: "Link di accesso magico scaduto o non valido." }, { status: 403 });
    }

    // In sviluppo il SuperAdmin deve restare sullo stesso host locale. In
    // produzione il magic link continua a usare il dominio pubblico del tenant.
    const adminUrl =
      process.env.NODE_ENV === "production"
        ? getTenantAdminUrl(slug)
        : new URL(`/t/${encodeURIComponent(slug)}/admin`, req.url);
    const response = NextResponse.redirect(adminUrl);

    // Iniettiamo un cookie di sessione firmato (24 ore)
    response.cookies.set(`admin_auth_${slug}`, createTenantSessionToken(slug, 60 * 60 * 24, tenant.sessionVersion), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 ore
      path: "/",
      domain: process.env.NODE_ENV === "production" ? `.${ROOT_DOMAIN}` : undefined,
    });

    return response;
  } catch (_error) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
