-- Runtime schema synchronization for the legacy Supabase database.
-- This migration is strictly additive: it never removes or rewrites user data.
BEGIN;

ALTER TABLE "Tenant"
  ADD COLUMN IF NOT EXISTS "template" TEXT NOT NULL DEFAULT 'barbiere',
  ADD COLUMN IF NOT EXISTS "isElite" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "emailVerifyExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailVerifyRequestCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "emailVerifyRequestWindowAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "passwordResetRequestCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "passwordResetRequestWindowAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sessionVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "referralSignupBonusAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "referralRewardedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_emailVerifyToken_key"
  ON "Tenant"("emailVerifyToken");
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_passwordResetTokenHash_key"
  ON "Tenant"("passwordResetTokenHash");
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_referralCode_key"
  ON "Tenant"("referralCode");

ALTER TABLE "Staff"
  ADD COLUMN IF NOT EXISTS "staffAccessTokenHash" TEXT,
  ADD COLUMN IF NOT EXISTS "staffAccessTokenCreatedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "staffAccessTokenRevokedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "staffAccessLastUsedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Staff_staffAccessTokenHash_key"
  ON "Staff"("staffAccessTokenHash");

CREATE TABLE IF NOT EXISTS "ProcessedStripeEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'processing',
  "tenantId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  CONSTRAINT "ProcessedStripeEvent_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProcessedStripeEvent_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProcessedStripeEvent_tenantId_idx"
  ON "ProcessedStripeEvent"("tenantId");
CREATE INDEX IF NOT EXISTS "ProcessedStripeEvent_createdAt_idx"
  ON "ProcessedStripeEvent"("createdAt");

CREATE TABLE IF NOT EXISTS "PlatformReview" (
  "id" TEXT NOT NULL,
  "rating" INTEGER NOT NULL DEFAULT 5,
  "text" TEXT NOT NULL,
  "isApproved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "tenantId" TEXT NOT NULL,
  CONSTRAINT "PlatformReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PlatformReview_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformReview_tenantId_key"
  ON "PlatformReview"("tenantId");

CREATE TABLE IF NOT EXISTS "SocialPost" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "imageUrl" TEXT,
  "caption" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "platform" TEXT NOT NULL DEFAULT 'INSTAGRAM',
  "scheduledFor" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SocialPost_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "SocialPost_tenantId_idx"
  ON "SocialPost"("tenantId");

CREATE TABLE IF NOT EXISTS "StaffLeaveRequest" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "date" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "start" TEXT,
  "end" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewedBy" TEXT,
  CONSTRAINT "StaffLeaveRequest_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StaffLeaveRequest_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StaffLeaveRequest_staffId_fkey"
    FOREIGN KEY ("staffId") REFERENCES "Staff"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "StaffLeaveRequest_tenantId_status_date_idx"
  ON "StaffLeaveRequest"("tenantId", "status", "date");
CREATE INDEX IF NOT EXISTS "StaffLeaveRequest_staffId_date_idx"
  ON "StaffLeaveRequest"("staffId", "date");

COMMIT;
