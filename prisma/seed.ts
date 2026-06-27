import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("1. Preparo la demo multi-attivita...");

  const demoTenant = await prisma.tenant.upsert({
    where: { slug: "demo-neatx" },
    update: {
      name: "Demo NeatX Multi-Attivita",
    },
    create: {
      name: "Demo NeatX Multi-Attivita",
      slug: "demo-neatx",
    },
  });

  console.log("2. Inserisco servizi dimostrativi per settori diversi...");
  await prisma.service.deleteMany({
    where: {
      tenantId: demoTenant.id,
      appointments: { none: {} },
    },
  });

  const demoServices = [
    { name: "Barbiere - Taglio uomo", duration: 30, price: 15 },
    { name: "Parrucchiere - Piega", duration: 45, price: 28 },
    { name: "Beauty - Pulizia viso", duration: 45, price: 40 },
    { name: "Nails - Semipermanente", duration: 60, price: 35 },
    { name: "Massaggi - Relax total body", duration: 60, price: 55 },
    { name: "Tattoo - Consulenza progetto", duration: 30, price: 20 },
    { name: "Fisioterapia - Valutazione", duration: 45, price: 50 },
    { name: "Studio privato - Consulenza", duration: 30, price: 35 },
  ];

  for (const service of demoServices) {
    const existing = await prisma.service.findFirst({
      where: { tenantId: demoTenant.id, name: service.name },
    });

    if (existing) {
      await prisma.service.update({
        where: { id: existing.id },
        data: service,
      });
    } else {
      await prisma.service.create({
        data: {
          ...service,
          tenantId: demoTenant.id,
        },
      });
    }
  }

  console.log("\n=======================================================");
  console.log("Demo multi-attivita pronta.");
  console.log(`id: "${demoTenant.id}",`);
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
