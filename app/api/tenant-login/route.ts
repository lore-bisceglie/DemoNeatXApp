import { NextResponse } from "next/server";
import { ROOT_DOMAIN } from "@/lib/domains";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

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

    const tenant = await prisma.tenant.findUnique({ where: { slug } });

    if (!tenant?.adminPassword) {
      return NextResponse.json({ error: "Account non trovato." }, { status: 404 });
    }

    // 1. Controllo Lockout (Anti-Bruteforce)
    if (tenant.lockoutUntil && tenant.lockoutUntil > new Date()) {
      const remainingMinutes = Math.ceil((tenant.lockoutUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json(
        { error: `Troppi tentativi falliti. Sicurezza attivata: riprova tra ${remainingMinutes} minuti.` },
        { status: 429 }
      );
    }

    const emailMatches =
      !tenant.ownerEmail ||
      !email ||
      tenant.ownerEmail.toLowerCase() === String(email).trim().toLowerCase();

    const passwordMatches = tenant.ownerPasswordHash
      ? verifyPassword(password, tenant.ownerPasswordHash)
      : password === tenant.adminPassword;

    // 2. Se credenziali sbagliate: incrementa errori e blocca
    if (!emailMatches || !passwordMatches) {
      const newAttempts = tenant.failedLoginAttempts + 1;
      const willLock = newAttempts >= 5;
      const newLockout = willLock ? new Date(Date.now() + 15 * 60000) : null; // 15 min lock

      await prisma.tenant.update({
        where: { id: tenant.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockoutUntil: newLockout,
        },
      });

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

    // 3. Login VERO: resetta errori e fai entrare
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    const response = NextResponse.json({ success: true });
    response.cookies.set(`admin_auth_${tenant.slug}`, tenant.adminPassword, {
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
