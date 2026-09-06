import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createSuperAdminSessionToken } from "@/lib/auth";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";
import { prisma } from "@/lib/prisma";
import { createPendingTwoFactorToken } from "@/lib/superadmin-two-factor";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const rate = await checkRequestRateLimit(request, "superadmin-login", 10, 15 * 60);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Troppi tentativi. Riprova più tardi." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const { password } = await request.json().catch(() => ({ password: "" }));
  const expected = process.env.SUPERADMIN_PASSWORD;
  if (!expected || typeof password !== "string" || !safeEqual(password, expected)) {
    return NextResponse.json({ error: "Credenziali non valide" }, { status: 401 });
  }

  const security = await prisma.superAdminSecurity.findUnique({
    where: { id: "default" },
    select: { twoFactorEnabledAt: true, totpSecretEncrypted: true },
  });

  if (security?.twoFactorEnabledAt && security.totpSecretEncrypted) {
    const response = NextResponse.json({ success: true, requiresTwoFactor: true });
    response.cookies.set("superadmin_pending_2fa", createPendingTwoFactorToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 5 * 60,
      path: "/",
    });
    return response;
  }

  const response = NextResponse.json({ success: true, requiresTwoFactor: false });
  response.cookies.set("superadmin_session", createSuperAdminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 8 * 60 * 60,
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  for (const name of ["superadmin_session", "superadmin_pending_2fa", "superadmin_pending_2fa_setup"]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });
  }
  return response;
}
