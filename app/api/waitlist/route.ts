import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";
import { checkRequestRateLimit } from "@/lib/request-rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, phone, date, tenantId } = body;

    if (!name || !phone || !date || !tenantId) {
      return NextResponse.json(
        { error: "Dati mancanti." },
        { status: 400 }
      );
    }

    const tenantExists = await prisma.tenant.count({ where: { id: tenantId } });
    if (!tenantExists || String(name).trim().length > 100 || String(phone).length > 30) {
      return NextResponse.json({ error: "Dati non validi." }, { status: 400 });
    }
    const rate = await checkRequestRateLimit(req, "waitlist", 20, 60 * 60, tenantId);
    if (!rate.success) {
      return NextResponse.json(
        { error: "Troppe richieste. Riprova più tardi." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
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

    if (!tenantId) {
      return NextResponse.json({ error: "Tenant ID mancante" }, { status: 400 });
    }
    const authError = await requireTenantAdminOrDemo(req, tenantId, "waitlist-read", 100);
    if (authError) return authError;

    const waitlist = await prisma.waitlist.findMany({
      where: { tenantId },
      orderBy: {
        createdAt: "asc",
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

    const item = await prisma.waitlist.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!item?.tenantId) {
      return NextResponse.json({ error: "Elemento non trovato." }, { status: 404 });
    }
    const authError = await requireTenantAdminOrDemo(req, item.tenantId, "waitlist-delete", 30);
    if (authError) return authError;

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
