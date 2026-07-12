import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId mancante" }, { status: 400 });
  }

  try {
    const staff = await prisma.staff.findMany({
      where: { tenantId },
      include: {
        services: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(staff);
  } catch (error) {
    console.error("Errore recupero staff:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, tenantId } = await req.json();

    if (!name || !tenantId) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const newStaff = await prisma.staff.create({
      data: {
        name,
        tenantId,
      },
      include: {
        services: true,
      }
    });

    return NextResponse.json(newStaff);
  } catch (error) {
    console.error("Errore creazione staff:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { staffId, serviceIds } = await req.json();

    if (!staffId || !Array.isArray(serviceIds)) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data: {
        services: {
          set: serviceIds.map((id: string) => ({ id })),
        },
      },
      include: {
        services: true,
      }
    });

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("Errore aggiornamento servizi staff:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID mancante" }, { status: 400 });
    }

    // Per sicurezza, se l'operatore ha appuntamenti li scolleghiamo (staffId = null)
    await prisma.appointment.updateMany({
      where: { staffId: id },
      data: { staffId: null }
    });

    await prisma.staff.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione staff:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
