import { NextResponse } from "next/server";
import { getTenantAdminUrl, ROOT_DOMAIN } from "@/lib/domains";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cookieDomain(req: Request) {
  const hostname = new URL(req.url).hostname;
  if (process.env.NODE_ENV === "production" && hostname.endsWith(ROOT_DOMAIN)) {
    return `.${ROOT_DOMAIN}`;
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = cleanText(body.email).toLowerCase();
    const password = cleanText(body.password);

    if (!email || !password) {
      return NextResponse.json({ error: "Inserisci email e password." }, { status: 400 });
    }

    const tenants = await prisma.tenant.findMany({
      where: { ownerEmail: email },
      orderBy: { createdAt: "desc" },
    });

    const tenant = tenants.find((item) => {
      if (!item.ownerPasswordHash) return false;
      return verifyPassword(password, item.ownerPasswordHash);
    });

    if (!tenant?.adminPassword) {
      return NextResponse.json({ error: "Email o password non valide." }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      slug: tenant.slug,
      adminUrl: getTenantAdminUrl(tenant.slug),
    });

    response.cookies.set(`admin_auth_${tenant.slug}`, tenant.adminPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      domain: cookieDomain(req),
    });

    return response;
  } catch (error) {
    console.error("Errore account-login:", error);
    return NextResponse.json({ error: "Errore server." }, { status: 500 });
  }
}
