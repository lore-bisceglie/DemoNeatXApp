const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenantSlug = 'complici-wd73';
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug },
    include: { staff: true }
  });

  if (!tenant) {
    console.log("Tenant non trovato");
    return;
  }

  const newServices = [
    { name: "Colore", duration: 60, price: 40 },
    { name: "Decolorazione", duration: 90, price: 60 },
    { name: "Trattamento Anticaduta", duration: 30, price: 25 },
    { name: "Rasatura a Lametta", duration: 30, price: 15 },
    { name: "Tinta Barba", duration: 30, price: 20 },
    { name: "Meches / Colpi di sole", duration: 60, price: 50 },
    { name: "Taglio Bimbo", duration: 30, price: 15 },
    { name: "Permanente", duration: 90, price: 70 },
  ];

  console.log("Aggiungendo nuovi servizi...");

  for (const s of newServices) {
    const created = await prisma.service.create({
      data: {
        name: s.name,
        duration: s.duration,
        price: s.price,
        tenantId: tenant.id
      }
    });

    // Assegnamo questo servizio ad alcuni membri dello staff a caso per creare varietà
    // Mischiamo lo staff e prendiamo un sottoinsieme
    const shuffledStaff = [...tenant.staff].sort(() => 0.5 - Math.random());
    // Assegna il servizio a 3-5 membri dello staff a caso
    const numToAssign = Math.floor(Math.random() * 3) + 3; 
    const selectedStaff = shuffledStaff.slice(0, numToAssign);

    for (const staffMember of selectedStaff) {
      await prisma.staff.update({
        where: { id: staffMember.id },
        data: {
          services: {
            connect: { id: created.id }
          }
        }
      });
    }
    console.log(`- ${created.name} aggiunto e assegnato a ${numToAssign} professionisti.`);
  }

  // Assicuriamoci che i servizi originali ("Taglio Capelli", "Taglio e Barba") siano assegnati a tutti per sicurezza
  const existingServices = await prisma.service.findMany({
    where: { tenantId: tenant.id, name: { in: ["Taglio Capelli", "Taglio e Barba"] } }
  });

  for (const es of existingServices) {
    for (const staffMember of tenant.staff) {
      await prisma.staff.update({
        where: { id: staffMember.id },
        data: {
          services: {
            connect: { id: es.id }
          }
        }
      });
    }
  }
  
  console.log("Fatto! I servizi originali sono stati assegnati a tutti.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
