import QRCode from "qrcode";
import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";
import { createTotpSecret, createTotpUri, createTwoFactorSetupToken } from "@/lib/superadmin-two-factor";

export async function POST(request: Request) {
  const auth = requireSuperAdmin(request);
  if (auth) return auth;

  const secret = createTotpSecret();
  const otpAuthUri = createTotpUri(secret);
  const qrCode = await QRCode.toDataURL(otpAuthUri, { errorCorrectionLevel: "M", margin: 1, width: 280 });
  const response = NextResponse.json({ qrCode, manualKey: secret });
  response.cookies.set("superadmin_pending_2fa_setup", createTwoFactorSetupToken(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 10 * 60,
    path: "/",
  });
  return response;
}
