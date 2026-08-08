import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { getMarketingUrl, getTenantPublicUrl } from "@/lib/domains";
import { buildBusinessJsonLd, formatLocalTitle } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import LocationsPageClient from "./LocationsPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      name: true,
      description: true,
      themeColor: true,
      category: true,
      city: true,
      address: true,
      phone: true,
      mapsLink: true,
      logoUrl: true,
      openTime: true,
      closeTime: true,
      breakStart: true,
      breakEnd: true,
      closedDays: true,
      instagramUrl: true,
      tiktokUrl: true,
    },
  });

  if (!tenant) return { title: "Sedi non trovate" };

  const canonical = getMarketingUrl(`/t/${slug}/sedi`);
  const title = `${formatLocalTitle(tenant.name, tenant.category, tenant.city)} — Sedie`;
  const description = tenant.description || `Scopri le sedi di ${tenant.name}`;
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

export default async function LocationsPage({ params }: Props) {
  const { slug } = await params;

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: {
      locations: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          phone: true,
          mapsLink: true,
          isMain: true,
          openTime: true,
          closeTime: true,
          breakStart: true,
          breakEnd: true,
          closedDays: true,
          _count: { select: { staff: true, services: true, appointments: true } },
        },
        orderBy: [{ isMain: "desc" }, { name: "asc" }],
      },
    },
  });

  if (!tenant) notFound();

  const jsonLd = buildBusinessJsonLd({
    name: tenant.name,
    category: tenant.category,
    city: tenant.city,
    description: tenant.description,
    phone: tenant.phone,
    address: tenant.address,
    logoUrl: tenant.logoUrl,
    instagramUrl: tenant.instagramUrl,
    tiktokUrl: tenant.tiktokUrl,
    mapsLink: tenant.mapsLink,
    openTime: tenant.openTime,
    closeTime: tenant.closeTime,
    breakStart: tenant.breakStart,
    breakEnd: tenant.breakEnd,
    closedDays: tenant.closedDays,
    url: getTenantPublicUrl(tenant.slug),
  });

  return (
    <>
      <JsonLd data={jsonLd} />
      <LocationsPageClient tenant={tenant as any} slug={slug} />
    </>
  );
}