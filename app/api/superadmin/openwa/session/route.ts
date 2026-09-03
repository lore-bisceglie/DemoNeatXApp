import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type OpenWaSession = {
  status?: string;
  engineLoaded?: boolean;
  error?: string;
  message?: string;
};

function dataUrlFromPayload(payload: unknown): string | null {
  if (typeof payload === "string") {
    return payload.startsWith("data:image/") ? payload : null;
  }

  if (!payload || typeof payload !== "object") return null;

  const record = payload as Record<string, unknown>;
  for (const key of ["qr", "qrCode", "dataUrl", "dataURL", "image"]) {
    const value = dataUrlFromPayload(record[key]);
    if (value) return value;
  }

  return null;
}

export async function GET(request: Request) {
  const auth = requireSuperAdmin(request);
  if (auth) return auth;

  const baseUrl = (process.env.OPENWA_BASE_URL || "").replace(/\/+$/, "");
  const apiKey = process.env.OPENWA_API_KEY || "";
  const sessionId = process.env.OPENWA_SESSION_ID || "";

  if (!baseUrl || !apiKey || !sessionId) {
    return NextResponse.json({ error: "OpenWA non è configurato." }, { status: 503 });
  }

  const headers = { "X-API-Key": apiKey };

  try {
    const sessionResponse = await fetch(`${baseUrl}/api/sessions/${sessionId}`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    const session = await sessionResponse.json().catch(() => ({})) as OpenWaSession;

    if (!sessionResponse.ok) {
      return NextResponse.json(
        { error: session.error || session.message || "Impossibile leggere lo stato di OpenWA." },
        { status: 502 },
      );
    }

    const ready = session.status === "ready" && session.engineLoaded !== false;
    if (ready) {
      return NextResponse.json(
        { ready: true, status: session.status },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    const qrResponse = await fetch(`${baseUrl}/api/sessions/${sessionId}/qr`, {
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    let qrDataUrl: string | null = null;
    const contentType = qrResponse.headers.get("content-type") || "";
    if (qrResponse.ok && contentType.startsWith("image/")) {
      const image = Buffer.from(await qrResponse.arrayBuffer()).toString("base64");
      qrDataUrl = `data:${contentType};base64,${image}`;
    } else if (qrResponse.ok) {
      qrDataUrl = dataUrlFromPayload(await qrResponse.json().catch(() => null));
    }

    return NextResponse.json(
      {
        ready: false,
        status: session.status || "non pronta",
        qrDataUrl,
        error: qrDataUrl ? undefined : "Il QR non è ancora disponibile. Attendi qualche secondo e aggiorna.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OpenWA non risponde." },
      { status: 502 },
    );
  }
}
