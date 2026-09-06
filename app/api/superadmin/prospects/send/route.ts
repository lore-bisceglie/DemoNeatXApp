import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";
import { sendOpenWaText } from "@/lib/openwa";

export async function POST(req: Request) {
  const auth = requireSuperAdmin(req);
  if (auth) return auth;
  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : "";
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 4000) : "";
  if (!id || !text) return NextResponse.json({ error: "Contatto o messaggio mancanti" }, { status: 400 });
  const lead = await prisma.lead.findUnique({ where: { id }, select: { id: true, phone: true } });
  if (!lead?.phone) return NextResponse.json({ error: "Questo contatto non ha un numero WhatsApp" }, { status: 400 });
  const result = await sendOpenWaText(lead.phone, text);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 502 });
  await prisma.lead.update({ where: { id }, data: { status: "contacted" } });
  return NextResponse.json({ success: true, messageId: result.messageId });
}
