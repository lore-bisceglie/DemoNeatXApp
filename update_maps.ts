import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const slug = "green-beauty-fu73";
  const mapsLink = "https://www.google.com/maps/place/Green+Beauty/@44.6593426,8.3702504,19z/data=!4m6!3m5!1s0x12d2d3e672b4d083:0x5d118a3750a72b5e!8m2!3d44.659241!4d8.3699215!16s%2Fg%2F11yb1tt8x4?entry=ttu";

  const tenant = await prisma.tenant.findUnique({
    where: { slug }
  });

  if (!tenant) {
    console.error("Tenant not found");
    return;
  }

  await prisma.tenant.update({
    where: { slug },
    data: { mapsLink }
  });

  const locations = await prisma.location.findMany({
    where: { tenantId: tenant.id }
  });

  for (const loc of locations) {
    await prisma.location.update({
      where: { id: loc.id },
      data: { mapsLink: mapsLink }
    });
  }

  console.log("Maps link updated successfully for tenant and locations.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
