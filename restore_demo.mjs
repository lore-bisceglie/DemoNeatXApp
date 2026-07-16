import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = 'cmqtds1840000yyqbd23x1jdj';
  
  // Create Tenant
  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: {},
    create: {
      id: tenantId,
      name: "Demo NeatX Multi-Attività",
      slug: "demo-vetrina",
      phone: "393480480942",
      address: "Agenda demo per barbieri, beauty, nails, massaggi, tattoo, studi e consulenze",
      category: "Altro",
      instagramUrl: "https://www.instagram.com/",
      plan: "elite"
    }
  });

  // Create one staff member
  const staff = await prisma.staff.upsert({
    where: { 
      // Upsert by a unique criteria. Actually staff has unique ID, let's just create if not exists
      id: 'demo_staff_1'
    },
    update: {},
    create: {
      id: 'demo_staff_1',
      tenantId: tenantId,
      name: "Staff Demo"
    }
  });

  // Services
  const servicesData = [
    { name: "Taglio Barbiere", duration: 30, price: 20 },
    { name: "Taglio + Barba", duration: 45, price: 35 },
    { name: "Trattamento Beauty Viso", duration: 60, price: 50 },
    { name: "Massaggio Relax", duration: 60, price: 60 },
    { name: "Ricostruzione Nails", duration: 90, price: 40 },
    { name: "Tattoo Medio (Acconto Demo)", duration: 120, price: 100 },
    { name: "Consulenza Studio privato", duration: 45, price: 80 },
    { name: "Seduta Fisioterapia", duration: 45, price: 60 }
  ];

  for (const s of servicesData) {
    await prisma.service.create({
      data: {
        tenantId: tenantId,
        name: s.name,
        duration: s.duration,
        price: s.price,
        staff: {
          connect: { id: staff.id }
        }
      }
    });
  }

  console.log("Demo tenant and services restored!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
