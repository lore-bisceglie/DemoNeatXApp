import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.findUnique({
    where: { id: 'cmqtds1840000yyqbd23x1jdj' },
    include: { services: true, staff: true }
  });
  console.log("Tenant:", tenant);
}
main().finally(() => prisma.$disconnect());
