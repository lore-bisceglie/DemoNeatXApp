import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = requireSuperAdmin(request);
  if (auth) return auth;

  const baseUrl = (process.env.OPENWA_BASE_URL || "").replace(/\/+$/, "");
  const apiKey = process.env.OPENWA_API_KEY || "";
  const sessionId = process.env.OPENWA_SESSION_ID || "";

  if (!baseUrl || !apiKey || !sessionId) {
    return NextResponse.json({ error: "OpenWA non è configurato." }, { status: 503 });
  }

  try {
    const response = await fetch(`${baseUrl}/api/sessions/${encodeURIComponent(sessionId)}/qr`, {
      headers: { "X-API-Key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const data = await response.json().catch(() => ({})) as { qrCode?: unknown; status?: unknown; error?: unknown; message?: unknown };
    if (!response.ok || typeof data.qrCode !== "string" || !data.qrCode) {
      return NextResponse.json(
        { error: String(data.error || data.message || `QR non disponibile (HTTP ${response.status})`), status: data.status },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { qrCode: data.qrCode, status: typeof data.status === "string" ? data.status : "qr_ready" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "QR OpenWA non disponibile." },
      { status: 502 },
    );
  }
}
