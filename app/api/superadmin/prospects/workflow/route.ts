import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

type Meta = { city?: string; website?: string; nextFollowUp?: string; notes?: string; outreachDraft?: string; followUpDraft?: string; workflowReadyAt?: string };
const parse = (value: string | null): Meta => { if (!value) return {}; try { return JSON.parse(value) as Meta; } catch { return { notes: value }; } };

/** Prepares a reviewable outreach queue; it never sends messages. */
export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;
  const body = await req.json().catch(() => ({}));
  const limit = Math.min(Math.max(Number(body?.limit) || 20, 1), 50);
  const leads = await prisma.lead.findMany({ where: { status: "new", phone: { not: null } }, orderBy: { updatedAt: "asc" }, take: limit });
  const now = new Date();
  const followUp = new Date(now); followUp.setDate(followUp.getDate() + 3);
  let prepared = 0;
  for (const lead of leads) {
    const meta = parse(lead.notes);
    if (meta.outreachDraft) continue;
    const place = meta.city ? ` a ${meta.city}` : "";
    const draft = `Ciao ${lead.name}, ti scrivo perché sto conoscendo alcuni saloni${place}. Ho creato NeatX, un’agenda online che raccoglie le prenotazioni e manda i promemoria ai clienti. Se ti va, ti mostro come funziona in due minuti: https://www.neatx.store/`;
    const follow = `Ciao ${lead.name}, riprendo il messaggio di qualche giorno fa. Se vuoi, posso farti vedere NeatX con un esempio concreto del tuo salone: https://www.neatx.store/`;
    await prisma.lead.update({ where: { id: lead.id }, data: { notes: JSON.stringify({ ...meta, outreachDraft: draft, followUpDraft: follow, nextFollowUp: followUp.toISOString(), workflowReadyAt: now.toISOString() }) } });
    prepared++;
  }
  return NextResponse.json({ prepared, skipped: leads.length - prepared, total: leads.length, followUpAt: followUp.toISOString() });
}
