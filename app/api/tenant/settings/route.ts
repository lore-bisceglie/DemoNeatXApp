import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";

export async function PUT(request: Request) {
  try {
    const { tenantId, staffSheetUrl } = await request.json();

    if (!tenantId) {
      return NextResponse.json({ error: "Missing tenantId" }, { status: 400 });
    }

    // Recupera il tenant per verificare l'autenticazione
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, slug: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Negozio non trovato" }, { status: 404 });
    }

    // Verifica il cookie di autenticazione admin
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(`admin_auth_${tenant.slug}`)?.value;
    if (!isTenantAdminCookieValid(authCookie, tenant.slug)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: { staffSheetUrl },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
