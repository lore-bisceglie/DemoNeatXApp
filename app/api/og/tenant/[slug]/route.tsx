import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ROOT_DOMAIN } from "@/lib/domains";

// NOTA: niente `runtime = "edge"` qui — Prisma non gira su Edge Runtime.
// Con il runtime Node di default, `ImageResponse` funziona comunque.

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: {
        name: true,
        category: true,
        city: true,
        logoUrl: true,
        themeColor: true,
        description: true,
      },
    });

    const name = tenant?.name || "NeatX";
    const city = tenant?.city || "";
    const category = tenant?.category || "";
    const accent = tenant?.themeColor === "emerald" ? "#10b981" : "#00b4ff";
    const tagline = tenant?.description
      ? tenant.description.slice(0, 70) + (tenant.description.length > 70 ? "…" : "")
      : `Prenota online su ${name}${city ? ` a ${city}` : ""}`;

    const baseUrl = `https://${ROOT_DOMAIN}`;

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #050814 0%, #0b1221 100%)",
            padding: "64px",
            flexDirection: "column",
            justifyContent: "space-between",
            fontFamily: "sans-serif",
          }}
        >
          {/* Topo: logo NeatX */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: "white", letterSpacing: -2 }}>
              Neat
            </span>
            <span style={{ fontSize: 44, fontWeight: 900, color: accent, letterSpacing: -2 }}>
              X
            </span>
          </div>

          {/* Centro: nome + categoria/città */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                fontSize: 26,
                fontWeight: 600,
                color: accent,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {category ? `${category}${city ? ` · ${city}` : ""}` : (city || "Prenotazioni online")}
            </div>
            <div style={{ display: "flex", fontSize: 76, fontWeight: 900, color: "white", letterSpacing: -2, maxWidth: 900 }}>
              {name}
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#94a3b8", maxWidth: 880, lineHeight: 1.4 }}>
              {tagline}
            </div>
          </div>

          {/* Footer */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span
              style={{
                display: "flex",
                width: 56,
                height: 56,
                borderRadius: 14,
                background: accent,
                alignItems: "center",
                justifyContent: "center",
                color: "#050814",
                fontSize: 28,
                fontWeight: 900,
              }}
            >
              ✓
            </span>
            <span style={{ display: "flex", fontSize: 26, color: "#cbd5e1", fontWeight: 600 }}>
              {city ? `Prenota il tuo appuntamento a ${city}` : "Prenota online — gratis e senza app"}
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error: any) {
    console.error("Errore generazione OG tenant:", error);
    return new Response(`Failed to generate the image`, { status: 500 });
  }
}
