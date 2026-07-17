const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const tenantId = 'test_premium_124';
  const slug = 'premium-test-sedi-2';

  const tenant = await prisma.tenant.create({
    data: {
      id: tenantId, slug, name: 'Salone Premium Test', ownerEmail: 'premium2@test.com', phone: '393330000000',
      plan: 'elite', trialStatus: 'converted', isDemoData: true, adminPassword: 'admin',
    }
  });

  const loc1 = await prisma.location.create({
    data: { tenantId, name: 'Milano Centro', slug: slug + '-milano', address: 'Via Roma', city: 'Milano', phone: '021', isMain: true, isActive: true }
  });
  const loc2 = await prisma.location.create({
    data: { tenantId, name: 'Roma Eur', slug: slug + '-roma', address: 'Via Milano', city: 'Roma', phone: '061', isMain: false, isActive: true }
  });

  const service = await prisma.service.create({
    data: { tenantId, name: 'Taglio VIP', price: 50, duration: 30 }
  });

  await prisma.serviceLocation.create({ data: { serviceId: service.id, locationId: loc1.id, price: 50, isActive: true } });
  await prisma.serviceLocation.create({ data: { serviceId: service.id, locationId: loc2.id, price: 60, isActive: true } });

  const staff1 = await prisma.staff.create({ data: { tenantId, name: 'Marco (Milano)', services: { connect: [{ id: service.id }] } } });
  await prisma.staffLocation.create({ data: { staffId: staff1.id, locationId: loc1.id } });

  const staff2 = await prisma.staff.create({ data: { tenantId, name: 'Luigi (Roma)', services: { connect: [{ id: service.id }] } } });
  await prisma.staffLocation.create({ data: { staffId: staff2.id, locationId: loc2.id } });

  const staff3 = await prisma.staff.create({ data: { tenantId, name: 'Antonio (Entrambe)', services: { connect: [{ id: service.id }] } } });
  await prisma.staffLocation.create({ data: { staffId: staff3.id, locationId: loc1.id } });
  await prisma.staffLocation.create({ data: { staffId: staff3.id, locationId: loc2.id } });

  console.log('Test environment created: https://' + slug + '.neatx.store/admin?tab=agenda');
  console.log('Password: admin');
}
run().catch(console.error).finally(() => prisma.$disconnect());
