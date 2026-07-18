import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createSuperAdminSessionToken } from "@/lib/auth";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";

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

  const response = NextResponse.json({ success: true });
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
  response.cookies.set("superadmin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0,
    path: "/",
  });
  return response;
}
