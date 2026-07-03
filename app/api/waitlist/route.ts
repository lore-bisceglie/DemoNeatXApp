import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, phone, date, tenantId } = body;

    if (!name || !phone || !date) {
      return NextResponse.json(
        { error: "Dati mancanti." },
        { status: 400 }
      );
    }

    const item = await prisma.waitlist.create({
      data: {
        name,
        phone,
        date,
        tenantId: tenantId || null,
      },
    });

    return NextResponse.json({
      success: true,
      item,
    });
  } catch (error) {
    console.error("Errore waitlist POST:", error);

    return NextResponse.json(
      { error: "Errore durante il salvataggio in lista d'attesa." },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId");

    const waitlist = await prisma.waitlist.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      waitlist,
    });
  } catch (error) {
    console.error("Errore waitlist GET:", error);

    return NextResponse.json(
      { error: "Errore durante il recupero della lista d'attesa." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID mancante." },
        { status: 400 }
      );
    }

    await prisma.waitlist.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Errore waitlist DELETE:", error);

    return NextResponse.json(
      { error: "Errore durante la rimozione dalla lista d'attesa." },
      { status: 500 }
    );
  }
}