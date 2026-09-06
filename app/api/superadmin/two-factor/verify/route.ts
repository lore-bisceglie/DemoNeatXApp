import { NextResponse } from "next/server";
import { createSuperAdminSessionToken } from "@/lib/auth";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";
import { prisma } from "@/lib/prisma";
import { decryptTotpSecret, hasPendingTwoFactorToken, hashRecoveryCode, verifyTotpCode } from "@/lib/superadmin-two-factor";

function getCookie(request: Request, name: string) {
  return (request.headers.get("cookie") || "").split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`))?.slice(name.length + 1) || null;
}

export async function POST(request: Request) {
  const rate = await checkRequestRateLimit(request, "superadmin-two-factor", 10, 15 * 60);
  if (!rate.success) return NextResponse.json({ error: "Troppi tentativi. Riprova più tardi." }, { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } });
  if (!hasPendingTwoFactorToken(getCookie(request, "superadmin_pending_2fa"))) return NextResponse.json({ error: "Sessione di verifica scaduta. Inserisci nuovamente la password." }, { status: 401 });

  const { code } = await request.json().catch(() => ({ code: "" }));
  if (typeof code !== "string") return NextResponse.json({ error: "Codice non valido." }, { status: 400 });
  const security = await prisma.superAdminSecurity.findUnique({ where: { id: "default" } });
  if (!security?.twoFactorEnabledAt || !security.totpSecretEncrypted) return NextResponse.json({ error: "Authenticator non configurato." }, { status: 400 });

  const recoveryHash = hashRecoveryCode(code);
  const isRecoveryCode = security.recoveryCodeHashes.includes(recoveryHash);
  const isTotp = verifyTotpCode(decryptTotpSecret(security.totpSecretEncrypted), code);
  if (!isRecoveryCode && !isTotp) return NextResponse.json({ error: "Codice Authenticator o di recupero non valido." }, { status: 401 });
  if (isRecoveryCode) await prisma.superAdminSecurity.update({ where: { id: "default" }, data: { recoveryCodeHashes: security.recoveryCodeHashes.filter((hash) => hash !== recoveryHash) } });

  const response = NextResponse.json({ success: true, usedRecoveryCode: isRecoveryCode });
  response.cookies.set("superadmin_pending_2fa", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 0, path: "/" });
  response.cookies.set("superadmin_session", createSuperAdminSessionToken(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", maxAge: 8 * 60 * 60, path: "/" });
  return response;
}
