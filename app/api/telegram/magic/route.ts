import { NextResponse } from "next/server";
import { getTenantAdminUrl } from "@/lib/domains";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    const secret = url.searchParams.get("secret");

    if (!slug || !secret) {
      return NextResponse.json({ error: "Link non valido (parametri mancanti)." }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.adminPassword !== secret) {
      return NextResponse.json({ error: "Link di accesso magico scaduto o non valido." }, { status: 403 });
    }

    // Creiamo il redirect alla dashboard
    const adminUrl = getTenantAdminUrl(slug);
    const response = NextResponse.redirect(adminUrl);
    
    // Iniettiamo il cookie di autorizzazione
    response.cookies.set(`admin_auth_${slug}`, secret, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 24 ore
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
