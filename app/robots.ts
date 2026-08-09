import type { MetadataRoute } from "next";
import { MARKETING_DOMAIN } from "@/lib/domains";

export default function robots(): MetadataRoute.Robots {
  // Regole base per tutti i crawler
  const baseRules: MetadataRoute.Robots["rules"] = [
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
  ];

  // Dichiarazioni esplicite per i crawler delle AI (ChatGPT, Gemini, Claude, Perplexity)
  // -> garantiscono la massima accessibilità per la citazione nelle risposte AI.
  const aiCrawlers: MetadataRoute.Robots["rules"] = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-Web",
    "PerplexityBot",
    "Google-Extended",
  ].map((ua) => ({
    userAgent: ua,
    allow: "/",
  }));

  return {
    rules: [...aiCrawlers, ...baseRules],
    sitemap: `https://${MARKETING_DOMAIN}/sitemap.xml`,
  };
}
