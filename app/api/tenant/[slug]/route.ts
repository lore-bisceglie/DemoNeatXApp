export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from "next/headers";
import { buildMapsLink, normalizeInstagramUrl, normalizeOptionalUrl, normalizeTikTokUrl, normalizeWhatsappPhone } from "@/lib/contact";

export async function GET(req: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const tenant = await prisma.tenant.findUnique({
      where: { slug: slug },
      include: {
        services: true,
        storeSettings: true,
        staff: {
          include: { services: true }
        },
        locations: {
          where: { isActive: true },
          orderBy: { isMain: 'desc' },
        }
      }
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Nessun negozio trovato' }, { status: 404 });
    }

    const now = new Date();
    const trialActive = tenant.trialEndsAt ? new Date(tenant.trialEndsAt) > now : false;
    const isPremium = tenant.plan === 'premium' || trialActive;
    const isTrialExpired = tenant.trialEndsAt && now > tenant.trialEndsAt;
    const effectiveTrialStatus = tenant.trialStatus === "converted"
      ? "converted"
      : isTrialExpired
        ? "expired"
        : tenant.trialStatus;

    if (isTrialExpired && !isPremium) {
      return NextResponse.json({ ...tenant, trialStatus: effectiveTrialStatus, trialExpired: true, isPremium });
    }

    return NextResponse.json({ ...tenant, trialStatus: effectiveTrialStatus, trialExpired: false, isPremium });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const tenant = await prisma.tenant.findUnique({ where: { slug } });

    if (!tenant?.adminPassword) {
      return NextResponse.json({ error: "Negozio non trovato" }, { status: 404 });
    }

    const cookieStore = await cookies();
    const authCookie = cookieStore.get(`admin_auth_${slug}`)?.value;

    if (authCookie !== tenant.adminPassword) {
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
      const updated = await prisma.tenant.update({
        where: { slug },
        data: {
          isDemoData: false,
          trialStatus: "converted",
          plan: "premium",
          convertedAt: tenant.convertedAt || new Date(),
        },
      });
      return NextResponse.json({ tenant: updated });
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
        mapsLink: cleanUrl(body.mapsLink, tenant.mapsLink) || buildMapsLink(nextAddress),
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
