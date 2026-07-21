export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from "next/headers";
import { isTenantAdminCookieValid } from "@/lib/auth";
import { buildMapsLink, normalizeInstagramUrl, normalizeOptionalUrl, normalizeTikTokUrl, normalizeWhatsappPhone } from "@/lib/contact";

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug },
      select: {
        id: true,
        slug: true,
        name: true,
        category: true,
        city: true,
        description: true,
        phone: true,
        address: true,
        instagramUrl: true,
        facebookUrl: true,
        tiktokUrl: true,
        websiteUrl: true,
        mapsLink: true,
        bookingUrl: true,
        logoUrl: true,
        themeColor: true,
        openTime: true,
        closeTime: true,
        breakStart: true,
        breakEnd: true,
        closedDays: true,
        trialEndsAt: true,
        trialStatus: true,
        isDemoData: true,
        plan: true,
        services: {
          select: {
            id: true,
            name: true,
            duration: true,
            price: true,
            locations: {
              where: { isActive: true },
              select: { locationId: true, price: true, isActive: true },
            },
          },
        },
        storeSettings: {
          select: {
            paymentStrategy: true,
            paymentFixedAmount: true,
            paymentPercentage: true,
            paymentMandatory: true,
            stripeOnboardingComplete: true,
          },
        },
        staff: {
          select: {
            id: true,
            name: true,
            locationId: true,
            services: { select: { id: true, name: true, duration: true, price: true } },
            locations: { select: { locationId: true } },
          },
        },
        locations: {
          where: { isActive: true },
          orderBy: { isMain: 'desc' },
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true,
            mapsLink: true,
            isMain: true,
            isActive: true,
            openTime: true,
            closeTime: true,
            breakStart: true,
            breakEnd: true,
            closedDays: true,
            settings: {
              select: {
                paymentStrategy: true,
                paymentFixedAmount: true,
                paymentPercentage: true,
                paymentMandatory: true,
              },
            },
          },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Nessun negozio trovato' }, { status: 404 });
    }

    const now = new Date();
    const trialActive = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) > now : false;
    const isPremium = (tenant.plan === 'pro' || tenant.plan === 'elite') || trialActive;
    const isTrialExpired = tenant.trialEndsAt && now > tenant.trialEndsAt;
    const effectiveTrialStatus = tenant.trialStatus === "converted"
      ? "converted"
      : isTrialExpired
        ? "expired"
        : tenant.trialStatus;

    if (isTrialExpired && !isPremium) {
      return NextResponse.json({ ...tenant, trialStatus: effectiveTrialStatus, trialExpired: true, isPremium });
    }

    return NextResponse.json({ ...tenant, trialStatus: effectiveTrialStatus, trialExpired: false, isPremium }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (_error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const tenant = await prisma.tenant.findUnique({ where: { slug } });

    if (!tenant) {
      return NextResponse.json({ error: "Negozio non trovato" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const authCookie = cookieStore.get(`admin_auth_${slug}`)?.value;

    if (!isTenantAdminCookieValid(authCookie, slug)) {
      return NextResponse.json({ error: "Accesso non autorizzato" }, { status: 401 });
    }

    const body = await req.json();
    const action = typeof body.action === "string" ? body.action : "update";

    if (action === "publish") {
      const updated = await prisma.tenant.update({
        where: { slug },
        data: {
          isDemoData: false,
          trialStatus: "published",
          publishedAt: tenant.publishedAt || new Date(),
        },
      });
      return NextResponse.json({ tenant: updated });
    }

    if (action === "convert") {
      return NextResponse.json(
        { error: "Il piano può essere attivato solo tramite pagamento verificato." },
        { status: 403 }
      );
    }

    const cleanString = (value: unknown, fallback?: string | null) =>
      typeof value === "string" ? value.trim() : fallback;
    const cleanUrl = (value: unknown, fallback?: string | null) =>
      typeof value === "string" ? normalizeOptionalUrl(value) : fallback;


    const cleanPhone = typeof body.phone === "string" ? normalizeWhatsappPhone(body.phone) : tenant.phone;
    const nextAddress = cleanString(body.address, tenant.address);

    const updated = await prisma.tenant.update({
      where: { slug },
      data: {
        name: cleanString(body.name, tenant.name) || tenant.name,
        city: cleanString(body.city, tenant.city),
        description: cleanString(body.description, tenant.description),
        phone: cleanPhone || null,
        address: nextAddress,
        instagramUrl: typeof body.instagramUrl === "string" ? normalizeInstagramUrl(body.instagramUrl) : tenant.instagramUrl,
        tiktokUrl: typeof body.tiktokUrl === "string" ? normalizeTikTokUrl(body.tiktokUrl) : tenant.tiktokUrl,
        websiteUrl: cleanUrl(body.websiteUrl, tenant.websiteUrl),
        mapsLink: typeof body.mapsLink === "string" && body.mapsLink.trim() !== "" && !/^https?:\/\//i.test(body.mapsLink.trim())
          ? buildMapsLink(body.mapsLink)
          : cleanUrl(body.mapsLink, tenant.mapsLink) || buildMapsLink(nextAddress),
        bookingUrl: cleanUrl(body.bookingUrl, tenant.bookingUrl),
        openTime: cleanString(body.openTime, tenant.openTime) || "09:00",
        closeTime: cleanString(body.closeTime, tenant.closeTime) || "19:00",
        breakStart: cleanString(body.breakStart, tenant.breakStart) || null,
        breakEnd: cleanString(body.breakEnd, tenant.breakEnd) || null,
        closedDays: Array.isArray(body.closedDays)
          ? JSON.stringify(body.closedDays.map(Number))
          : tenant.closedDays,
        trialStatus: tenant.trialStatus === "demo" ? "trial_active" : tenant.trialStatus,
      },
    });

    return NextResponse.json({ tenant: updated });
  } catch (error) {
    console.error("Errore aggiornamento tenant:", error);
    return NextResponse.json({ error: "Errore interno" }, { status: 500 });
  }
}
