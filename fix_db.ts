import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "green-beauty-fu73" }
  });
  
  if (tenant && tenant.mapsLink?.includes("Corso Carlo")) {
    const address = "Corso Carlo Testa, 40, 15012 Bistagno AL";
    const newMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { mapsLink: newMapsLink }
    });
    console.log("Fixed mapsLink");
  }
}

main().finally(() => prisma.$disconnect());
