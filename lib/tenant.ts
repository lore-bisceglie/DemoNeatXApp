import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export function getTenantFromRequest(req?: Request): Promise<{ tenant: any; slug: string } | null> {
  return (async () => {
    // 1. Try from query param (explicit)
    const url = new URL((await headers()).get("x-request-url") || "");
    const slugFromQuery = url.searchParams.get("tenantSlug") || url.searchParams.get("tenantSlug");
    
    // 2. Try from Host header (subdomain)
    const host = (await headers()).get("host") || "";
    const slugFromHost = host.split(".")[0];
    
    // 3. Try from Referer header
    const referer = (await headers()).get("referer") || "";
    const refererSlug = referer ? new URL(referer).hostname.split(".")[0] : null;
    
    const slug = slugFromQuery || slugFromHost || refererSlug;
    
    if (!slug || slug === "www" || slug === "neatx") return null;
    
    const tenant = await prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) return null;
    
    return { tenant, slug };
  })();
}

export async function getTenantFromHeaders(): Promise<{ tenant: any; slug: string } | null> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const slug = host.split(".")[0];
  
  if (!slug || slug === "www" || slug === "neatx") return null;
  
  const tenant = await prisma.tenant.findUnique({ where: { slug } });
  if (!tenant) return null;
  
  return { tenant, slug };
}

export function getTenantSlugFromRequest(req: Request): string | null {
  const url = new URL(req.url);
  const slugFromQuery = url.searchParams.get("tenantSlug");
  
  if (slugFromQuery && slugFromQuery !== "www" && slugFromQuery !== "neatx") {
    return slugFromQuery;
  }
  
  // Try from Host header
  const host = req.headers.get("host") || "";
  const slugFromHost = host.split(".")[0];
  
  if (slugFromHost && slugFromHost !== "www" && slugFromHost !== "neatx") {
    return slugFromHost;
  }
  
  return null;
}