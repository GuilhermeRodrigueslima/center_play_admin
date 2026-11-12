CREATE TABLE "Reseller" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "name" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Reseller_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Reseller_username_key" ON "Reseller"("username");

ALTER TABLE "Client" ADD COLUMN "resellerId" TEXT;
ALTER TABLE "Device" ADD COLUMN "resellerId" TEXT;
ALTER TABLE "AppSettings" ADD COLUMN "backupUrls" TEXT DEFAULT '';

ALTER TABLE "Client" ADD CONSTRAINT "Client_resellerId_fkey"
  FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Device" ADD CONSTRAINT "Device_resellerId_fkey"
  FOREIGN KEY ("resellerId") REFERENCES "Reseller"("id") ON DELETE SET NULL ON UPDATE CASCADE;
