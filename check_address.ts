import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const slug = "green-beauty-fu73";
  const tenant = await prisma.tenant.findUnique({
    where: { slug }
  });

  console.log("Tenant address:", tenant?.address);
  console.log("Tenant city:", tenant?.city);

  const locations = await prisma.location.findMany({
    where: { tenantId: tenant?.id }
  });

  for (const loc of locations) {
    console.log("Location address:", loc.address);
    console.log("Location city:", loc.city);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
