import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isReservedSubdomain } from "./lib/domains";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store";

function getHostname(request: NextRequest) {
  return request.headers.get("host")?.split(":")[0].toLowerCase() || "";
}

function getTenantSlugFromHost(hostname: string) {
  if (!hostname.endsWith(`.${ROOT_DOMAIN}`)) return null;

  const subdomain = hostname.slice(0, -`.${ROOT_DOMAIN}`.length);
  if (!subdomain || subdomain.includes(".") || isReservedSubdomain(subdomain)) {
    return null;
  }

  return subdomain;
}

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = getHostname(request);
  const tenantSlug = getTenantSlugFromHost(hostname);

  if (hostname === ROOT_DOMAIN) {
    const redirectUrl = url.clone();
    redirectUrl.hostname = `www.${ROOT_DOMAIN}`;
    return NextResponse.redirect(redirectUrl);
  }

  if (hostname === `app.${ROOT_DOMAIN}` && url.pathname === "/") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (tenantSlug) {
    if (url.pathname === "/") {
      return NextResponse.rewrite(new URL(`/t/${tenantSlug}`, request.url));
    }

    if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
      const adminPath = url.pathname.replace(/^\/admin/, "");
      return NextResponse.rewrite(new URL(`/t/${tenantSlug}/admin${adminPath}`, request.url));
    }

    if (
      !url.pathname.startsWith("/t/") &&
      !url.pathname.startsWith("/paywall") &&
      !url.pathname.startsWith("/cancel") &&
      !url.pathname.startsWith("/login") &&
      !url.pathname.startsWith("/onboarding")
    ) {
      return NextResponse.rewrite(new URL(`/t/${tenantSlug}`, request.url));
    }
  }

  if (url.pathname === "/login") {
    const authCookie = request.cookies.get("neatx_auth");
    if (authCookie?.value === "true") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)"],
};
