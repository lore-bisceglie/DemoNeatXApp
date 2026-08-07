import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireTenantAdminOrDemo } from "@/lib/demo-access";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tenantId = searchParams.get("tenantId");
  const locationId = searchParams.get("locationId");
  const serviceId = searchParams.get("serviceId");

  if (!tenantId) {
    return NextResponse.json({ error: "tenantId mancante" }, { status: 400 });
  }
  const authError = await requireTenantAdminOrDemo(req, tenantId, "staff-read", 120);
  if (authError) return authError;

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
      // Keep the response compatible with databases that have not received the
      // optional Magic Link workflow columns yet.
      select: {
        id: true,
        name: true,
        tenantId: true,
        baseSchedule: true,
        shiftExceptions: true,
        commissionRate: true,
        locationId: true,
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

    const authError = await requireTenantAdminOrDemo(req, tenantId, "staff-create", 60);
    if (authError) return authError;

    // Piano check: verifica subito il piano del tenant
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { plan: true, trialEndsAt: true, trialStatus: true },
    });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant non trovato" }, { status: 404 });
    }
    const todayDate = new Date();
    const hasActivePaidPlan = tenant.plan === "pro" || tenant.plan === "elite";
    const hasActiveTrial = tenant.trialEndsAt && todayDate <= tenant.trialEndsAt;
    const isLocked = !hasActivePaidPlan && !hasActiveTrial && tenant.trialStatus !== "converted";
    if (isLocked) {
      return NextResponse.json(
        { error: "Il tuo abbonamento non è attivo. Ripassa al piano Pro o Elite per aggiungere collaboratori." },
        { status: 403 },
      );
    }

    const selectedLocations = Array.isArray(locationIds)
      ? locationIds
      : locationId
        ? [locationId]
        : [];
    const selectedServices = Array.isArray(serviceIds) ? serviceIds : [];

    const [validLocationCount, validServiceCount] = await Promise.all([
      prisma.location.count({ where: { tenantId, id: { in: selectedLocations } } }),
      prisma.service.count({ where: { tenantId, id: { in: selectedServices } } }),
    ]);
    if (
      validLocationCount !== new Set(selectedLocations).size ||
      validServiceCount !== new Set(selectedServices).size
    ) {
      return NextResponse.json({ error: "Sedi o servizi non validi" }, { status: 400 });
    }

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
      select: {
        id: true,
        name: true,
        tenantId: true,
        baseSchedule: true,
        shiftExceptions: true,
        commissionRate: true,
        locationId: true,
        services: true,
        locations: { select: { locationId: true } },
      },
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

    const existingStaff = await prisma.staff.findUnique({
      where: { id: staffId },
      select: { tenantId: true },
    });
    if (!existingStaff) {
      return NextResponse.json({ error: "Staff non trovato" }, { status: 404 });
    }
    const authError = await requireTenantAdminOrDemo(req, existingStaff.tenantId, "staff-update", 60);
    if (authError) return authError;

    const selectedLocations = Array.isArray(locationIds)
      ? locationIds
      : locationId
        ? [locationId]
        : [];
    const [validLocationCount, validServiceCount] = await Promise.all([
      prisma.location.count({
        where: { tenantId: existingStaff.tenantId, id: { in: selectedLocations } },
      }),
      prisma.service.count({
        where: { tenantId: existingStaff.tenantId, id: { in: serviceIds } },
      }),
    ]);
    if (
      validLocationCount !== new Set(selectedLocations).size ||
      validServiceCount !== new Set(serviceIds).size
    ) {
      return NextResponse.json({ error: "Sedi o servizi non validi" }, { status: 400 });
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
      select: {
        id: true,
        name: true,
        tenantId: true,
        baseSchedule: true,
        shiftExceptions: true,
        commissionRate: true,
        locationId: true,
        services: true,
        locations: { select: { locationId: true } },
      },
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

    const existingStaff = await prisma.staff.findUnique({
      where: { id },
      select: { tenantId: true },
    });
    if (!existingStaff) {
      return NextResponse.json({ error: "Staff non trovato" }, { status: 404 });
    }
    const authError = await requireTenantAdminOrDemo(req, existingStaff.tenantId, "staff-delete", 60);
    if (authError) return authError;

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
