BEGIN;

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "referralSignupBonusAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "referralRewardedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_ownerEmail_ci_key"
  ON "Tenant" (LOWER("ownerEmail"))
  WHERE "ownerEmail" IS NOT NULL AND BTRIM("ownerEmail") <> '';

CREATE TABLE IF NOT EXISTS "ProcessedStripeEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "tenantId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "ProcessedStripeEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProcessedStripeEvent_tenantId_idx"
  ON "ProcessedStripeEvent"("tenantId");
CREATE INDEX IF NOT EXISTS "ProcessedStripeEvent_createdAt_idx"
  ON "ProcessedStripeEvent"("createdAt");

DO $$ BEGIN
  ALTER TABLE "ProcessedStripeEvent"
    ADD CONSTRAINT "ProcessedStripeEvent_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Gli account storici non devono ricevere nuovamente bonus già gestiti.
UPDATE "Tenant"
SET "referralSignupBonusAt" = COALESCE("referredAt", "createdAt")
WHERE "referredByCode" IS NOT NULL
  AND "emailVerified" = TRUE
  AND "referralSignupBonusAt" IS NULL;

UPDATE "Tenant"
SET "referralRewardedAt" = COALESCE("convertedAt", "createdAt")
WHERE "referredByCode" IS NOT NULL
  AND "trialStatus" = 'converted'
  AND "referralRewardedAt" IS NULL;

COMMIT;
