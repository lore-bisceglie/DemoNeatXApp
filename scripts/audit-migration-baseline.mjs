import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const columns = await prisma.$queryRawUnsafe(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
  `);
  const columnSet = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
  const requiredColumns = [
    "Tenant.emailVerified", "Tenant.ownerPasswordHash", "Tenant.plan",
    "Appointment.locationId", "Staff.locationId", "Location.tenantId",
    "LocationSettings.locationId", "ServiceLocation.serviceId",
    "ServiceLocation.locationId", "StaffLocation.staffId", "StaffLocation.locationId",
  ];
  for (const key of requiredColumns) assert.ok(columnSet.has(key), `Colonna mancante: ${key}`);
  assert.equal(columnSet.has("Tenant.adminPassword"), false, "adminPassword legacy ancora presente");

  const [planColumn] = await prisma.$queryRawUnsafe(`
    SELECT udt_name FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Tenant' AND column_name = 'plan'
  `);
  assert.equal(planColumn?.udt_name, "Plan");

  const indexes = await prisma.$queryRawUnsafe(`
    SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
  `);
  const indexSet = new Set(indexes.map((row) => row.indexname));
  for (const name of [
    "Location_tenantId_idx", "Location_tenantId_slug_key",
    "LocationSettings_locationId_key", "ServiceLocation_serviceId_locationId_key",
    "StaffLocation_staffId_locationId_key", "Appointment_tenantId_date_idx",
  ]) assert.ok(indexSet.has(name), `Indice mancante: ${name}`);

  const cascades = await prisma.$queryRawUnsafe(`
    SELECT tc.constraint_name, rc.delete_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_schema = tc.constraint_schema
      AND rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY'
  `);
  const cascadeMap = new Map(cascades.map((row) => [row.constraint_name, row.delete_rule]));
  const cascadeNames = [
    "Location_tenantId_fkey", "Service_tenantId_fkey", "Appointment_tenantId_fkey",
    "StoreSettings_tenantId_fkey", "ActivityLog_tenantId_fkey", "Staff_tenantId_fkey",
  ];
  const cascadeState = Object.fromEntries(cascadeNames.map((name) => [name, cascadeMap.get(name)]));
  const [passwordSummary] = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*) FILTER (WHERE "ownerPasswordHash" IS NULL)::int AS missing,
      COUNT(*) FILTER (
        WHERE "ownerPasswordHash" IS NOT NULL
          AND "ownerPasswordHash" !~ '^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$'
      )::int AS invalid,
      COUNT(*) FILTER (
        WHERE ("ownerPasswordHash" IS NULL OR "ownerPasswordHash" !~ '^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$')
          AND "isDemoData" = TRUE
      )::int AS demo_rows
    FROM "Tenant"
  `);

  console.log(JSON.stringify({
    verified: true,
    requiredColumns: requiredColumns.length,
    requiredIndexes: 6,
    cascadeState,
    passwordSummary,
    planType: planColumn.udt_name,
    legacyPasswordColumnAbsent: true,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
