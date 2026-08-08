/**
 * Seed per il DB di TEST isolato (prisma/test.db).
 * Crea UN SOLO negozio di test fisso, completo e PUBBLICATO, così i test
 * automatici NON devono registrare negozi nuovi a ogni run (che creava
 * decine di negozi e innescava il rate limit).
 *
 * Il DB di test è isolato e viene resettato a ogni run dai test Playwright:
 * questo script ri-crea il negozio fisso dopo ogni reset.
 *
 * NOTA: questo script va eseguito SOLO sul DB di test (schema.test.prisma),
 * mai su produzione.
 */
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

const TEST_SLUG = "negozio-test";
const TEST_PASSWORD = "Password123!";

async function main() {
  console.log("[seed-test-shop] Creo il negozio di test fisso...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: TEST_SLUG },
    update: {},
    create: {
      slug: TEST_SLUG,
      name: "Negozio Test E2E",
      category: "barbiere",
      city: "Milano",
      ownerName: "Mario Test",
      ownerEmail: "test.e2e@example.com",
      ownerPasswordHash: hashPassword(TEST_PASSWORD),
      phone: "3331234567",
      address: "Via Roma 10, Milano",
      description: "Negozio di test per i test automatici E2E.",
      openTime: "09:00",
      closeTime: "19:00",
      breakStart: "13:00",
      breakEnd: "14:00",
      closedDays: "[]", // aperto tutti i giorni (i test girano in qualsiasi giorno)
      trialEndsAt: new Date(Date.now() + 30 * 86400000),
      trialStatus: "published",
      isDemoData: false,
      publishedAt: new Date(),
      plan: "pro",
      emailVerified: true,
      services: {
        create: [
          { name: "Taglio uomo", duration: 30, price: 25 },
          { name: "Barba", duration: 20, price: 15 },
          { name: "Taglio + barba", duration: 50, price: 35 },
        ],
      },
    },
  });

  // Sede principale attiva
  const mainLocation = await prisma.location.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: `${TEST_SLUG}-sede` } },
    update: {},
    create: {
      name: "Sede Centrale",
      slug: `${TEST_SLUG}-sede`,
      address: "Via Roma 10, Milano",
      city: "Milano",
      phone: "3331234567",
      isMain: true,
      isActive: true,
      openTime: "09:00",
      closeTime: "19:00",
      breakStart: "13:00",
      breakEnd: "14:00",
      closedDays: "[]", // aperto tutti i giorni (i test girano in qualsiasi giorno)
      tenantId: tenant.id,
    },
  });

  // Staff collegato ai servizi e alla sede
  const services = await prisma.service.findMany({ where: { tenantId: tenant.id } });
  const existingStaff = await prisma.staff.findFirst({ where: { tenantId: tenant.id } });
  if (!existingStaff) {
    await prisma.staff.create({
      data: {
        name: "Mario Test",
        tenantId: tenant.id,
        locationId: mainLocation.id,
        services: { connect: services.map((s) => ({ id: s.id })) },
      },
    });
  }

  // Collega i servizi alla sede (ServiceLocation) — richiesto dalla pagina pubblica
  for (const service of services) {
    await prisma.serviceLocation.upsert({
      where: {
        serviceId_locationId: { serviceId: service.id, locationId: mainLocation.id },
      },
      update: { price: service.price, isActive: true },
      create: {
        serviceId: service.id,
        locationId: mainLocation.id,
        price: service.price,
        isActive: true,
      },
    });
  }

  console.log(`[seed-test-shop] Negozio "${TEST_SLUG}" pronto.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
