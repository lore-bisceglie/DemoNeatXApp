import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getMarketingUrl, getTenantPublicUrl } from "@/lib/domains";
import { buildBusinessJsonLd, formatLocalTitle } from "@/lib/seo";
import type { BookingInitialData } from "@/components/tenant/types";
import JsonLd from "@/components/seo/JsonLd";
import { BookingClient } from "../../BookingClient";

interface Props {
  params: Promise<{ slug: string; locationSlug: string }>;
}

async function getTenantForLocation(slug: string) {
  return prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true, slug: true, name: true, category: true, city: true, description: true,
      phone: true, address: true, instagramUrl: true, tiktokUrl: true, mapsLink: true,
      bookingUrl: true, logoUrl: true, themeColor: true, openTime: true, closeTime: true,
      breakStart: true, breakEnd: true, closedDays: true, trialEndsAt: true, trialStatus: true,
      isDemoData: true, publishedAt: true, plan: true,
      services: {
        select: {
          id: true, name: true, duration: true, price: true,
          locations: { where: { isActive: true }, select: { locationId: true, price: true } },
        },
      },
      staff: {
        select: {
          id: true, name: true, locationId: true,
          services: { select: { id: true, name: true, duration: true, price: true } },
          locations: { select: { locationId: true } },
        },
      },
      locations: {
        where: { isActive: true },
        orderBy: { isMain: "desc" },
        select: {
          id: true, slug: true, name: true, address: true, phone: true, openTime: true,
          closeTime: true, breakStart: true, breakEnd: true, closedDays: true, mapsLink: true,
          isMain: true, isActive: true,
          settings: {
            select: {
              paymentStrategy: true, paymentFixedAmount: true, paymentPercentage: true,
              paymentMandatory: true, stripeAccountId: true,
            },
          },
        },
      },
      storeSettings: {
        select: {
          paymentStrategy: true, paymentFixedAmount: true, paymentPercentage: true,
          paymentMandatory: true, stripeOnboardingComplete: true,
        },
      },
    },
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locationSlug } = await params;
  const tenant = await getTenantForLocation(slug);
  const location = tenant?.locations.find((item) => item.slug === locationSlug);
  if (!tenant || !location) return { title: "Sede non trovata" };

  const canonical = getMarketingUrl(`/t/${slug}/sede/${locationSlug}`);
  const title = formatLocalTitle(tenant.name, tenant.category, tenant.city, location.name);
  const description = `Prenota il tuo appuntamento presso ${location.name} (${location.address || tenant.city || ""})`;
  const ogImageUrl = getMarketingUrl(`/api/og/tenant/${slug}`);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: title }],
    },
  };
}

export default async function SedeBookingPage({ params }: Props) {
  const { slug, locationSlug } = await params;
  const tenant = await getTenantForLocation(slug);
  const location = tenant?.locations.find((item) => item.slug === locationSlug);
  if (!tenant || !location) notFound();

  const now = new Date();
  const trialActive = Boolean(tenant.trialEndsAt && tenant.trialEndsAt > now);
  const hasPaidPlan = tenant.plan === "pro" || tenant.plan === "elite" || tenant.trialStatus === "converted";
  const trialExpired = Boolean(tenant.trialEndsAt && tenant.trialEndsAt <= now && !hasPaidPlan);
  const effectiveTrialStatus = tenant.trialStatus === "converted" ? "converted" : trialExpired ? "expired" : tenant.trialStatus;

  const initialData: BookingInitialData = {
    id: tenant.id,
    name: tenant.name,
    address: tenant.address,
    phone: tenant.phone,
    openTime: tenant.openTime,
    closeTime: tenant.closeTime,
    breakStart: tenant.breakStart,
    breakEnd: tenant.breakEnd,
    closedDays: tenant.closedDays,
    instagramUrl: tenant.instagramUrl,
    mapsLink: tenant.mapsLink,
    tiktokUrl: tenant.tiktokUrl,
    bookingUrl: tenant.bookingUrl,
    trialEndsAt: tenant.trialEndsAt?.toISOString() || "",
    isDemoData: tenant.isDemoData,
    trialExpired,
    trialStatus: effectiveTrialStatus,
    category: tenant.category || "",
    description: tenant.description,
    city: tenant.city,
    isPremium: tenant.plan === "pro" || tenant.plan === "elite" || trialActive,
    logoUrl: tenant.logoUrl,
    themeColor: tenant.themeColor,
    services: tenant.services.map((service) => ({ ...service, price: service.price })),
    staff: tenant.staff.map((member) => ({
      ...member,
      services: member.services.map((service) => ({ ...service, price: service.price })),
    })),
    locations: tenant.locations.map(({ slug: _locationSlug, settings, ...item }) => ({
      ...item,
      settings: settings ? {
        paymentStrategy: settings.paymentStrategy,
        paymentFixedAmount: settings.paymentFixedAmount,
        paymentPercentage: settings.paymentPercentage,
        paymentMandatory: settings.paymentMandatory,
        stripeConnected: Boolean(settings.stripeAccountId),
      } : null,
    })),
    storeSettings: tenant.storeSettings,
  };

  const jsonLd = buildBusinessJsonLd({
    name: tenant.name,
    category: tenant.category,
    city: tenant.city,
    description: tenant.description,
    phone: location.phone || tenant.phone,
    address: location.address || tenant.address,
    logoUrl: tenant.logoUrl,
    instagramUrl: tenant.instagramUrl,
    tiktokUrl: tenant.tiktokUrl,
    mapsLink: location.mapsLink || tenant.mapsLink,
    openTime: location.openTime || tenant.openTime,
    closeTime: location.closeTime || tenant.closeTime,
    breakStart: location.breakStart || tenant.breakStart,
    breakEnd: location.breakEnd || tenant.breakEnd,
    closedDays: location.closedDays || tenant.closedDays,
    url: getMarketingUrl(`/t/${slug}/sede/${locationSlug}`),
    locationName: location.name,
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <BookingClient slug={slug} initialData={initialData} initialLocationId={location.id} />
    </>
  );
}
