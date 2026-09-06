import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Recent, high-impact actions performed from the Super Admin area. */
export async function GET(request: Request) {
  const auth = requireSuperAdmin(request);
  if (auth) return auth;

  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get("limit") || 8);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 30)
    : 8;

  try {
    const logs = await prisma.activityLog.findMany({
      where: { actor: "superadmin" },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        action: true,
        message: true,
        createdAt: true,
        tenant: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error("Errore storico superadmin:", error);
    return NextResponse.json({ error: "Impossibile caricare lo storico" }, { status: 500 });
  }
}
