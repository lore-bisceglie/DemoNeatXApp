import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CountRow = { count: number };
type ExistsRow = { exists: boolean };
type ColumnRow = { column_name: string; data_type: string; udt_name: string };
type MigrationRow = { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null };
type SlugRow = { slug: string };
type IndexRow = { indexname: string; indexdef: string };
type ForeignKeyRow = { table_name: string; constraint_name: string; delete_rule: string };
type PlanRow = { plan: string; count: number };

async function main() {
  const columns = await prisma.$queryRawUnsafe<ColumnRow[]>(`
    SELECT column_name, data_type, udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Tenant'
      AND column_name IN ('adminPassword', 'ownerPasswordHash', 'plan')
    ORDER BY column_name
  `);

  const hasLegacyPassword = columns.some((column) => column.column_name === "adminPassword");
  const hasOwnerHash = columns.some((column) => column.column_name === "ownerPasswordHash");

  const [tenantRows, appointmentRows, serviceRows, migrationTableRows, sampleSlugs] =
    await Promise.all([
      prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*)::int AS count FROM "Tenant"`),
      prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*)::int AS count FROM "Appointment"`),
      prisma.$queryRawUnsafe<CountRow[]>(`SELECT COUNT(*)::int AS count FROM "Service"`),
      prisma.$queryRawUnsafe<ExistsRow[]>(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
        ) AS exists
      `),
      prisma.$queryRawUnsafe<SlugRow[]>(`
        SELECT slug FROM "Tenant"
        WHERE slug IS NOT NULL
        ORDER BY "createdAt" DESC
        LIMIT 3
      `),
    ]);

  const legacyRows = hasLegacyPassword
    ? await prisma.$queryRawUnsafe<CountRow[]>(`
        SELECT COUNT(*)::int AS count FROM "Tenant"
        WHERE "adminPassword" IS NOT NULL AND "adminPassword" <> ''
      `)
    : [{ count: 0 }];

  const missingHashRows = hasOwnerHash
    ? await prisma.$queryRawUnsafe<CountRow[]>(`
        SELECT COUNT(*)::int AS count FROM "Tenant"
        WHERE "ownerPasswordHash" IS NULL OR "ownerPasswordHash" = ''
      `)
    : [{ count: tenantRows[0]?.count ?? 0 }];

  const missingHashSlugs = hasOwnerHash
    ? await prisma.$queryRawUnsafe<SlugRow[]>(`
        SELECT slug FROM "Tenant"
        WHERE "ownerPasswordHash" IS NULL OR "ownerPasswordHash" = ''
        ORDER BY slug
      `)
    : sampleSlugs;

  const malformedHashRows = hasOwnerHash
    ? await prisma.$queryRawUnsafe<CountRow[]>(`
        SELECT COUNT(*)::int AS count FROM "Tenant"
        WHERE "ownerPasswordHash" IS NOT NULL
          AND "ownerPasswordHash" <> ''
          AND "ownerPasswordHash" !~ '^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$'
      `)
    : [{ count: 0 }];

  const migrationTableExists = migrationTableRows[0]?.exists ?? false;
  const migrations = migrationTableExists
    ? await prisma.$queryRawUnsafe<MigrationRow[]>(`
        SELECT migration_name, finished_at, rolled_back_at
        FROM "_prisma_migrations"
        ORDER BY started_at
      `)
    : [];

  const planColumn = columns.find((column) => column.column_name === "plan");
  const [appointmentIndexes, cascadeRules, planDistribution] = await Promise.all([
    prisma.$queryRawUnsafe<IndexRow[]>(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = 'Appointment'
      ORDER BY indexname
    `),
    prisma.$queryRawUnsafe<ForeignKeyRow[]>(`
      SELECT tc.table_name, tc.constraint_name, rc.delete_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.referential_constraints rc
        ON tc.constraint_catalog = rc.constraint_catalog
       AND tc.constraint_schema = rc.constraint_schema
       AND tc.constraint_name = rc.constraint_name
      WHERE tc.constraint_schema = 'public'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('Appointment', 'Service', 'BlockedSlot')
      ORDER BY tc.table_name, tc.constraint_name
    `),
    prisma.$queryRawUnsafe<PlanRow[]>(`
      SELECT plan::text AS plan, COUNT(*)::int AS count
      FROM "Tenant"
      GROUP BY plan
      ORDER BY plan
    `),
  ]);

  console.log(
    JSON.stringify(
      {
        counts: {
          tenants: tenantRows[0]?.count ?? 0,
          appointments: appointmentRows[0]?.count ?? 0,
          services: serviceRows[0]?.count ?? 0,
        },
        passwordState: {
          legacyColumnPresent: hasLegacyPassword,
          legacyValues: legacyRows[0]?.count ?? 0,
          ownerHashColumnPresent: hasOwnerHash,
          missingHashes: missingHashRows[0]?.count ?? 0,
          missingHashSlugs: missingHashSlugs.map((tenant) => tenant.slug),
          malformedHashes: malformedHashRows[0]?.count ?? 0,
        },
        planColumn: planColumn
          ? { dataType: planColumn.data_type, databaseType: planColumn.udt_name }
          : null,
        planDistribution,
        appointmentIndexes: appointmentIndexes.map((index) => index.indexdef),
        cascadeRules,
        migrationHistory: {
          tablePresent: migrationTableExists,
          migrations: migrations.map((migration) => ({
            name: migration.migration_name,
            completed: Boolean(migration.finished_at),
            rolledBack: Boolean(migration.rolled_back_at),
          })),
        },
        sampleSlugs: sampleSlugs.map((tenant) => tenant.slug),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error("Audit database non riuscito:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
