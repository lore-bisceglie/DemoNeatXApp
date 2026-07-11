import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

async function requireTenantAdmin(request: NextRequest) {
  // Prova prima il parametro query (aggiunto dal middleware)
  let tenantSlug = request.nextUrl.searchParams.get("tenantSlug");
  
  // Fallback: leggi dall'header aggiunto dal middleware
  if (!tenantSlug) {
    tenantSlug = request.headers.get("x-middleware-tenant");
  }
  
  if (!tenantSlug) return null;
  
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) return null;

  // Prova prima il cookie
  const cookieStore = await cookies();
  let authCookie = cookieStore.get(`admin_auth_${tenant.slug}`)?.value;
  
  // Fallback: leggi dall'header aggiunto dal middleware
  if (!authCookie) {
    authCookie = request.headers.get("x-middleware-auth");
  }
  
  return authCookie === tenant.adminPassword ? tenant : null;
}

function cleanService(input: any) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const duration = Math.max(5, Math.min(480, Number(input?.duration) || 30));
  const price = Math.max(0, Number(input?.price) || 0);
  return { name, duration, price };
}

export async function GET(request: NextRequest) {
  const tenant = await requireTenantAdmin(request);
  if (!tenant) {
    return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
  }

  try {
    const services = await prisma.service.findMany({
      where: { tenantId: tenant.id },
      orderBy: [{ duration: "asc" }, { price: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    return NextResponse.json({ error: "Errore di connessione" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = await requireTenantAdmin(request);

    if (!tenant) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
    }

    const body = await request.json();
    const service = cleanService(body);
    if (!service.name) {
      return NextResponse.json({ error: "Nome servizio mancante" }, { status: 400 });
    }

    const created = await prisma.service.create({
      data: {
        ...service,
        tenantId: tenant.id,
      },
    });

    return NextResponse.json({ service: created });
  } catch (error) {
    console.error("Errore creazione servizio:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Servizio non trovato" }, { status: 404 });
    }

    const tenant = await requireTenantAdmin(request);
    if (!tenant || tenant.id !== existing.tenantId) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
    }

    const service = cleanService(await request.json());
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Servizio non trovato" }, { status: 404 });
    }

    const tenant = await requireTenantAdmin(request);
    if (!tenant || tenant.id !== existing.tenantId) {
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