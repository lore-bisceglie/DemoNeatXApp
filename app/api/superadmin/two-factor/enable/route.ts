import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRecoveryCodes, encryptTotpSecret, hashRecoveryCode, readTwoFactorSetupToken, verifyTotpCode } from "@/lib/superadmin-two-factor";

function getCookie(request: Request, name: string) {
  return (request.headers.get("cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || null;
}

export async function POST(request: Request) {
  const auth = requireSuperAdmin(request);
  if (auth) return auth;

  const { code } = await request.json().catch(() => ({ code: "" }));
  const secret = readTwoFactorSetupToken(getCookie(request, "superadmin_pending_2fa_setup"));
  if (!secret || typeof code !== "string" || !verifyTotpCode(secret, code)) {
    return NextResponse.json({ error: "Codice Authenticator non valido o scaduto." }, { status: 400 });
  }

  const recoveryCodes = createRecoveryCodes();
  await prisma.superAdminSecurity.upsert({
    where: { id: "default" },
    create: { id: "default", totpSecretEncrypted: encryptTotpSecret(secret), recoveryCodeHashes: recoveryCodes.map(hashRecoveryCode), twoFactorEnabledAt: new Date() },
    update: { totpSecretEncrypted: encryptTotpSecret(secret), recoveryCodeHashes: recoveryCodes.map(hashRecoveryCode), twoFactorEnabledAt: new Date() },
  });

  const response = NextResponse.json({ success: true, recoveryCodes });
  response.cookies.set("superadmin_pending_2fa_setup", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 0, path: "/" });
  return response;
}
