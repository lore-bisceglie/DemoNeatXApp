import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store";
const isProd = process.env.NODE_ENV === "production";

export function middleware(request: NextRequest) {
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
  const isTenantRoute = isApi || isAdmin || url.pathname === "/";

  if (!tenantSlug && isTenantRoute) {
    const cookieHeader = request.headers.get("cookie") || "";
    const adminCookieMatch = cookieHeader.match(/admin_auth_([^=]+)=/);
    if (adminCookieMatch) {
      tenantSlug = adminCookieMatch[1];
    }
  }

  if (tenantSlug && isTenantRoute) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-middleware-tenant", tenantSlug);

    const cookieHeader = request.headers.get("cookie") || "";
    const authMatch = cookieHeader.match(new RegExp(`admin_auth_${tenantSlug}=([^;]+)`));
    if (authMatch) {
      requestHeaders.set("x-middleware-auth", authMatch[1]);
    }

    console.log(`[MIDDLEWARE] tenantSlug=${tenantSlug}, path=${url.pathname}, host=${request.headers.get("host")}`);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|_next/data|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.woff$|.*\\.woff2$).*)",
  ],
};