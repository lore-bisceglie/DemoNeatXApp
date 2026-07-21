import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'veronica.grea@hotmail.it';
  const tenant = await prisma.tenant.findFirst({
    where: { ownerEmail: email }
  });
  console.log("Tenant data:", tenant);
}

main().finally(() => prisma.$disconnect());
