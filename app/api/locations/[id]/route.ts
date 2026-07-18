import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { requireTenantAdmin } from '@/lib/auth';

async function getTenantId(slug?: string): Promise<{ id: string; plan: string } | null> {
  if (!slug) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, plan: true } });
  return tenant || null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || cookieStore.get('neatx_tenant_slug')?.value;
    const tenant = await getTenantId(slug);
    if (!tenant) return NextResponse.json({ error: 'Tenant non identificato' }, { status: 400 });
    const authError = await requireTenantAdmin(tenant.id);
    if (authError) return authError;

    const { id } = await params;

    const location = await prisma.location.findFirst({
      where: { id, tenantId: tenant.id },
      include: {
        settings: true,
        services: { include: { service: true } },
        staff: true,
        _count: { select: { appointments: true } },
      },
    });

    if (!location) {
      return NextResponse.json({ error: 'Sede non trovata' }, { status: 404 });
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error('Errore GET /api/locations/[id]:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || cookieStore.get('neatx_tenant_slug')?.value;
    const tenant = await getTenantId(slug);
    if (!tenant) return NextResponse.json({ error: 'Tenant non identificato' }, { status: 400 });
    const authError = await requireTenantAdmin(tenant.id);
    if (authError) return authError;

    const { id } = await params;
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

    const location = await prisma.location.findFirst({ where: { id, tenantId: tenant.id } });
    if (!location) return NextResponse.json({ error: 'Sede non trovata' }, { status: 404 });

    // Check Elite plan for multi-location (if activating another location)
    if (isActive === true && tenant.plan !== 'elite') {
      const otherActive = await prisma.location.count({ where: { tenantId: tenant.id, isActive: true, NOT: { id } } });
      if (otherActive > 0) {
        return NextResponse.json({ 
          error: 'Multi-sede disponibile solo per piano Elite',
          code: 'PLAN_UPGRADE_REQUIRED',
          requiredPlan: 'elite'
        }, { status: 403 });
      }
    }

    if (locationSlug && locationSlug !== location.slug) {
      const sanitizedSlug = locationSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (!sanitizedSlug) return NextResponse.json({ error: 'Slug non valido' }, { status: 400 });

      const existing = await prisma.location.findFirst({
        where: { tenantId: tenant.id, slug: sanitizedSlug, NOT: { id } },
      });
      if (existing) return NextResponse.json({ error: 'Slug già esistente' }, { status: 400 });
    }

    if (isMain && !location.isMain) {
      await prisma.location.updateMany({
        where: { tenantId: tenant.id, isMain: true },
        data: { isMain: false },
      });
    }

    const updated = await prisma.location.update({
      where: { id },
      data: {
        name: name ?? location.name,
        slug: locationSlug ? locationSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') : location.slug,
        address: address ?? location.address,
        city: city ?? location.city,
        phone: phone ?? location.phone,
        mapsLink: mapsLink ?? location.mapsLink,
        isMain: isMain ?? location.isMain,
        isActive: isActive ?? location.isActive,
        openTime: openTime ?? location.openTime,
        closeTime: closeTime ?? location.closeTime,
        breakStart: breakStart ?? location.breakStart,
        breakEnd: breakEnd ?? location.breakEnd,
        closedDays: closedDays !== undefined ? (closedDays ? JSON.stringify(closedDays) : null) : location.closedDays,
        staffSheetUrl: staffSheetUrl ?? location.staffSheetUrl,
      },
      include: { settings: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Errore PUT /api/locations/[id]:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || cookieStore.get('neatx_tenant_slug')?.value;
    const tenant = await getTenantId(slug);
    if (!tenant) return NextResponse.json({ error: 'Tenant non identificato' }, { status: 400 });
    const authError = await requireTenantAdmin(tenant.id);
    if (authError) return authError;

    const { id } = await params;

    const location = await prisma.location.findFirst({ where: { id, tenantId: tenant.id } });
    if (!location) return NextResponse.json({ error: 'Sede non trovata' }, { status: 404 });

    if (location.isMain) {
      return NextResponse.json({ error: 'Impossibile eliminare la sede principale' }, { status: 400 });
    }

    const appointmentCount = await prisma.appointment.count({ where: { locationId: id } });
    if (appointmentCount > 0) {
      await prisma.location.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ success: true, deactivated: true, message: 'Sede disattivata (ha appuntamenti storici)' });
    }

    await prisma.locationSettings.delete({ where: { locationId: id } });
    await prisma.serviceLocation.deleteMany({ where: { locationId: id } });
    await prisma.location.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Errore DELETE /api/locations/[id]:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
