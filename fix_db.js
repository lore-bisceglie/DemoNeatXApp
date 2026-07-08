const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "StoreSettings" ADD COLUMN "paymentMandatory" BOOLEAN NOT NULL DEFAULT true;');
    console.log('Migration applied successfully');
  } catch (e) {
    if (e.message.includes('already exists')) {
        console.log('Column already exists.');
    } else {
        console.error(e);
        process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
