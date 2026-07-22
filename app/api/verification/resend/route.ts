import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { createEmailVerificationToken } from "@/lib/email-verification";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";

const GENERIC_MESSAGE = "Se i dati corrispondono a un account non verificato, riceverai un nuovo link via email.";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!slug || !email) {
      return NextResponse.json({ error: "Inserisci l'email del proprietario." }, { status: 400 });
    }

    const rate = await checkRequestRateLimit(request, "verification-resend", 3, 60 * 60, `${slug}:${email}`);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Hai già richiesto tre email nell'ultima ora. Riprova più tardi." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant || tenant.emailVerified || tenant.ownerEmail?.toLowerCase() !== email) {
      return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - 60 * 60 * 1000);
    const resetWindow = await prisma.tenant.updateMany({
      where: {
        id: tenant.id,
        OR: [
          { emailVerifyRequestWindowAt: null },
          { emailVerifyRequestWindowAt: { lte: cutoff } },
        ],
      },
      data: { emailVerifyRequestCount: 1, emailVerifyRequestWindowAt: now },
    });
    if (resetWindow.count === 0) {
      const claimed = await prisma.tenant.updateMany({
        where: {
          id: tenant.id,
          emailVerifyRequestWindowAt: { gt: cutoff },
          emailVerifyRequestCount: { lt: 3 },
        },
        data: { emailVerifyRequestCount: { increment: 1 } },
      });
      if (claimed.count === 0) {
        return NextResponse.json(
          { error: "Hai già richiesto tre email nell'ultima ora. Riprova più tardi." },
          { status: 429 },
        );
      }
    }

    const previousToken = tenant.emailVerifyToken;
    const previousExpiry = tenant.emailVerifyExpiresAt;
    const token = createEmailVerificationToken();
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        emailVerifyToken: token.storedToken,
        emailVerifyExpiresAt: token.expiresAt,
      },
    });

    const verifyUrl = new URL("/api/verify-email", request.url);
    verifyUrl.searchParams.set("token", token.rawToken);
    verifyUrl.searchParams.set("slug", tenant.slug);
    const sent = await sendVerificationEmail(
      email,
      tenant.ownerName || "",
      verifyUrl.toString(),
      Boolean(tenant.referredByCode && !tenant.referralSignupBonusAt),
    );
    if (!sent) {
      await prisma.tenant.updateMany({
        where: { id: tenant.id, emailVerifyToken: token.storedToken },
        data: { emailVerifyToken: previousToken, emailVerifyExpiresAt: previousExpiry },
      });
      return NextResponse.json(
        { error: "Non è stato possibile inviare l'email. Riprova tra qualche minuto." },
        { status: 503 },
      );
    }

    return NextResponse.json({ success: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Errore reinvio verifica:", error);
    return NextResponse.json({ error: "Servizio temporaneamente non disponibile." }, { status: 500 });
  }
}
