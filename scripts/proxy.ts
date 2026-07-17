import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store";
const isProd = process.env.NODE_ENV === "production";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const url = request.nextUrl.clone();

  // Estrae sottodominio se siamo su tenant.neatx.store
  const isTenantSubdomain = isProd
    ? hostname.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store"}`) && !hostname.startsWith("www.")
    : hostname.includes(".localhost") || hostname.includes(".vercel.app");

  let tenantSlug = "";

  if (isTenantSubdomain) {
    if (isProd) {
      tenantSlug = hostname.replace(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store"}`, "");
    } else {
      tenantSlug = hostname.split(".")[0];
    }
  }

  const isApi = url.pathname.startsWith("/api/");
  const isAdmin = url.pathname.startsWith("/admin");
  const isRoot = url.pathname === "/";
  const isTenantPage = isAdmin || isRoot;
  const isCancel = url.pathname.startsWith("/cancel/");

  // Se siamo su subdomain tenant
  if (isTenantSubdomain && tenantSlug) {
    if (isApi) {
      // API: passa solo header, niente rewrite
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-middleware-tenant", tenantSlug);
      const authMatch = (request.headers.get("cookie") || "").match(new RegExp(`admin_auth_${tenantSlug}=([^;]+)`));
      if (authMatch) requestHeaders.set("x-middleware-auth", authMatch[1]);
      console.log(`[MIDDLEWARE] API subdomain tenantSlug=${tenantSlug}, path=${url.pathname}`);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }
    if (isTenantPage) {
      // Pagina tenant: rewrite su /t/<slug>/...
      url.pathname = `/t/${tenantSlug}${url.pathname === "/" ? "" : url.pathname}`;
      console.log(`[MIDDLEWARE] REWRITE tenantSlug=${tenantSlug}, from=${request.nextUrl.pathname}, to=${url.pathname}`);
      return NextResponse.rewrite(url);
    }
    // Altri path (cancel, ecc.): passa solo header
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-middleware-tenant", tenantSlug);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Fallback root domain: estrae tenant dal cookie admin_auth
  if (!tenantSlug && (isApi || isTenantPage)) {
    const adminCookieMatch = (request.headers.get("cookie") || "").match(/admin_auth_([^=]+)=/);
    if (adminCookieMatch) tenantSlug = adminCookieMatch[1];
  }

  if (tenantSlug && (isApi || isTenantPage)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-middleware-tenant", tenantSlug);
    const authMatch = (request.headers.get("cookie") || "").match(new RegExp(`admin_auth_${tenantSlug}=([^;]+)`));
    if (authMatch) requestHeaders.set("x-middleware-auth", authMatch[1]);
    console.log(`[MIDDLEWARE] root domain tenantSlug=${tenantSlug}, path=${url.pathname}`);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|_next/data|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.woff$|.*\\.woff2$).*)",
  ],
};