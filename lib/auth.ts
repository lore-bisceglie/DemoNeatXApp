import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
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
  const pwd = req.headers.get("x-admin-password");
  const expected = process.env.SUPERADMIN_PASSWORD;
  if (!expected || !pwd || !safeEqual(pwd, expected)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return null;
}

// ── Tenant Admin auth (IDOR protection) ────────────────

const SESSION_SECRET =
  process.env.SESSION_SECRET || process.env.SUPERADMIN_PASSWORD || "";
export const TENANT_SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 giorni

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Token di sessione firmato HMAC: `v1.{slug}.{expiresMs}.{firma}`.
 * Sostituisce il vecchio cookie che conteneva la password in chiaro.
 */
export function createTenantSessionToken(
  slug: string,
  maxAgeSeconds = TENANT_SESSION_MAX_AGE
) {
  const expires = Date.now() + maxAgeSeconds * 1000;
  const payload = `${slug}.${expires}`;
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `v1.${payload}.${sig}`;
}

export function verifyTenantSessionToken(
  token: string | null | undefined,
  slug: string
) {
  if (!token || !SESSION_SECRET) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const [, tokenSlug, expiresStr, sig] = parts;
  if (tokenSlug !== slug) return false;
  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const expected = createHmac("sha256", SESSION_SECRET)
    .update(`${tokenSlug}.${expiresStr}`)
    .digest("hex");
  return safeEqual(sig, expected);
}

/**
 * Verifica il cookie admin del tenant: accetta il token firmato (nuovo)
 * o, in fallback legacy, la password admin (vecchi cookie ancora attivi).
 */
export function isTenantAdminCookieValid(
  cookieValue: string | null | undefined,
  slug: string,
  adminPassword: string | null | undefined
) {
  if (!cookieValue) return false;
  if (verifyTenantSessionToken(cookieValue, slug)) return true;
  // Legacy: cookie = password in chiaro (da rimuovere quando i vecchi cookie scadono)
  if (adminPassword && safeEqual(cookieValue, adminPassword)) return true;
  return false;
}

export async function requireTenantAdmin(tenantId: string | null | undefined) {
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant ID mancante" }, { status: 400 });
  }
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { slug: true, adminPassword: true },
  });
  if (!tenant) {
    return NextResponse.json({ error: "Tenant non trovato" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const authCookie = cookieStore.get("admin_auth_" + tenant.slug)?.value;

  if (!isTenantAdminCookieValid(authCookie, tenant.slug, tenant.adminPassword)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  return null; // Authorized
}
