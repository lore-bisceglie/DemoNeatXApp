import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTenantSessionToken, requireSuperAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  const authError = requireSuperAdmin(request);
  if (authError) return authError;

  const body = await request.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  if (!slug) {
    return NextResponse.json({ error: "Slug mancante" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { slug: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Negozio non trovato" }, { status: 404 });
  }

  const token = createTenantSessionToken(tenant.slug, 60);
  const magicUrl = `/api/telegram/magic?slug=${encodeURIComponent(tenant.slug)}&secret=${encodeURIComponent(token)}`;
  return NextResponse.json({ magicUrl });
}
