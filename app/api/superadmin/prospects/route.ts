import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

export type ProspectMeta = { city?: string; website?: string; nextFollowUp?: string; notes?: string; outreachDraft?: string; followUpDraft?: string; workflowReadyAt?: string };

function parseMeta(value: string | null): ProspectMeta {
  if (!value) return {};
  try { return JSON.parse(value) as ProspectMeta; } catch { return { notes: value }; }
}

export async function GET(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;
  const leads = await prisma.lead.findMany({ orderBy: { updatedAt: "desc" }, take: 200 });
  return NextResponse.json({ prospects: leads.map((lead) => ({ ...lead, meta: parseMeta(lead.notes) })) });
}

export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;
  const body = await req.json();
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 120) : "";
  if (!name) return NextResponse.json({ error: "Inserisci il nome del salone" }, { status: 400 });
  const meta: ProspectMeta = {
    city: typeof body?.city === "string" ? body.city.trim().slice(0, 100) : undefined,
    website: typeof body?.website === "string" ? body.website.trim().slice(0, 300) : undefined,
    nextFollowUp: typeof body?.nextFollowUp === "string" ? body.nextFollowUp : undefined,
    notes: typeof body?.notes === "string" ? body.notes.trim().slice(0, 1000) : undefined,
  };
  const lead = await prisma.lead.create({
    data: {
      name,
      email: typeof body?.email === "string" ? body.email.trim().slice(0, 254) : null,
      phone: typeof body?.phone === "string" ? body.phone.trim().slice(0, 30) : null,
      source: typeof body?.source === "string" && body.source.trim() ? body.source.trim().slice(0, 80) : "ricerca diretta",
      status: "new",
      notes: JSON.stringify(meta),
    },
  });
  return NextResponse.json({ prospect: { ...lead, meta } }, { status: 201 });
}

export async function PATCH(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;
  const body = await req.json();
  const id = typeof body?.id === "string" ? body.id : "";
  const status = typeof body?.status === "string" ? body.status : "";
  if (!id || !["new", "contacted", "interested", "demo", "converted", "lost"].includes(status)) {
    return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
  }
  const lead = await prisma.lead.update({ where: { id }, data: { status } });
  return NextResponse.json({ prospect: { ...lead, meta: parseMeta(lead.notes) } });
}
