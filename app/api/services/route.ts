import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

function getTenantSlugFromRequest(request: NextRequest): string | null {
  const fromQuery = request.nextUrl.searchParams.get("tenantSlug");
  if (fromQuery) return fromQuery;

  const fromHeader = request.headers.get("x-middleware-tenant");
  if (fromHeader) return fromHeader;

  const host = request.headers.get("host") || "";
  if (isProd) {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "neatx.store";
    if (host.endsWith(`.${rootDomain}`) && !host.startsWith("www.")) {
      return host.replace(`.${rootDomain}`, "");
    }
  } else {
    const slug = request.headers.get("host")?.split(".")[0] || "";
    if (slug && slug !== "www" && slug !== "neatx") return slug;
  }
  return null;
}

const isProd = process.env.NODE_ENV === "production";

async function requireTenantAdmin(request: NextRequest) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  let tenantSlug: string | null = getTenantSlugFromRequest(request);
  if (!tenantSlug) {
    for (const c of allCookies) {
      if (c.name.startsWith("admin_auth_")) {
        tenantSlug = c.name.replace("admin_auth_", "");
        break;
      }
    }
  }

  if (!tenantSlug) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant?.adminPassword) return null;

  const authCookie = cookieStore.get(`admin_auth_${tenant.slug}`)?.value;
  if (!authCookie) {
    const headerAuth = request.headers.get("x-middleware-auth");
    if (headerAuth) return headerAuth === tenant.adminPassword ? tenant : null;
    return null;
  }

  return authCookie === tenant.adminPassword ? tenant : null;
}

export async function GET(request: NextRequest) {
  const tenant = await requireTenantAdmin(request);
  if (!tenant) {
    return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get("locationId");

    const services = await prisma.service.findMany({
      where: { tenantId: tenant.id },
      include: {
        locations: locationId ? {
          where: { locationId },
          select: { price: true, isActive: true, locationId: true },
        } : {
          select: { price: true, isActive: true, locationId: true },
        },
      },
      orderBy: [{ duration: "asc" }, { price: "asc" }, { name: "asc" }],
    });

    // Se locationId specificato, aggiungi info per-sede
    const servicesWithLocation = services.map((s) => {
      const loc = s.locations.find((l) => !locationId || l.locationId === locationId);
      return {
        ...s,
        isActiveInLocation: loc?.isActive ?? true,
        priceInLocation: loc?.price ?? s.price,
      };
    });

    return NextResponse.json({ services: servicesWithLocation });
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

    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "JSON malformato" }, { status: 400 });
    }
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
  } catch (error: any) {
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

function cleanService(input: any) {
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const duration = Math.max(5, Math.min(480, Number(input?.duration) || 30));
  const price = Math.max(0, Number(input?.price) || 0);
  return { name, duration, price };
}