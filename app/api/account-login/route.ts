import { NextResponse } from "next/server";
import { getTenantAdminUrl, ROOT_DOMAIN } from "@/lib/domains";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createTenantSessionToken } from "@/lib/auth";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cookieDomain(req: Request) {
  const hostname = new URL(req.url).hostname;
  if (process.env.NODE_ENV === "production" && hostname.endsWith(ROOT_DOMAIN)) {
    return `.${ROOT_DOMAIN}`;
  }
  return undefined;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = cleanText(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json({ error: "Inserisci email e password." }, { status: 400 });
    }

    const rate = await checkRequestRateLimit(req, "account-login", 20, 15 * 60, email);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Troppi tentativi. Riprova più tardi." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
      );
    }

    const tenants = await prisma.tenant.findMany({
      where: { ownerEmail: email },
      orderBy: { createdAt: "desc" },
    });

    // Lockout condiviso (anti-bruteforce): se un account con questa email è bloccato, rifiuta
    const now = new Date();
    const lockedTenant = tenants.find(
      (item) => item.lockoutUntil && item.lockoutUntil > now
    );
    if (lockedTenant) {
      const remainingMinutes = Math.ceil(
        (lockedTenant.lockoutUntil!.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        { error: `Troppi tentativi falliti. Sicurezza attivata: riprova tra ${remainingMinutes} minuti.` },
        { status: 429 }
      );
    }

    const tenant = tenants.find((item) => {
      if (!item.ownerPasswordHash) return false;
      return verifyPassword(password, item.ownerPasswordHash);
    });

    if (!tenant) {
      // Incrementa i tentativi falliti su tutti gli account con questa email
      if (tenants.length > 0) {
        await Promise.all(
          tenants.map(async (item) => {
            if (item.lockoutUntil && item.lockoutUntil <= now) {
              await prisma.tenant.update({
                where: { id: item.id },
                data: { failedLoginAttempts: 0, lockoutUntil: null },
              });
            }
            const failedTenant = await prisma.tenant.update({
              where: { id: item.id },
              data: {
                failedLoginAttempts: { increment: 1 },
              },
              select: { failedLoginAttempts: true },
            });
            if (failedTenant.failedLoginAttempts >= 5) {
              await prisma.tenant.update({
                where: { id: item.id },
                data: { lockoutUntil: new Date(Date.now() + 15 * 60000) },
              });
            }
          })
        );
      }
      return NextResponse.json({ error: "Email o password non valide." }, { status: 401 });
    }

    if (!tenant.emailVerified) {
      return NextResponse.json(
        {
          error: "Email non verificata. È richiesta la verifica dell'email prima di accedere alla dashboard. Controlla la tua casella di posta e clicca sul link di conferma.",
          needsVerification: true,
          email: tenant.ownerEmail,
          slug: tenant.slug,
        },
        { status: 403 }
      );
    }

    // Login riuscito: resetta i contatori
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { failedLoginAttempts: 0, lockoutUntil: null },
    });

    const response = NextResponse.json({
      success: true,
      slug: tenant.slug,
      adminUrl: getTenantAdminUrl(tenant.slug),
    });

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
    console.error("Errore account-login:", error);
    return NextResponse.json({ error: "Errore server." }, { status: 500 });
  }
}
