const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.tenant.updateMany({
    where: { slug: 'beart' },
    data: { 
      isDemoData: false,
      trialStatus: 'published',
      publishedAt: new Date()
    }
  });
  console.log('Updated BeArt:', updated);
}

main().catch(console.error).finally(() => prisma.$disconnect());
