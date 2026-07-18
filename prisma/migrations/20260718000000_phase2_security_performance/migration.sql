BEGIN;

-- Prima di applicare questa migrazione eseguire:
--   npx ts-node migrate_passwords.ts
-- La guardia impedisce di eliminare password legacy non ancora convertite.

DO $$
DECLARE
  unsafe_passwords INTEGER := 0;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Tenant' AND column_name = 'adminPassword'
  ) THEN
    EXECUTE $query$
      SELECT COUNT(*)
      FROM "Tenant"
      WHERE "adminPassword" IS NOT NULL
        AND (
          "ownerPasswordHash" IS NULL OR
          "ownerPasswordHash" !~ '^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$'
        )
    $query$ INTO unsafe_passwords;
  END IF;
  IF unsafe_passwords > 0 THEN
    RAISE EXCEPTION 'Migrazione interrotta: esistono password legacy non ancora convertite';
  END IF;
END $$;

-- Normalizza eventuali valori storici prima di introdurre il tipo enum.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Plan') THEN
    CREATE TYPE "Plan" AS ENUM ('basic', 'pro', 'elite');
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Tenant' AND column_name = 'plan' AND udt_name <> 'Plan'
  ) THEN
    UPDATE "Tenant" SET "plan" = 'elite' WHERE "plan" = 'premium';
    UPDATE "Tenant" SET "plan" = 'basic' WHERE "plan" NOT IN ('basic', 'pro', 'elite');
    ALTER TABLE "Tenant" ALTER COLUMN "plan" DROP DEFAULT;
    ALTER TABLE "Tenant"
      ALTER COLUMN "plan" TYPE "Plan" USING ("plan"::"Plan");
  END IF;
END $$;
ALTER TABLE "Tenant" ALTER COLUMN "plan" SET DEFAULT 'basic';
ALTER TABLE "Tenant" DROP COLUMN IF EXISTS "adminPassword";

CREATE INDEX IF NOT EXISTS "Appointment_tenantId_date_idx"
  ON "Appointment"("tenantId", "date");

-- Le entità appartenenti a un tenant vengono eliminate insieme al tenant.
ALTER TABLE "Location" DROP CONSTRAINT IF EXISTS "Location_tenantId_fkey";
ALTER TABLE "Location" ADD CONSTRAINT "Location_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Service" DROP CONSTRAINT IF EXISTS "Service_tenantId_fkey";
ALTER TABLE "Service" ADD CONSTRAINT "Service_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_tenantId_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BlockedSlot" DROP CONSTRAINT IF EXISTS "BlockedSlot_tenantId_fkey";
ALTER TABLE "BlockedSlot" ADD CONSTRAINT "BlockedSlot_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StoreSettings" DROP CONSTRAINT IF EXISTS "StoreSettings_tenantId_fkey";
ALTER TABLE "StoreSettings" ADD CONSTRAINT "StoreSettings_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "NoShow" DROP CONSTRAINT IF EXISTS "NoShow_tenantId_fkey";
ALTER TABLE "NoShow" ADD CONSTRAINT "NoShow_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Waitlist" DROP CONSTRAINT IF EXISTS "Waitlist_tenantId_fkey";
ALTER TABLE "Waitlist" ADD CONSTRAINT "Waitlist_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerNote" DROP CONSTRAINT IF EXISTS "CustomerNote_tenantId_fkey";
ALTER TABLE "CustomerNote" ADD CONSTRAINT "CustomerNote_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ActivityLog" DROP CONSTRAINT IF EXISTS "ActivityLog_tenantId_fkey";
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Staff" DROP CONSTRAINT IF EXISTS "Staff_tenantId_fkey";
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Le tabelle ponte seguono Service e Location; gli appuntamenti storici
-- mantengono i dati cliente quando servizio, staff o sede vengono rimossi.
ALTER TABLE "LocationSettings" DROP CONSTRAINT IF EXISTS "LocationSettings_locationId_fkey";
ALTER TABLE "LocationSettings" ADD CONSTRAINT "LocationSettings_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceLocation" DROP CONSTRAINT IF EXISTS "ServiceLocation_serviceId_fkey";
ALTER TABLE "ServiceLocation" ADD CONSTRAINT "ServiceLocation_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ServiceLocation" DROP CONSTRAINT IF EXISTS "ServiceLocation_locationId_fkey";
ALTER TABLE "ServiceLocation" ADD CONSTRAINT "ServiceLocation_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_serviceId_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_staffId_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_staffId_fkey"
  FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Appointment" DROP CONSTRAINT IF EXISTS "Appointment_locationId_fkey";
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Staff" DROP CONSTRAINT IF EXISTS "Staff_locationId_fkey";
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_locationId_fkey"
  FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
