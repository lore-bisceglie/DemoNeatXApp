import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const slug = "green-beauty-fu73";
  const tenant = await prisma.tenant.findUnique({
    where: { slug }
  });

  console.log("Tenant IG:", tenant?.instagramUrl);
}

main().catch(console.error).finally(() => prisma.$disconnect());
