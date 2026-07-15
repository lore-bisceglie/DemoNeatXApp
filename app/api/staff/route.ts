import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const locationId = searchParams.get("locationId");
  const serviceId = searchParams.get("serviceId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId mancante" }, { status: 400 });
  }

  try {
    let where: any = { tenantId };

    // Filtra per locationId (considera StaffLocation + locationId legacy)
    if (locationId) {
      where.OR = [
        { locations: { some: { locationId } } },
        { AND: [{ locations: { none: {} } }, { locationId: null }] },
        { AND: [{ locations: { none: {} } }, { locationId }] },
      ];
    }

    // Se serviceId specificato, filtra staff che ha quel servizio
    if (serviceId) {
      where.services = { some: { id: serviceId } };
    }

    const staff = await prisma.staff.findMany({
      where,
      include: {
        services: true,
        locations: { select: { locationId: true } },
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
    const { name, tenantId, locationId, locationIds, serviceIds } = await req.json();

    if (!name || !tenantId) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const selectedLocations = locationIds || (locationId ? [locationId] : []);
    const selectedServices = Array.isArray(serviceIds) ? serviceIds : [];

    const newStaff = await prisma.staff.create({
      data: {
        name,
        tenantId,
        locationId: locationId || null,
        locations: selectedLocations.length > 0
          ? { create: selectedLocations.map((lid: string) => ({ locationId: lid })) }
          : undefined,
        services: selectedServices.length > 0
          ? { connect: selectedServices.map((sid: string) => ({ id: sid })) }
          : undefined,
      },
      include: {
        services: true,
        locations: { select: { locationId: true } },
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
    const { staffId, serviceIds, locationId, locationIds } = await req.json();

    if (!staffId || !Array.isArray(serviceIds)) {
      return NextResponse.json({ error: "Dati mancanti" }, { status: 400 });
    }

    const data: any = {
      services: {
        set: serviceIds.map((id: string) => ({ id })),
      },
    };

    if (locationId !== undefined) {
      data.locationId = locationId || null;
    }

    if (locationIds !== undefined) {
      const selectedLocations = Array.isArray(locationIds) ? locationIds : [];
      data.locations = {
        deleteMany: {},
        create: selectedLocations.map((lid: string) => ({ locationId: lid })),
      };
    }

    const updatedStaff = await prisma.staff.update({
      where: { id: staffId },
      data,
      include: {
        services: true,
        locations: { select: { locationId: true } },
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