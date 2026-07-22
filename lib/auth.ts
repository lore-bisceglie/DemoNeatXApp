import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "neatx_auth";
export const LEGACY_AUTH_COOKIE_NAME = "neatx_mito_auth";
export const AUTH_COOKIE_VALUE = "true";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const AUTH_COOKIE_CLEAR_PATHS = ["/", "/dashboard", "/api", "/login"];

type CookieValue = {
  value?: string;
};

type CookieReader = {
  get?: (name: string) => CookieValue | undefined;
  getAll?: (name: string) => CookieValue[];
};

export function isAuthCookieValue(value: string | null | undefined) {
  return value === AUTH_COOKIE_VALUE;
}

export function hasValidAuthCookie(cookieStore: CookieReader) {
  for (const name of [AUTH_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME]) {
    const allCookies = cookieStore.getAll?.(name) || [];
    if (allCookies.some((cookie) => isAuthCookieValue(cookie.value))) {
      return true;
    }

    if (isAuthCookieValue(cookieStore.get?.(name)?.value)) {
      return true;
    }
  }

  return false;
}

export function hasValidAuthCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return false;
  }

  return cookieHeader
    .split(";")
    .some((cookie) => {
      const [name, ...valueParts] = cookie.trim().split("=");
      const value = valueParts.join("=");
      return (
        (name === AUTH_COOKIE_NAME || name === LEGACY_AUTH_COOKIE_NAME) &&
        isAuthCookieValue(value)
      );
    });
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
  };
}

export function getClearAuthCookieOptions() {
  return {
    ...getAuthCookieOptions(),
    maxAge: 0,
  };
}

export function clearAuthCookies(response: NextResponse) {
  for (const name of [AUTH_COOKIE_NAME, LEGACY_AUTH_COOKIE_NAME]) {
    for (const path of AUTH_COOKIE_CLEAR_PATHS) {
      response.cookies.set(name, "", {
        ...getClearAuthCookieOptions(),
        path,
      });
    }
  }
}

export function setAuthCookie(response: NextResponse) {
  clearAuthCookies(response);
  response.cookies.set(AUTH_COOKIE_NAME, AUTH_COOKIE_VALUE, getAuthCookieOptions());
}

