import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("🧹 1. Pulisco il database dai vecchi dati corrotti...");
  await prisma.service.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.tenant.deleteMany();

  console.log("🏗️ 2. Creo il nuovo Centro Estetico da zero...");
  const nuovoNegozio = await prisma.tenant.create({
    data: {
      name: "Centro Estetico Demo",
      slug: "estetica-demo"
    }
  });

  console.log("✨ 3. Inserisco i servizi estetici...");
  await prisma.service.create({ data: { name: 'Ceretta Sopracciglia', duration: 15, price: 10, tenantId: nuovoNegozio.id } });
  await prisma.service.create({ data: { name: 'Manicure Semipermanente', duration: 30, price: 25, tenantId: nuovoNegozio.id } });
  await prisma.service.create({ data: { name: 'Pulizia Viso Profonda', duration: 45, price: 40, tenantId: nuovoNegozio.id } });
  await prisma.service.create({ data: { name: 'Massaggio Total Body', duration: 60, price: 60, tenantId: nuovoNegozio.id } });

  console.log("\n=======================================================");
  console.log("✅ FINITO! COPIA QUESTO NUOVO ID E INCOLLALO IN page.tsx:");
  console.log(`id: "${nuovoNegozio.id}",`);
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