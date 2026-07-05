import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function requireTenantAdmin(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant?.adminPassword) return null;

  const cookieStore = await cookies();
  const authCookie = cookieStore.get(`admin_auth_${tenant.slug}`)?.value;
  return authCookie === tenant.adminPassword ? tenant : null;
}

function cleanService(input: any) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const duration = Math.max(5, Math.min(480, Number(input?.duration) || 30));
  const price = Math.max(0, Number(input?.price) || 0);
  return { name, duration, price };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenantId");

  if (!tenantId) {
    return NextResponse.json({ error: "ID mancante" }, { status: 400 });
  }

  try {
    const services = await prisma.service.findMany({
      where: { tenantId },
      orderBy: [{ duration: "asc" }, { price: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    return NextResponse.json({ error: "Errore di connessione" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = typeof body.tenantId === "string" ? body.tenantId : "";
    const tenant = await requireTenantAdmin(tenantId);

    if (!tenant) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
    }

    const service = cleanService(body);
    if (!service.name) {
      return NextResponse.json({ error: "Nome servizio mancante" }, { status: 400 });
    }

    const created = await prisma.service.create({
      data: {
        ...service,
        tenantId,
      },
    });

    return NextResponse.json({ service: created });
  } catch (error) {
    console.error("Errore creazione servizio:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Servizio non trovato" }, { status: 404 });
    }

    const tenant = await requireTenantAdmin(existing.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
    }

    const service = cleanService(body);
    if (!service.name) {
      return NextResponse.json({ error: "Nome servizio mancante" }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id },
      data: service,
    });

    return NextResponse.json({ service: updated });
  } catch (error) {
    console.error("Errore modifica servizio:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Servizio non trovato" }, { status: 404 });
    }

    const tenant = await requireTenantAdmin(existing.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
    }

    await prisma.appointment.updateMany({
      where: { serviceId: id },
      data: { serviceId: null },
    });

    await prisma.service.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Errore eliminazione servizio:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
