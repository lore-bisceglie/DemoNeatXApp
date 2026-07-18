import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
  if (!expected || pwd !== expected) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  return null;
}

// ── Tenant Admin auth (IDOR protection) ────────────────
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
  
  // TO DO (Phase 2): Replace plaintext password comparison with hashed session tokens
  if (authCookie !== tenant.adminPassword) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  return null; // Authorized
}
