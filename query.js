const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const DEMO_TENANT_ID = "cmqtds1840000yyqbd23x1jdj";
  const apps = await prisma.appointment.findMany({
    where: { tenantId: DEMO_TENANT_ID },
    select: { date: true, time: true, customerName: true },
    orderBy: { date: "desc" },
    take: 20,
  });
  console.log(JSON.stringify(apps, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
