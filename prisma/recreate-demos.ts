import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Ricreando i tenant demo...");

  const tenants = [
    { name: "Acconciature D'Amico", slug: "damico", template: "parrucchiere", isDemoData: false, isElite: true },
    { name: "Premium Test Sedi 1", slug: "premium-test-sedi-1", template: "barbiere", isDemoData: false, isElite: true },
    { name: "Premium Test Sedi 2", slug: "premium-test-sedi-2", template: "estetista", isDemoData: false, isElite: true },
    { name: "Studio Rossi Fisioterapia", slug: "studio-rossi", template: "medico", isDemoData: false, isElite: false },
    { name: "Nails Lounge Milano", slug: "nails-milano", template: "estetista", isDemoData: false, isElite: false },
    { name: "Barber Shop Elite", slug: "barber-elite", template: "barbiere", isDemoData: false, isElite: false },
    { name: "Demo NeatX Multi-Attivita", slug: "demo-neatx", template: "parrucchiere", isDemoData: true, isElite: false },
  ];

  for (const t of tenants) {
    const existing = await prisma.tenant.findUnique({ where: { slug: t.slug } });
    if (!existing) {
      await prisma.tenant.create({
        data: {
          name: t.name,
          slug: t.slug,
          template: t.template,
          adminPassword: "Password123!",
          ownerEmail: `admin@${t.slug}.com`,
          isDemoData: t.isDemoData,
          trialStatus: "trial_active",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 giorni
          // Add dummy logo url if needed
          logoUrl: null,
          themeColor: "cyan"
        }
      });
      console.log(`Creato tenant: ${t.name}`);
    }
  }

  const tenant2 = await prisma.tenant.findUnique({ where: { slug: "premium-test-sedi-2" }});
  if (tenant2) {
    await prisma.service.create({
      data: {
        name: "Pulizia Viso Profonda",
        duration: 60,
        price: 45,
        tenantId: tenant2.id
      }
    });
  }

  console.log("Fatto! Demo ripristinati.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
