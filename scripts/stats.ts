import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getStats() {
  const tenants = await prisma.tenant.findMany({
    select: { name: true, category: true, city: true }
  });
  const appointments = await prisma.appointment.count();

  const totalTenants = tenants.length;
  console.log(JSON.stringify({
    totalTenants,
    totalAppointments: appointments,
    sampleTenants: tenants.slice(0, 3)
  }, null, 2));
}

getStats().catch(console.error).finally(() => prisma.$disconnect());
