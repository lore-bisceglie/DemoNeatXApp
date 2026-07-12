import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SedeBookingClient from "./SedeBookingClient";

interface Props {
  params: Promise<{ slug: string; locationSlug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locationSlug } = await params;
  const location = await prisma.location.findFirst({
    where: { slug: locationSlug, tenant: { slug } },
    include: { tenant: { select: { name: true, slug: true } } },
  });

  if (!location) return { title: "Sede non trovata" };

  return {
    title: `Prenota da ${location.tenant.name} - ${location.name}`,
    description: `Prenota il tuo appuntamento presso ${location.name} (${location.address || location.city || ""})`,
  };
}

export default async function SedeBookingPage({ params }: Props) {
  const { slug, locationSlug } = await params;

  const location = await prisma.location.findFirst({
    where: { slug: locationSlug, tenant: { slug } },
    include: {
      tenant: {
        select: {
          id: true,
          slug: true,
          name: true,
          themeColor: true,
          logoUrl: true,
          description: true,
          phone: true,
          address: true,
        },
      },
      services: {
        where: { isActive: true },
        include: { service: true },
        orderBy: [{ service: { duration: "asc" } }, { service: { price: "asc" } }],
      },
      _count: { select: { staff: true, appointments: true } },
    },
  });

  if (!location) notFound();

  const staff = await prisma.staff.findMany({
    where: {
      tenantId: location.tenant.id,
      OR: [{ locationId: null }, { locationId: location.id }],
    },
    select: { id: true, name: true, services: { select: { id: true } } },
  });

  return (
    <SedeBookingClient
      tenant={location.tenant}
      location={location}
      services={location.services.map(ls => ({
        ...ls.service,
        priceInLocation: ls.price,
        isActiveInLocation: ls.isActive,
        staff: [],
      }))}
      staff={staff.map(s => ({ id: s.id, name: s.name, services: s.services.map(svc => svc.id) }))}
    />
  );
}