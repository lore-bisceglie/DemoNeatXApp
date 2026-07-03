const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  for (const t of tenants) {
    if (t.name.toLowerCase().includes('complici') || t.slug.includes('complici')) {
      await prisma.tenant.update({
        where: { id: t.id },
        data: { plan: 'premium' }
      });
      console.log('Updated ' + t.name + ' to premium!');
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
