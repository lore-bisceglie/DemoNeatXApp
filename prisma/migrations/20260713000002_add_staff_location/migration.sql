-- Create StaffLocation junction table
CREATE TABLE "StaffLocation" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    CONSTRAINT "StaffLocation_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for staff-location pairs
CREATE UNIQUE INDEX "StaffLocation_staffId_locationId_key" ON "StaffLocation"("staffId", "locationId");

-- Create indexes
CREATE INDEX "StaffLocation_staffId_idx" ON "StaffLocation"("staffId");
CREATE INDEX "StaffLocation_locationId_idx" ON "StaffLocation"("locationId");

-- Add foreign key constraints
ALTER TABLE "StaffLocation" ADD CONSTRAINT "StaffLocation_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffLocation" ADD CONSTRAINT "StaffLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing staff with specific locationId to StaffLocation
INSERT INTO "StaffLocation" ("id", "staffId", "locationId")
SELECT gen_random_uuid()::text, s."id", s."locationId"
FROM "Staff" s
WHERE s."locationId" IS NOT NULL;
