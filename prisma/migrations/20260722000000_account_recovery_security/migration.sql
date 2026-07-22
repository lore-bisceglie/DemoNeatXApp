-- Account recovery hardening. This migration only adds nullable fields and a
-- defaulted counter; it does not alter or remove existing accounts.
ALTER TABLE "Tenant"
  ADD COLUMN "emailVerifyExpiresAt" TIMESTAMP(3),
  ADD COLUMN "emailVerifyRequestCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "emailVerifyRequestWindowAt" TIMESTAMP(3),
  ADD COLUMN "passwordResetTokenHash" TEXT,
  ADD COLUMN "passwordResetExpiresAt" TIMESTAMP(3),
  ADD COLUMN "passwordResetRequestCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "passwordResetRequestWindowAt" TIMESTAMP(3),
  ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Tenant_passwordResetTokenHash_key"
  ON "Tenant"("passwordResetTokenHash");
