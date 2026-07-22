import { NextResponse } from "next/server";
import { ROOT_DOMAIN } from "@/lib/domains";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createTenantSessionToken } from "@/lib/auth";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";

function cookieDomain(req: Request) {
  const hostname = new URL(req.url).hostname;
  if (process.env.NODE_ENV === "production" && hostname.endsWith(ROOT_DOMAIN)) {
    return `.${ROOT_DOMAIN}`;
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const { slug, email, password } = await req.json();

    if (!slug || !password) {
      return NextResponse.json({ error: "Credenziali mancanti." }, { status: 400 });
    }

    const rate = await checkRequestRateLimit(req, "tenant-login", 20, 15 * 60, `${slug}:${email || ""}`);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Troppi tentativi. Riprova più tardi." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const tenant = await prisma.tenant.findUnique({ where: { slug } });

    if (!tenant) {
      return NextResponse.json({ error: "Account non trovato." }, { status: 404 });
    }

    // 1. Controllo Lockout (Anti-Bruteforce)
    const now = new Date();
    if (tenant.lockoutUntil && tenant.lockoutUntil > now) {
      const remainingMinutes = Math.ceil((tenant.lockoutUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Troppi tentativi falliti. Sicurezza attivata: riprova tra ${remainingMinutes} minuti.` },
        { status: 429 }
      );
    }

    const emailMatches = Boolean(
      tenant.ownerEmail &&
      email &&
      tenant.ownerEmail.toLowerCase() === String(email).trim().toLowerCase()
    );

    const passwordMatches = tenant.ownerPasswordHash
      ? verifyPassword(password, tenant.ownerPasswordHash)
      : false;

    // 2. Se credenziali sbagliate: incrementa errori e blocca
    if (!emailMatches || !passwordMatches) {
      if (tenant.lockoutUntil && tenant.lockoutUntil <= now) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { failedLoginAttempts: 0, lockoutUntil: null },
        });
      }
      const failedTenant = await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          failedLoginAttempts: { increment: 1 },
        },
        select: { failedLoginAttempts: true },
      });
      if (failedTenant.failedLoginAttempts >= 5) {
        await prisma.tenant.update({
          where: { id: tenant.id },
          data: { lockoutUntil: new Date(Date.now() + 15 * 60000) },
        });
      }

      // Segnala il tentativo sospetto nel registro attività del proprietario
      await prisma.activityLog.create({
        data: {
          tenantId: tenant.id,
          action: "SECURITY_ALERT",
          message: `⚠️ Tentativo di accesso fallito (password errata). IP o Bot bloccato.`,
          actor: "system",
        },
      });

      return NextResponse.json({ error: "Email o password non valide." }, { status: 401 });
    }

    if (!tenant.emailVerified) {
      return NextResponse.json(
        {
          error: "Email non verificata. Controlla la tua casella di posta.",
          needsVerification: true,
        },
        { status: 403 }
      );
    }

    // 3. Login VERO: resetta errori e fai entrare
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(`admin_auth_${tenant.slug}`, createTenantSessionToken(tenant.slug, undefined, tenant.sessionVersion), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      domain: cookieDomain(req),
    });

    return response;
  } catch (error) {
    console.error("Errore tenant-login:", error);
    return NextResponse.json({ error: "Errore server." }, { status: 500 });
  }
}
