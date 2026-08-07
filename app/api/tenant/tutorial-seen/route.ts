export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";

// Marca "tutorial visto" sul negozio (una sola volta per negozio, salvato nel DB)
export async function POST(req: Request) {
  try {
    const { slug } = (await req.json()) as { slug?: string };
    if (!slug) {
      return NextResponse.json({ error: "Slug mancante" }, { status: 400 });
    }

    // La demo è aperta a tutti: non deve mai marcare il tutorial (non parte da solo)
    if (slug === "demo-neatx") {
      return NextResponse.json({ error: "Non richiesto per la demo" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) {
      return NextResponse.json({ error: "Negozio non trovato" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const authCookie = cookieStore.get(`admin_auth_${slug}`)?.value;
    if (!isTenantAdminCookieValid(authCookie, slug, tenant.sessionVersion)) {
      return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { tutorialSeenAt: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("tutorial-seen error:", err);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