export function unauthorizedResponse() {
  return NextResponse.json(
    {
      error: "Sessione scaduta. Accedi di nuovo.",
      code: "UNAUTHORIZED",
    },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export function loginRedirectUrl(requestUrl: string, nextPath = "/dashboard") {
  const url = new URL("/login", requestUrl);
  url.searchParams.set("next", nextPath);
  url.searchParams.set("reason", "session");
  return url;
}

// ── Superadmin auth ──────────────────────────────────

export function requireSuperAdmin(req: Request) {
  const sessionCookie = (req.headers.get("cookie") || "")
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("superadmin_session="))
    ?.slice("superadmin_session=".length);
  if (verifySuperAdminSessionToken(sessionCookie)) return null;

  const pwd = req.headers.get("x-admin-password");
  const expected = process.env.SUPERADMIN_PASSWORD;
  if (!expected || !pwd || !safeEqual(pwd, expected)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return null;
}

// ── Tenant Admin auth (IDOR protection) ────────────────

const SESSION_SECRET = (() => {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;

  if (process.env.NODE_ENV === "production") {
    console.error("[NeatX] ATTENZIONE: SESSION_SECRET non configurato. Imposta una variabile d'ambiente SESSION_SECRET dedicata per la sicurezza delle sessioni.");
  }

  const existingSecretMaterial = [
    process.env.SUPERADMIN_PASSWORD,
    process.env.CRON_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET,
  ].filter((value): value is string => Boolean(value));

  if (existingSecretMaterial.length > 0) {
    console.warn("[NeatX] SESSION_SECRET derivato da altri secret. Imposta SESSION_SECRET come variabile d'ambiente dedicata per maggiore sicurezza.");
    return createHash("sha256")
      .update(`neatx-session-v1\0${existingSecretMaterial.join("\0")}`)
      .digest("hex");
  }

  if (process.env.NODE_ENV !== "production") {
    console.warn("[NeatX] SESSION_SECRET non configurato, uso secret di sviluppo locale INSICURO. Imposta SESSION_SECRET in sviluppo.");
    return "neatx-local-development-only";
  }

  throw new Error("[NeatX] SESSION_SECRET non configurato. Imposta la variabile d'ambiente SESSION_SECRET in produzione.");
})();
export const TENANT_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function createSuperAdminSessionToken(maxAgeSeconds = 8 * 60 * 60) {
  if (!SESSION_SECRET) throw new Error("SESSION_SECRET non configurato");
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `superadmin.${expires}`;
  const signature = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `v1.${payload}.${signature}`;
}

export function verifySuperAdminSessionToken(token: string | null | undefined) {
  if (!token || !SESSION_SECRET) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1" || parts[1] !== "superadmin") return false;
  const expires = Number(parts[2]);
  if (!Number.isFinite(expires) || expires <= Date.now()) return false;
  const expected = createHmac("sha256", SESSION_SECRET)
    .update(`superadmin.${parts[2]}`)
    .digest("hex");
  return safeEqual(parts[3], expected);
}

/**
 * Token di sessione firmato HMAC: `v2.{slug}.{sessionVersion}.{expiresMs}.{firma}`.
 * Sostituisce il vecchio cookie che conteneva la password in chiaro.
 */
export function createTenantSessionToken(
  slug: string,
  maxAgeSeconds = TENANT_SESSION_MAX_AGE,
  sessionVersion = 0,
) {
  if (!SESSION_SECRET) {
    throw new Error("SESSION_SECRET non configurato");
  }
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `${slug}.${sessionVersion}.${expires}`;
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `v2.${payload}.${sig}`;
}

export function verifyTenantSessionToken(
  token: string | null | undefined,
  slug: string,
  expectedSessionVersion = 0,
) {
  if (!token || !SESSION_SECRET) return false;
  const parts = token.split(".");
  if (parts[0] === "v1" && parts.length === 4) {
    if (expectedSessionVersion !== 0) return false;
    const [, tokenSlug, expiresStr, sig] = parts;
    if (tokenSlug !== slug) return false;
    const expires = Number(expiresStr);
    if (!Number.isFinite(expires) || Date.now() > expires) return false;
    const expected = createHmac("sha256", SESSION_SECRET)
      .update(`${tokenSlug}.${expiresStr}`)
      .digest("hex");
    return safeEqual(sig, expected);
  }
  if (parts[0] !== "v2" || parts.length !== 5) return false;
  const [, tokenSlug, versionStr, expiresStr, sig] = parts;
  const tokenVersion = Number(versionStr);
  if (tokenSlug !== slug || tokenVersion !== expectedSessionVersion) return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const expected = createHmac("sha256", SESSION_SECRET)
    .update(`${tokenSlug}.${versionStr}.${expiresStr}`)
    .digest("hex");
  return safeEqual(sig, expected);
}

/**
 * Verifica il cookie admin del tenant: accetta esclusivamente token firmati.
 */
export function isTenantAdminCookieValid(
  cookieValue: string | null | undefined,
  slug: string,
  sessionVersion = 0,
) {
  if (!cookieValue) return false;
  return verifyTenantSessionToken(cookieValue, slug, sessionVersion);
}

export async function requireTenantAdmin(tenantId: string | null | undefined) {
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID mancante" }, { status: 400 });
  }
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, sessionVersion: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant non trovato" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth_" + tenant.slug)?.value;

  if (!isTenantAdminCookieValid(authCookie, tenant.slug, tenant.sessionVersion)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  return null; // Authorized
}

export async function requireTenantAdminBySlug(slug: string | null | undefined) {
  if (!slug) {
    return NextResponse.json({ error: "Tenant non identificato" }, { status: 400 });
  }

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { sessionVersion: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant non trovato" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const authCookie = cookieStore.get(`admin_auth_${slug}`)?.value;
  if (!isTenantAdminCookieValid(authCookie, slug, tenant.sessionVersion)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  return null;
}
