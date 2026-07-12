-- Add emailVerified column to Tenant table
ALTER TABLE "Tenant" 
ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;