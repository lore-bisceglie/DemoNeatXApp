import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'veronica.grea@hotmail.it';
  const result = await prisma.tenant.updateMany({
    where: { ownerEmail: email },
    data: { 
        plan: "elite", 
        trialStatus: "converted", 
        trialEndsAt: null, 
        convertedAt: new Date() 
    }
  });
  console.log(`[SUCCESS] Aggiornati ${result.count} record per ${email}. Piano Elite attivato.`);
}

main().finally(async () => {
  await prisma.$disconnect();
});
