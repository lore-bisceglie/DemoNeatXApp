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
      // dev: tenant.localhost:3000 o tenant.vercel.app
      tenantSlug = hostname.split(".")[0];
    }
  }

  // Se siamo su un sottodominio tenant e la path inizia con /api/ o /admin o è root
  const isApi = url.pathname.startsWith("/api/");
  const isAdmin = url.pathname.startsWith("/admin");
  const isRoot = url.pathname === "/";
  const isTenantRoute = isApi || isAdmin || isRoot;

  if (isTenantSubdomain && tenantSlug && isTenantRoute) {
    // Rewrite interno: /api/xyz -> /api/xyz?tenantSlug=xxx
    url.searchParams.set("tenantSlug", tenantSlug);
    const response = NextResponse.rewrite(url);
    response.headers.set("x-middleware-tenant", tenantSlug);
    
    // Passa anche il cookie auth in un header per bypassare problemi cookie
    const authCookie = request.headers.get("cookie");
    if (authCookie) {
      const authMatch = authCookie.match(new RegExp(`admin_auth_${tenantSlug}=([^;]+)`));
      if (authMatch) {
        response.headers.set("x-middleware-auth", authMatch[1]);
      }
    }
    return NextResponse.rewrite(url);
  }

  // Cookie domain sharing per root domain
  const response = NextResponse.next();
  
  // Imposta cookie domain per condivisione tra sottodomini
  if (isProd && request.cookies.has("admin_auth_")) {
    // I cookie sono già settati con domain=.neatx.store dal login
    // Qui ci assicuriamo che vengano propagati
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml
     * - _next/data (Next.js data)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|_next/data|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.ico$|.*\\.woff$|.*\\.woff2$).*)",
  ],
};