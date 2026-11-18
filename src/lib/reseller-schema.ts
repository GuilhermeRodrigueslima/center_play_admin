import { sql } from '@/lib/db';

let schemaReady: Promise<void> | null = null;

export function ensureResellerSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS "Reseller" (
          "id" TEXT PRIMARY KEY,
          "username" TEXT NOT NULL UNIQUE,
          "password" TEXT NOT NULL,
          "name" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "notes" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`ALTER TABLE "Client" ADD COLUMN IF NOT EXISTS "resellerId" TEXT`;
      await sql`ALTER TABLE "Device" ADD COLUMN IF NOT EXISTS "resellerId" TEXT`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}
