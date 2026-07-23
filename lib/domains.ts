export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store";
export const MARKETING_DOMAIN =
  process.env.NEXT_PUBLIC_MARKETING_DOMAIN || `www.${ROOT_DOMAIN}`;

export function getMarketingUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://${MARKETING_DOMAIN}${normalizedPath}`;
}

export function getTenantPublicUrl(slug: string) {
  if (process.env.NODE_ENV === "test" || process.env.MOCK_EMAIL === "true") {
    return `/t/${slug}`;
  }
  return `https://${slug}.${ROOT_DOMAIN}`;
}

export function getTenantAdminUrl(slug: string) {
  if (process.env.NODE_ENV === "test" || process.env.MOCK_EMAIL === "true") {
    return `/t/${slug}/admin`;
  }
  return `${getTenantPublicUrl(slug)}/admin`;
}

export function isReservedSubdomain(value: string) {
  if (typeof value !== "string") return false;
  const normalized = value.toLowerCase().trim();
  return ["www", "app", "api", "assets", "static", "cdn"].includes(normalized);
}

