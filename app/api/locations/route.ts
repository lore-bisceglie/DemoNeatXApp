import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const tenantSlug = slug || cookieStore.get('neatx_tenant_slug')?.value;
    if (!tenantSlug) {
      return NextResponse.json({ error: 'Tenant non identificato' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: { id: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    const locations = await prisma.location.findMany({
      where: { tenantId: tenant.id },
      include: {
        settings: true,
        staff: { select: { id: true } },
        staffLocations: { select: { staffId: true } },
        _count: {
          select: { services: true, appointments: true },
        },
      },
      orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
    });

    // Deduplica staff: locationId diretta + StaffLocation
    const enriched = locations.map((loc) => {
      const staffIds = new Set<string>();
      loc.staff.forEach((s: any) => staffIds.add(s.id));
      loc.staffLocations.forEach((sl: any) => staffIds.add(sl.staffId));
      return {
        id: loc.id,
        name: loc.name,
        slug: loc.slug,
        address: loc.address,
        city: loc.city,
        phone: loc.phone,
        mapsLink: loc.mapsLink,
        isMain: loc.isMain,
        isActive: loc.isActive,
        openTime: loc.openTime,
        closeTime: loc.closeTime,
        breakStart: loc.breakStart,
        breakEnd: loc.breakEnd,
        closedDays: loc.closedDays,
        staffSheetUrl: loc.staffSheetUrl,
        tenantId: loc.tenantId,
        settings: loc.settings,
        _count: {
          staff: staffIds.size,
          services: loc._count.services,
          appointments: loc._count.appointments,
        },
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Errore GET /api/locations:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || cookieStore.get('neatx_tenant_slug')?.value;

    if (!slug) {
      return NextResponse.json({ error: 'Tenant non identificato' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, plan: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant non trovato' }, { status: 404 });
    }

    // Check Elite plan for multi-location
    const locationCount = await prisma.location.count({ where: { tenantId: tenant.id } });
    if (locationCount > 0 && tenant.plan !== 'elite') {
      return NextResponse.json({ 
        error: 'Multi-sede disponibile solo per piano Elite',
        code: 'PLAN_UPGRADE_REQUIRED',
        requiredPlan: 'elite'
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      slug: locationSlug,
      address,
      city,
      phone,
      mapsLink,
      isMain,
      isActive,
      openTime,
      closeTime,
      breakStart,
      breakEnd,
      closedDays,
      staffSheetUrl,
    } = body;

    if (!name || !locationSlug) {
      return NextResponse.json({ error: 'Nome e slug sono obbligatori' }, { status: 400 });
    }

    const sanitizedSlug = locationSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!sanitizedSlug) {
      return NextResponse.json({ error: 'Slug non valido' }, { status: 400 });
    }

    const existing = await prisma.location.findUnique({
      where: { tenantId_slug: { tenantId: tenant.id, slug: sanitizedSlug } },
    });

    if (existing) {
      return NextResponse.json({ error: 'Slug già esistente per questo tenant' }, { status: 400 });
    }

    const isFirst = locationCount === 0;
    const shouldBeMain = isFirst || isMain;

    if (shouldBeMain) {
      await prisma.location.updateMany({
        where: { tenantId: tenant.id, isMain: true },
        data: { isMain: false },
      });
    }

    const location = await prisma.location.create({
      data: {
        name,
        slug: sanitizedSlug,
        address,
        city,
        phone,
        mapsLink,
        isMain: shouldBeMain,
        isActive: isActive ?? true,
        openTime,
        closeTime,
        breakStart,
        breakEnd,
        closedDays: closedDays ? JSON.stringify(closedDays) : null,
        staffSheetUrl,
        tenantId: tenant.id,
      },
    });

    await prisma.locationSettings.create({
      data: {
        locationId: location.id,
        smsCredits: 0,
        paymentStrategy: 'OFF',
        paymentFixedAmount: 5.0,
        paymentPercentage: 20,
        paymentMandatory: false,
      },
    });

    const services = await prisma.service.findMany({
      where: { tenantId: tenant.id },
      select: { id: true },
    });

    if (services.length > 0) {
      try {
        await prisma.serviceLocation.createMany({
          data: services.map((s) => ({
            serviceId: s.id,
            locationId: location.id,
            price: null,
            isActive: true,
          })),
        });
      } catch (e) {
        // Ignore duplicates
      }
    }

    // Collega staff esistente alla sede (solo se prima sede, via StaffLocation)
    if (isFirst) {
      const staffList = await prisma.staff.findMany({
        where: { tenantId: tenant.id, locationId: null, locations: { none: {} } },
        select: { id: true },
      });
      if (staffList.length > 0) {
        await prisma.staffLocation.createMany({
          data: staffList.map((s) => ({ staffId: s.id, locationId: location.id })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json(location, { status: 201 });
  } catch (error) {
    console.error('Errore POST /api/locations:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}