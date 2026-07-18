import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";

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
    const authError = await requireTenantAdminOrDemo(request, tenantId, "customer-note", 30);
    if (authError) return authError;

    if (phone.length < 6 || phone.length > 20 || note.length > 2_000 || (preference?.length || 0) > 500) {
      return NextResponse.json({ error: "Dati non validi" }, { status: 400 });
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
