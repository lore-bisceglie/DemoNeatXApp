import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

try {
  const [duplicateEmailSummary] = await prisma.$queryRawUnsafe(`
    SELECT COUNT(*)::int AS groups, COALESCE(SUM(c - 1), 0)::int AS extras
    FROM (
      SELECT LOWER("ownerEmail") AS normalized_email, COUNT(*) AS c
      FROM "Tenant"
      WHERE "ownerEmail" IS NOT NULL AND BTRIM("ownerEmail") <> ''
      GROUP BY LOWER("ownerEmail")
      HAVING COUNT(*) > 1
    ) duplicates
  `);
  const tenantColumns = await prisma.$queryRawUnsafe(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Tenant'
    ORDER BY column_name
  `);
  const appliedMigrations = await prisma.$queryRawUnsafe(`
    SELECT migration_name, finished_at IS NOT NULL AS finished
    FROM "_prisma_migrations"
    ORDER BY started_at
  `).catch(() => []);
  const bookingSchedule = await prisma.tenant.findUnique({
    where: { slug: "green-beauty-bistagno" },
    select: {
      closedDays: true,
      openTime: true,
      closeTime: true,
      breakStart: true,
      breakEnd: true,
      locations: {
        where: { isMain: true },
        select: { closedDays: true, openTime: true, closeTime: true, breakStart: true, breakEnd: true },
      },
    },
  });

  console.log(JSON.stringify({
    duplicateEmailSummary,
    tenantColumnNames: tenantColumns.map((item) => item.column_name),
    appliedMigrations,
    bookingSchedule,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
