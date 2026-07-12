-- Migrazione Multi-Location: Aggiunge tabelle Location, LocationSettings, ServiceLocation
-- e colonne locationId su Appointment, Staff
-- Da eseguire su database PostgreSQL esistente (Supabase)

-- ============================================================
-- 1. NUOVE TABELLE
-- ============================================================

-- Location (Sedi)
CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "mapsLink" TEXT,
    "isMain" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "openTime" TEXT,
    "closeTime" TEXT,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "closedDays" TEXT,
    "staffSheetUrl" TEXT,
    "tenantId" TEXT NOT NULL,
    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Location_tenantId_idx" ON "Location"("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Location_tenantId_slug_key" ON "Location"("tenantId", "slug");

-- LocationSettings (Impostazioni per-sede: SMS credits, pagamento)
CREATE TABLE IF NOT EXISTS "LocationSettings" (
    "id" TEXT NOT NULL,
    "smsCredits" INTEGER NOT NULL DEFAULT 0,
    "stripeAccountId" TEXT,
    "paymentStrategy" TEXT NOT NULL DEFAULT 'OFF',
    "paymentFixedAmount" DOUBLE PRECISION DEFAULT 5.0,
    "paymentPercentage" INTEGER DEFAULT 20,
    "paymentMandatory" BOOLEAN NOT NULL DEFAULT false,
    "locationId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LocationSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LocationSettings_locationId_key" ON "LocationSettings"("locationId");

-- ServiceLocation (Servizi per sede con prezzo override)
CREATE TABLE IF NOT EXISTS "ServiceLocation" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ServiceLocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ServiceLocation_serviceId_locationId_key" ON "ServiceLocation"("serviceId", "locationId");

-- ============================================================
-- 2. COLONNE AGGIUNTIVE SU TABELLE ESISTENTI
-- ============================================================

-- Appointment.locationId (nullable per retrocompatibilità)
ALTER TABLE "Appointment" 
ADD COLUMN IF NOT EXISTS "locationId" TEXT;

CREATE INDEX IF NOT EXISTS "Appointment_locationId_idx" ON "Appointment"("locationId");

ALTER TABLE "Appointment" 
ADD CONSTRAINT "Appointment_locationId_fkey" 
FOREIGN KEY ("locationId") REFERENCES "Location"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Staff.locationId (nullable = lavora in tutte le sedi)
ALTER TABLE "Staff" 
ADD COLUMN IF NOT EXISTS "locationId" TEXT;

CREATE INDEX IF NOT EXISTS "Staff_locationId_idx" ON "Staff"("locationId");

ALTER TABLE "Staff" 
ADD CONSTRAINT "Staff_locationId_fkey" 
FOREIGN KEY ("locationId") REFERENCES "Location"("id") 
ON DELETE SET NULL ON UPDATE CASCADE;

-- Location FKs
ALTER TABLE "Location" 
ADD CONSTRAINT "Location_tenantId_fkey" 
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LocationSettings" 
ADD CONSTRAINT "LocationSettings_locationId_fkey" 
FOREIGN KEY ("locationId") REFERENCES "Location"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- ServiceLocation FKs
ALTER TABLE "ServiceLocation" 
ADD CONSTRAINT "ServiceLocation_serviceId_fkey" 
FOREIGN KEY ("serviceId") REFERENCES "Service"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ServiceLocation" 
ADD CONSTRAINT "ServiceLocation_locationId_fkey" 
FOREIGN KEY ("locationId") REFERENCES "Location"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Location FKs
ALTER TABLE "Location" 
ADD CONSTRAINT "Location_tenantId_fkey" 
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Staff FK (già esiste per tenantId, aggiungiamo locationId)
-- Già gestito sopra

-- ============================================================
-- 3. INDICI E UNICITÀ PER NUOVE TABELLE
-- ============================================================

CREATE INDEX IF NOT EXISTS "Location_tenantId_idx" ON "Location"("tenantId");
CREATE UNIQUE INDEX IF NOT EXISTS "Location_tenantId_slug_key" ON "Location"("tenantId", "slug");

CREATE UNIQUE INDEX IF NOT EXISTS "LocationSettings_locationId_key" ON "LocationSettings"("locationId");

CREATE UNIQUE INDEX IF NOT EXISTS "ServiceLocation_serviceId_locationId_key" ON "ServiceLocation"("serviceId", "locationId");

CREATE INDEX IF NOT EXISTS "Appointment_locationId_idx" ON "Appointment"("locationId");

CREATE INDEX IF NOT EXISTS "Staff_locationId_idx" ON "Staff"("locationId");