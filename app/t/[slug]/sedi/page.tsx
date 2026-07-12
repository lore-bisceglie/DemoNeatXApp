import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LocationsPageClient from "./LocationsPageClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { name: true, description: true, themeColor: true },
  });

  if (!tenant) return { title: "Sedi non trovate" };

  return {
    title: `Le nostre sedi - ${tenant.name}`,
    description: tenant.description || `Scopri le sedi di ${tenant.name}`,
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

  return <LocationsPageClient tenant={tenant as any} slug={slug} />;
}