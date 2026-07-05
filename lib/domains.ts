export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store";
export const MARKETING_DOMAIN =
  process.env.NEXT_PUBLIC_MARKETING_DOMAIN || `www.${ROOT_DOMAIN}`;

export function getMarketingUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `https://${MARKETING_DOMAIN}${normalizedPath}`;
}

export function getTenantPublicUrl(slug: string) {
  return `https://${slug}.${ROOT_DOMAIN}`;
}

export function getTenantAdminUrl(slug: string) {
  return `${getTenantPublicUrl(slug)}/admin`;
}

export function isReservedSubdomain(value: string) {
  return ["www", "app", "api", "assets", "static", "cdn"].includes(value);
}
