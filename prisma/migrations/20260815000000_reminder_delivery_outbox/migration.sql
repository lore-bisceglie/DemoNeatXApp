CREATE TABLE "ReminderDelivery" (
  "id" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'OPENWA',
  "status" TEXT NOT NULL DEFAULT 'PROCESSING',
  "leaseToken" TEXT NOT NULL,
  "creditReserved" BOOLEAN NOT NULL DEFAULT false,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "providerMessageId" TEXT,
  "lastError" TEXT,
  "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReminderDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReminderDelivery_leaseToken_key" ON "ReminderDelivery"("leaseToken");
CREATE UNIQUE INDEX "ReminderDelivery_appointmentId_channel_key" ON "ReminderDelivery"("appointmentId", "channel");
CREATE INDEX "ReminderDelivery_tenantId_status_idx" ON "ReminderDelivery"("tenantId", "status");
CREATE INDEX "ReminderDelivery_status_queuedAt_idx" ON "ReminderDelivery"("status", "queuedAt");

ALTER TABLE "ReminderDelivery"
  ADD CONSTRAINT "ReminderDelivery_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReminderDelivery"
  ADD CONSTRAINT "ReminderDelivery_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
