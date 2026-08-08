import type { MetadataRoute } from "next";
import { MARKETING_DOMAIN } from "@/lib/domains";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api",
          "/api/*",
          "/success",
          "/success/*",
          "/reset-password",
          "/reset-password/*",
          "/paywall",
          "/paywall/*",
          "/onboarding",
          "/onboarding/*",
          "/superadmin",
          "/superadmin/*",
        ],
      },
    ],
    sitemap: `https://${MARKETING_DOMAIN}/sitemap.xml`,
  };
}
