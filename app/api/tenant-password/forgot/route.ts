import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/email-verification";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";
import { getTenantPublicUrl } from "@/lib/domains";

const GENERIC_MESSAGE = "Se i dati corrispondono a un account, riceverai un link per reimpostare la password.";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email) {
      return NextResponse.json({ error: "Inserisci l'email del proprietario." }, { status: 400 });
    }

    const rate = await checkRequestRateLimit(request, "password-forgot", 3, 60 * 60, `${slug}:${email}`);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Hai già richiesto tre email nell'ultima ora. Riprova più tardi." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const tenant = slug
      ? await prisma.tenant.findUnique({ where: { slug } })
      : await prisma.tenant.findFirst({
          where: { ownerEmail: { equals: email, mode: "insensitive" } },
          orderBy: { createdAt: "desc" },
        });
    if (!tenant || tenant.ownerEmail?.toLowerCase() !== email) {
      return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - 60 * 60 * 1000);
    const resetWindow = await prisma.tenant.updateMany({
      where: {
        id: tenant.id,
        OR: [
          { passwordResetRequestWindowAt: null },
          { passwordResetRequestWindowAt: { lte: cutoff } },
        ],
      },
      data: { passwordResetRequestCount: 1, passwordResetRequestWindowAt: now },
    });
    if (resetWindow.count === 0) {
      const claimed = await prisma.tenant.updateMany({
        where: {
          id: tenant.id,
          passwordResetRequestWindowAt: { gt: cutoff },
          passwordResetRequestCount: { lt: 3 },
        },
        data: { passwordResetRequestCount: { increment: 1 } },
      });
      if (claimed.count === 0) {
        return NextResponse.json(
          { error: "Hai già richiesto tre email nell'ultima ora. Riprova più tardi." },
          { status: 429 },
        );
      }
    }

    const previousToken = tenant.passwordResetTokenHash;
    const previousExpiry = tenant.passwordResetExpiresAt;
    const token = createPasswordResetToken();
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        passwordResetTokenHash: token.storedToken,
        passwordResetExpiresAt: token.expiresAt,
      },
    });

    const requestUrl = new URL(request.url);
    const isTenantHost =
      requestUrl.hostname === `${tenant.slug}.localhost` ||
      requestUrl.hostname.startsWith(`${tenant.slug}.`);
    const resetUrl = isTenantHost
      ? new URL("/reset-password", requestUrl.origin)
      : process.env.NODE_ENV === "production"
        ? new URL("/reset-password", getTenantPublicUrl(tenant.slug))
        : new URL(`/t/${tenant.slug}/reset-password`, requestUrl.origin);
    resetUrl.searchParams.set("token", token.rawToken);
    const sent = await sendPasswordResetEmail(email, tenant.ownerName || "", resetUrl.toString());
    if (!sent) {
      await prisma.tenant.updateMany({
        where: { id: tenant.id, passwordResetTokenHash: token.storedToken },
        data: { passwordResetTokenHash: previousToken, passwordResetExpiresAt: previousExpiry },
      });
      return NextResponse.json(
        { error: "Non è stato possibile inviare l'email. Riprova tra qualche minuto." },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Errore recupero password:", error);
    return NextResponse.json({ error: "Servizio temporaneamente non disponibile." }, { status: 500 });
  }
}
