import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Backfill: creazione Sede Principale per tenant senza sedi ===");

  const tenants = await prisma.tenant.findMany({
    include: { locations: { take: 1 } },
  });

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const tenant of tenants) {
    if (tenant.locations.length > 0) {
      skipped++;
      continue;
    }

    try {
      const location = await prisma.location.create({
        data: {
          name: "Sede Principale",
          slug: "principale",
          address: tenant.address,
          city: tenant.city,
          phone: tenant.phone,
          mapsLink: tenant.mapsLink,
          openTime: tenant.openTime,
          closeTime: tenant.closeTime,
          breakStart: tenant.breakStart,
          breakEnd: tenant.breakEnd,
          closedDays: tenant.closedDays,
          staffSheetUrl: tenant.staffSheetUrl,
          isMain: true,
          tenantId: tenant.id,
        },
      });

      await prisma.locationSettings.create({
        data: { locationId: location.id },
      });

      const services = await prisma.service.findMany({ where: { tenantId: tenant.id } });
      if (services.length > 0) {
        await prisma.serviceLocation.createMany({
          data: services.map((s) => ({
            serviceId: s.id,
            locationId: location.id,
            price: s.price,
          })),
        });
      }

      const staff = await prisma.staff.findMany({ where: { tenantId: tenant.id } });
      if (staff.length > 0) {
        await prisma.staff.updateMany({
          where: { tenantId: tenant.id },
          data: { locationId: location.id },
        });
      }

      const appointments = await prisma.appointment.findMany({ where: { tenantId: tenant.id } });
      if (appointments.length > 0) {
        await prisma.appointment.updateMany({
          where: { tenantId: tenant.id },
          data: { locationId: location.id },
        });
      }

      console.log(`  [OK] ${tenant.name} -> Sede Principale creata (${services.length} servizi, ${staff.length} staff, ${appointments.length} appuntamenti)`);
      created++;
    } catch (err: any) {
      console.error(`  [ERR] ${tenant.name}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== Completato: ${created} create, ${skipped} già presenti, ${errors} errori ===`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
