import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTenantPublicUrl } from "@/lib/domains";
import type { BookingInitialData } from "@/components/tenant/types";
import { BookingClient } from "./BookingClient";

export const dynamic = "force-dynamic";

const getPublicTenant = cache((slug: string) =>
  prisma.tenant.findUnique({
    where: { slug },
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
      tiktokUrl: true,
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
      publishedAt: true,
      plan: true,
      services: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
          locations: {
            where: { isActive: true },
            select: { locationId: true, price: true },
          },
        },
      },
      staff: {
        select: {
          id: true,
          name: true,
          locationId: true,
          services: {
            select: { id: true, name: true, duration: true, price: true },
          },
          locations: { select: { locationId: true } },
        },
      },
      locations: {
        where: { isActive: true },
        orderBy: { isMain: "desc" },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          openTime: true,
          closeTime: true,
          breakStart: true,
          breakEnd: true,
          closedDays: true,
          mapsLink: true,
          isMain: true,
          isActive: true,
          settings: {
            select: {
              paymentStrategy: true,
              paymentFixedAmount: true,
              paymentPercentage: true,
              paymentMandatory: true,
              stripeAccountId: true,
            },
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
    },
  })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getPublicTenant(slug);
  if (!tenant) return {};

  const description = tenant.description ||
    `Prenota online il tuo appuntamento da ${tenant.name}${tenant.city ? ` a ${tenant.city}` : ""}.`;
  const canonical = getTenantPublicUrl(tenant.slug);

  return {
    title: `Prenota da ${tenant.name}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `Prenota da ${tenant.name}`,
      description,
      url: canonical,
      type: "website",
      images: tenant.logoUrl ? [{ url: tenant.logoUrl, alt: tenant.name }] : undefined,
    },
  };
}

export default async function TenantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getPublicTenant(slug);
  if (!tenant) notFound();

  // SECURITY: Block bookings on unpublished salons
  const isPublished = Boolean(tenant.publishedAt);
  const isDemoOrTrial = tenant.isDemoData || tenant.trialStatus === "active";
  if (!isPublished && !isDemoOrTrial) {
    return (
      <div className="min-h-screen bg-[#050814] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🚧</div>
          <h1 className="text-2xl font-bold text-white mb-3">Sito in allestimento</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            La pagina di prenotazione di <span className="text-white font-semibold">{tenant.name}</span> non è ancora attiva.
            Contatta direttamente il salone per prenotare.
          </p>
          {tenant.phone && (
            <a href={`tel:${tenant.phone}`} className="mt-6 inline-flex items-center gap-2 bg-[#00b4ff] text-[#050814] font-bold px-6 py-3 rounded-xl hover:bg-cyan-400 transition-colors">
              📞 Chiama il salone
            </a>
          )}
        </div>
      </div>
    );
  }

  const now = new Date();
  const trialActive = Boolean(tenant.trialEndsAt && tenant.trialEndsAt > now);
  const hasPaidPlan = tenant.plan === "pro" || tenant.plan === "elite" || tenant.trialStatus === "converted";
  const trialExpired = Boolean(
    tenant.trialEndsAt && tenant.trialEndsAt <= now && !hasPaidPlan
  );
  const effectiveTrialStatus = tenant.trialStatus === "converted"
    ? "converted"
    : trialExpired
      ? "expired"
      : tenant.trialStatus;

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
    services: tenant.services.map((service) => ({
      ...service,
      price: service.price,
    })),
    staff: tenant.staff.map((member) => ({
      ...member,
      services: member.services.map((service) => ({
        ...service,
        price: service.price,
      })),
    })),
    locations: tenant.locations.map(({ settings, ...location }) => ({
      ...location,
      settings: settings
        ? {
            paymentStrategy: settings.paymentStrategy,
            paymentFixedAmount: settings.paymentFixedAmount,
            paymentPercentage: settings.paymentPercentage,
            paymentMandatory: settings.paymentMandatory,
            stripeConnected: Boolean(settings.stripeAccountId),
          }
        : null,
    })),
    storeSettings: tenant.storeSettings,
  };

  return <BookingClient slug={slug} initialData={initialData} />;
}
