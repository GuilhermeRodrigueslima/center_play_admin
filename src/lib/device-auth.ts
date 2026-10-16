import { sql } from '@/lib/db';

export type DeviceRecord = {
  id: string;
  macAddress: string;
  deviceKey: string;
  name?: string | null;
  xtreamUrl?: string | null;
  username?: string | null;
  password?: string | null;
  isActive: boolean;
  expiresAt?: string | Date | null;
  [key: string]: unknown;
};

type DeviceCredentials = {
  macAddress: string;
  deviceKey: string;
  legacyDeviceKey?: string;
  name?: string;
};

const legacyKeyPattern = /^\d{6}$/;
const secureKeyPattern = /^[a-f0-9]{64}$/i;

export function normalizeDeviceCredentials(input: DeviceCredentials) {
  const macAddress = String(input.macAddress || '').toUpperCase().trim();
  const deviceKey = String(input.deviceKey || '').trim();
  const legacyDeviceKey = input.legacyDeviceKey ? String(input.legacyDeviceKey).trim() : undefined;
  if (!macAddress || !secureKeyPattern.test(deviceKey)) return null;
  return { macAddress, deviceKey, legacyDeviceKey, name: input.name?.trim() };
}

export async function authenticateOrRegisterDevice(input: DeviceCredentials): Promise<DeviceRecord | null> {
  const credentials = normalizeDeviceCredentials(input);
  if (!credentials) return null;

  const existing = await sql`SELECT * FROM "Device" WHERE "macAddress" = ${credentials.macAddress} LIMIT 1`;
  if (existing.length === 0) {
    const created = await sql`
      INSERT INTO "Device" ("id", "macAddress", "deviceKey", "name", "isActive", "createdAt", "updatedAt", "lastSeenAt")
      VALUES (${crypto.randomUUID()}, ${credentials.macAddress}, ${credentials.deviceKey}, ${credentials.name || 'Center Play'}, true, NOW(), NOW(), NOW())
      RETURNING *
    `;
    return created[0] as DeviceRecord;
  }

  const device = existing[0] as DeviceRecord;
  const storedKey = String(device.deviceKey || '');
  const sameSecret = storedKey === credentials.deviceKey;
  const canMigrateLegacy = legacyKeyPattern.test(storedKey) && credentials.legacyDeviceKey === storedKey;
  if (!sameSecret && !canMigrateLegacy) return null;

  const updated = await sql`
    UPDATE "Device"
    SET "deviceKey" = ${credentials.deviceKey},
        "name" = COALESCE(${credentials.name || null}, "name"),
        "lastSeenAt" = NOW(),
        "updatedAt" = NOW()
    WHERE "id" = ${String(device.id)}
    RETURNING *
  `;
  return updated[0] as DeviceRecord;
}