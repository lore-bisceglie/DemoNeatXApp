import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const slug = "green-beauty-fu73";
  const instagramUrl = "https://instagram.com/greenbeauty_studiodiestetica"; 

  const tenant = await prisma.tenant.findUnique({
    where: { slug }
  });

  if (!tenant) return;

  await prisma.tenant.update({
    where: { slug },
    data: { instagramUrl }
  });

  console.log("Instagram updated to full URL");
}

main().catch(console.error).finally(() => prisma.$disconnect());
