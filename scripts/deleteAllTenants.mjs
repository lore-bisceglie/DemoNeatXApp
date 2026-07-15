import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const tenants = await prisma.tenant.findMany();
  for (const tenant of tenants) {
    console.log(`Deleting ${tenant.slug}...`);
    // Delete in reverse dependency order if cascade is not working
    await prisma.staffLocation.deleteMany({ where: { staff: { tenantId: tenant.id } } });
    await prisma.serviceLocation.deleteMany({ where: { service: { tenantId: tenant.id } } });
    await prisma.locationSettings.deleteMany({ where: { location: { tenantId: tenant.id } } });
    await prisma.appointment.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.blockedSlot.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.noShow.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.waitlist.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.customerNote.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.activityLog.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.storeSettings.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.staff.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.service.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.location.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.tenant.delete({ where: { id: tenant.id } });
  }
  console.log("All tenants deleted.");
}
run().catch(console.error).finally(() => prisma.$disconnect());
