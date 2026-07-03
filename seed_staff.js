const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: 'complici-wd73' },
    include: { services: true }
  });

  if (!tenant) {
    console.log('Tenant "complici-wd73" not found');
    return;
  }

  // Create 4 Uomo and 4 Donna staff members
  const staffNames = [
    { name: 'Marco (Uomo)', type: 'uomo' },
    { name: 'Luca (Uomo)', type: 'uomo' },
    { name: 'Alessandro (Uomo)', type: 'uomo' },
    { name: 'Davide (Uomo)', type: 'uomo' },
    { name: 'Giulia (Donna)', type: 'donna' },
    { name: 'Martina (Donna)', type: 'donna' },
    { name: 'Sofia (Donna)', type: 'donna' },
    { name: 'Chiara (Donna)', type: 'donna' }
  ];

  for (const s of staffNames) {
    // Determine which services this staff member can do based on name
    // (If the service name contains "Uomo" or "Donna", or give them all if generic)
    const canDoServices = tenant.services.filter(svc => {
      const lowerName = svc.name.toLowerCase();
      if (s.type === 'uomo') {
        return lowerName.includes('uomo') || !lowerName.includes('donna');
      } else {
        return lowerName.includes('donna') || !lowerName.includes('uomo');
      }
    });

    await prisma.staff.create({
      data: {
        name: s.name,
        tenantId: tenant.id,
        services: {
          connect: canDoServices.map(svc => ({ id: svc.id }))
        }
      }
    });
  }

  console.log('Seed Staff successful!');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
