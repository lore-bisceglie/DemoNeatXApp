import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { requireTenantAdmin } from '@/lib/auth';

async function getTenantId(slug?: string): Promise<string | null> {
  if (!slug) return null;
  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true } });
  return tenant?.id || null;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || cookieStore.get('neatx_tenant_slug')?.value;
    const tenantId = await getTenantId(slug);
    if (!tenantId) return NextResponse.json({ error: 'Tenant non identificato' }, { status: 400 });
    const authError = await requireTenantAdmin(tenantId);
    if (authError) return authError;

    const { id } = await params;

    const location = await prisma.location.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!location) return NextResponse.json({ error: 'Sede non trovata' }, { status: 404 });

    const settings = await prisma.locationSettings.findUnique({ where: { locationId: id } });
    if (!settings) return NextResponse.json({ error: 'Impostazioni non trovate' }, { status: 404 });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Errore GET /api/locations/[id]/settings:', error);
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
    const tenantId = await getTenantId(slug);
    if (!tenantId) return NextResponse.json({ error: 'Tenant non identificato' }, { status: 400 });
    const authError = await requireTenantAdmin(tenantId);
    if (authError) return authError;

    const { id } = await params;
    const body = await request.json();
    const {
      paymentStrategy,
      paymentFixedAmount,
      paymentPercentage,
      paymentMandatory,
    } = body;

    const location = await prisma.location.findFirst({ where: { id, tenantId }, select: { id: true } });
    if (!location) {
      return NextResponse.json({ error: 'Sede non trovata' }, { status: 404 });
    }

    const settings = await prisma.locationSettings.upsert({
      where: { locationId: id },
      create: {
        locationId: id,
        paymentStrategy: paymentStrategy ?? 'OFF',
        paymentFixedAmount: paymentFixedAmount ?? 5.0,
        paymentPercentage: paymentPercentage ?? 20,
        paymentMandatory: paymentMandatory ?? false,
      },
      update: {
        paymentStrategy: paymentStrategy ?? undefined,
        paymentFixedAmount: paymentFixedAmount ?? undefined,
        paymentPercentage: paymentPercentage ?? undefined,
        paymentMandatory: paymentMandatory ?? undefined,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Errore PUT /api/locations/[id]/settings:', error);
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}
