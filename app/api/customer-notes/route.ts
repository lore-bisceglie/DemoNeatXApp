import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = String(body.tenantId || "");
    const phone = String(body.phone || "").replace(/\D/g, "");
    const customerName = body.customerName ? String(body.customerName) : null;
    const note = body.note ? String(body.note) : "";
    const preference = body.preference ? String(body.preference) : null;

    if (!tenantId || !phone) {
      return NextResponse.json(
        { error: "Tenant o telefono mancante" },
        { status: 400 }
      );
    }

    const customerNote = await prisma.customerNote.upsert({
      where: {
        tenantId_phone: {
          tenantId,
          phone,
        },
      },
      create: {
        tenantId,
        phone,
        customerName,
        note,
        preference,
      },
      update: {
        customerName,
        note,
        preference,
      },
    });

    return NextResponse.json({ customerNote });
  } catch (error) {
    console.error("Errore salvataggio note cliente:", error);
    return NextResponse.json(
      { error: "Errore durante il salvataggio delle note" },
      { status: 500 }
    );
  }
}
