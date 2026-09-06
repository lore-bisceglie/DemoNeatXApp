import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export const maxDuration = 30;

export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;
  const apiKey = process.env.OPEN_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Collegamento OpenPlaces non ancora configurato." }, { status: 503 });
  try {
    const hubs = [
      [45.4642, 9.19], [45.0703, 7.6869], [44.4949, 11.3426], [43.7696, 11.2558],
      [41.9028, 12.4964], [40.8518, 14.2681], [38.1157, 13.3615], [39.2238, 9.1217],
    ];
    const queries = ["hairdresser", "beauty salon"];
    const responses = await Promise.all(hubs.flatMap(([lat, lon]) => queries.map((query) => {
      const url = new URL("https://api.openplacesapi.com/v1/places");
      url.searchParams.set("q", query);
      url.searchParams.set("lat", String(lat)); url.searchParams.set("lon", String(lon));
      url.searchParams.set("radius_mi", "50"); url.searchParams.set("limit", "20");
      return fetch(url, { headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
    })));
    if (responses.some((response) => !response.ok)) return NextResponse.json({ error: "OpenPlaces non è raggiungibile in questo momento." }, { status: 502 });
    const payloads = await Promise.all(responses.map((response) => response.json() as Promise<{ results?: Array<{ place_id?: string; name?: string; phone?: string; website?: string; address?: { locality?: string; formatted?: string }; lat?: number; lon?: number }> }>));
    const elements = payloads.flatMap((payload) => payload.results || []);
  let added = 0;
  const prospects = [];
  for (const element of elements) {
    const name = (element.name || "").trim();
    if (!name) continue;
    const city = element.address?.locality || "";
    const website = element.website || "";
    const existing = await prisma.lead.findFirst({ where: { name, source: "ricerca Italia" }, select: { id: true } });
    if (existing) continue;
    const lead = await prisma.lead.create({ data: { name, phone: element.phone || null, source: "ricerca Italia", status: "new", notes: JSON.stringify({ city, website, coordinates: [element.lat, element.lon], address: element.address?.formatted }) } });
    prospects.push({ ...lead, meta: { city, website } });
    added += 1;
  }
    return NextResponse.json({ added, prospects, source: "OpenPlaces" });
  } catch (error) {
    console.error("Prospect discovery error:", error);
    return NextResponse.json({ error: "La ricerca automatica è temporaneamente non raggiungibile. Riprova tra poco." }, { status: 502 });
  }
}
