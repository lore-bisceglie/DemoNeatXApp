import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;

  try {
    const { tenantId } = await req.json();

    if (!tenantId) {
      return NextResponse.json({ error: "ID tenant mancante" }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      return NextResponse.json({ error: "Negozio non trovato" }, { status: 404 });
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        isDemoData: false,
        trialStatus: "published",
        publishedAt: tenant.publishedAt || new Date(),
      },
    });

    return NextResponse.json({ success: true, tenant: { id: updated.id, slug: updated.slug, name: updated.name } });
  } catch (error: any) {
    console.error("Errore superadmin publish:", error);
    return NextResponse.json({ error: error.message || "Errore interno" }, { status: 500 });
  }
}
