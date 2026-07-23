import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { hashAccountToken } from "@/lib/email-verification";
import { sendPasswordChangedEmail } from "@/lib/email";
import { getTenantAdminUrl, ROOT_DOMAIN } from "@/lib/domains";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";

function cookieDomain(request: Request) {
  const hostname = new URL(request.url).hostname;
  return process.env.NODE_ENV === "production" && hostname.endsWith(ROOT_DOMAIN)
    ? `.${ROOT_DOMAIN}`
    : undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const slug = typeof body.slug === "string" ? body.slug.trim().toLowerCase() : "";
    const token = typeof body.token === "string" ? body.token : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
    if (!slug || !token || !password || !confirmPassword) {
      return NextResponse.json({ error: "Compila tutti i campi richiesti." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "La password deve avere almeno 8 caratteri." }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Le due password non coincidono." }, { status: 400 });
    }

    const rate = await checkRequestRateLimit(request, "password-reset", 10, 15 * 60, slug);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Troppi tentativi. Richiedi un nuovo link e riprova più tardi." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );
    }

    const storedToken = hashAccountToken(token);
    const tenant = await prisma.tenant.findFirst({
      where: {
        slug,
        passwordResetTokenHash: storedToken,
        passwordResetExpiresAt: { gt: new Date() },
      },
      select: { id: true, slug: true, ownerEmail: true, ownerName: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Il link non è valido o è scaduto. Richiedine uno nuovo." }, { status: 400 });
    }

    const changed = await prisma.tenant.updateMany({
      where: {
        id: tenant.id,
        passwordResetTokenHash: storedToken,
        passwordResetExpiresAt: { gt: new Date() },
      },
      data: {
        ownerPasswordHash: hashPassword(password),
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        sessionVersion: { increment: 1 },
      },
    });
    if (changed.count !== 1) {
      return NextResponse.json({ error: "Il link è già stato utilizzato. Richiedine uno nuovo." }, { status: 400 });
    }

    await prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        action: "PASSWORD_RESET",
        actor: "owner",
        message: "Password modificata: tutte le sessioni precedenti sono state invalidate.",
      },
    });
    if (tenant.ownerEmail) {
      await sendPasswordChangedEmail(
        tenant.ownerEmail,
        tenant.ownerName || "",
        getTenantAdminUrl(tenant.slug),
      ).catch((error) => console.error("[Email] Conferma cambio password non inviata:", error));
    }

    const response = NextResponse.json({ success: true, adminUrl: getTenantAdminUrl(tenant.slug) });
    response.cookies.set(`admin_auth_${tenant.slug}`, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      domain: cookieDomain(request),
    });
    return response;
  } catch (error) {
    console.error("Errore reset password:", error);
    return NextResponse.json({ error: "Servizio temporaneamente non disponibile." }, { status: 500 });
  }
}
