import { PrismaClient } from '@prisma/client';
import { hashPassword } from './lib/password';

const prisma = new PrismaClient();

async function migratePasswords() {
  // Questo script va eseguito una sola volta prima della migrazione che elimina
  // la colonna legacy. Usiamo SQL raw perché il campo non fa più parte dello
  // schema Prisma e quindi non può rientrare per errore nella logica applicativa.
  const tenants = await prisma.$queryRaw<Array<{
    id: string;
    slug: string;
    legacyPassword: string;
  }>>`
    SELECT "id", "slug", "adminPassword" AS "legacyPassword"
    FROM "Tenant"
    WHERE "ownerPasswordHash" IS NULL
      AND "adminPassword" IS NOT NULL
  `;

  console.log(`Trovati ${tenants.length} tenant da migrare al nuovo sistema di hash...`);

  for (const tenant of tenants) {
    if (tenant.legacyPassword) {
      const hashed = hashPassword(tenant.legacyPassword);
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { ownerPasswordHash: hashed },
      });
      console.log(`- Migrato tenant: ${tenant.slug}`);
    }
  }
  const unsafe = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS "count"
    FROM "Tenant"
    WHERE "adminPassword" IS NOT NULL
      AND (
        "ownerPasswordHash" IS NULL OR
        "ownerPasswordHash" !~ '^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$'
      )
  `;
  if ((unsafe[0]?.count || 0) > 0) {
    throw new Error(`Backfill incompleto: ${unsafe[0].count} password non sono state migrate correttamente.`);
  }
  console.log("Migrazione completata.");
}

migratePasswords()
  .catch(e => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
