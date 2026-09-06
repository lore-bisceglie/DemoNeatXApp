import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = requireSuperAdmin(request);
  if (auth) return auth;

  const security = await prisma.superAdminSecurity.findUnique({
    where: { id: "default" },
    select: { twoFactorEnabledAt: true },
  });
  return NextResponse.json({ enabled: Boolean(security?.twoFactorEnabledAt) });
}
