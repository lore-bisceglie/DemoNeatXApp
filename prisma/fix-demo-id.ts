import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Correggendo l'ID della demo...");

  // Trova e cancella il tenant attuale se esiste
  await prisma.tenant.deleteMany({
    where: { slug: "demo-neatx" }
  });

  // Crealo con l'ID hardcoded richiesto
  await prisma.tenant.create({
    data: {
      id: "cmqtds1840000yyqbd23x1jdj",
      name: "Demo NeatX Multi-Attivita",
      slug: "demo-neatx",
      template: "parrucchiere",
      isDemoData: true,
      trialStatus: "trial_active",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      themeColor: "cyan"
    }
  });

  console.log("Fatto! ID ripristinato a cmqtds1840000yyqbd23x1jdj");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
