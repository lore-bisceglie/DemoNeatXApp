import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store";

export function proxy(request: NextRequest) {
  const hostname = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const url = request.nextUrl.clone();
  const isLocalTenant = hostname.endsWith(".localhost");
  const isProductionTenant =
    hostname.endsWith(`.${ROOT_DOMAIN}`) && hostname !== `www.${ROOT_DOMAIN}`;
  const isTenantSubdomain = isLocalTenant || isProductionTenant;

  let tenantSlug = "";
  if (isTenantSubdomain) {
    tenantSlug = isLocalTenant
      ? hostname.slice(0, -".localhost".length)
      : hostname.slice(0, -(ROOT_DOMAIN.length + 1));
  }

  const isApi = url.pathname.startsWith("/api/");
  const isTenantPage =
    url.pathname === "/" ||
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/reset-password");

  if (tenantSlug) {
    if (isApi) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-middleware-tenant", tenantSlug);
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    if (isTenantPage) {
      url.pathname = `/t/${tenantSlug}${url.pathname === "/" ? "" : url.pathname}`;
      return NextResponse.rewrite(url);
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-middleware-tenant", tenantSlug);
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|_next/data|.*\\.png$|.*\\.jpg$|.*\\.webp$|.*\\.svg$|.*\\.ico$|.*\\.woff$|.*\\.woff2$).*)",
  ],
};
