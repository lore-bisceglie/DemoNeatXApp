import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: "green-beauty-fu73" }
  });
  console.log("Instagram:", tenant?.instagramUrl);
  console.log("Maps:", tenant?.mapsLink);
  console.log("Tiktok:", tenant?.tiktokUrl);
}
main().finally(() => prisma.$disconnect());
