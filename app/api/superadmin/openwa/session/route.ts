import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type OpenWaSession = {
  id?: string;
  sessionId?: string;
  name?: string;
  status?: string;
  engineLoaded?: boolean;
  error?: string;
  message?: string;
};

function normalizeSessions(payload: unknown) {
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
  const values = Array.isArray(payload)
    ? payload
    : [record?.sessions, record?.data, record?.items].find(Array.isArray) || [];

  return values
    .filter((value): value is OpenWaSession => Boolean(value) && typeof value === "object")
    .map((session) => ({
      id: String(session.id || session.sessionId || session.name || "sessione senza nome"),
      status: typeof session.status === "string" ? session.status : "sconosciuto",
      ready: session.status === "ready" && session.engineLoaded !== false,
    }));
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
    const [sessionResponse, sessionsResponse] = await Promise.all([
      fetch(`${baseUrl}/api/sessions/${sessionId}`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }),
      fetch(`${baseUrl}/api/sessions`, {
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }),
    ]);
    const session = await sessionResponse.json().catch(() => ({})) as OpenWaSession;
    const sessions = sessionsResponse.ok
      ? normalizeSessions(await sessionsResponse.json().catch(() => null))
      : [];

    if (!sessionResponse.ok) {
      return NextResponse.json(
        { error: session.error || session.message || "Impossibile leggere lo stato di OpenWA." },
        { status: 502 },
      );
    }

    const ready = session.status === "ready" && session.engineLoaded !== false;
    if (ready) {
      return NextResponse.json(
        { ready: true, status: session.status, configuredSessionId: sessionId, sessions },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      {
        ready: false,
        status: session.status || "non pronta",
        configuredSessionId: sessionId,
        sessions,
        error: "Non creare un nuovo dispositivo: prima individuiamo la sessione configurata.",
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
