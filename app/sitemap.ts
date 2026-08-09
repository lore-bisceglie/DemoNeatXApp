import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";
import { ROOT_DOMAIN } from "@/lib/domains";

// La sitemap deve essere dinamica perché legge il DB dei negozi
export const dynamic = "force-dynamic";
export const revalidate = 3600; // rigenera ogni ora al massimo

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const marketingBase = `https://www.${ROOT_DOMAIN}`;

  // Pagine statiche di marketing
  const blogDir = path.join(process.cwd(), "content", "blog");
  const blogPages: MetadataRoute.Sitemap = fs.existsSync(blogDir)
    ? fs.readdirSync(blogDir)
        .filter((file) => file.endsWith(".md"))
        .map((file) => ({
          url: `${marketingBase}/blog/${file.replace(/\.md$/, "")}`,
          lastModified: fs.statSync(path.join(blogDir, file)).mtime,
          changeFrequency: "monthly" as const,
          priority: 0.7,
        }))
    : [];

  const marketingPages: MetadataRoute.Sitemap = [
    {
      url: `${marketingBase}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${marketingBase}/privacy`,
      lastModified: new Date("2026-07-18"),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: marketingBase,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${marketingBase}/registrazione`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${marketingBase}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${marketingBase}/termini`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    ...blogPages,
  ];

  // Pagine locali SEO (gestionale parrucchieri per città)
  const localCitySlugs = [
    "milano", "roma", "napoli", "torino", "palermo", "genova",
    "bologna", "firenze", "bari", "catania",
  ];
  const localPages: MetadataRoute.Sitemap = localCitySlugs.map((citta) => ({
    url: `${marketingBase}/gestionale-parrucchieri-${citta}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Pagine dei negozi pubblicati
  let shopPages: MetadataRoute.Sitemap = [];
  try {
    const publishedTenants = await prisma.tenant.findMany({
      where: {
        publishedAt: { not: null },
        isDemoData: false,
      },
      select: {
        slug: true,
        createdAt: true,
        publishedAt: true,
        locations: {
          where: { isActive: true },
          select: { slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    shopPages = publishedTenants.flatMap((tenant) => {
      const lastMod = tenant.publishedAt || tenant.createdAt || new Date();
      const baseSlug = tenant.slug;
      const subdomain = `https://${baseSlug}.${ROOT_DOMAIN}`;

      const entries: MetadataRoute.Sitemap = [
        {
          url: subdomain,
          lastModified: lastMod,
          changeFrequency: "weekly" as const,
          priority: 0.9,
        },
        {
          url: `${marketingBase}/t/${baseSlug}/sedi`,
          lastModified: lastMod,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        },
      ];

      for (const location of tenant.locations) {
        if (!location.slug) continue;
        entries.push({
          url: `${marketingBase}/t/${baseSlug}/sede/${location.slug}`,
          lastModified: lastMod,
          changeFrequency: "monthly" as const,
          priority: 0.6,
        });
      }

      return entries;
    });
  } catch (error) {
    // Se la sitemap fallisce, non bloccare la build: logga e restituisci solo le pagine marketing
    console.error("[sitemap] Impossibile leggere i tenant dal DB:", error);
  }

  return [...marketingPages, ...localPages, ...shopPages];
}
