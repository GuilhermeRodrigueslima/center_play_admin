import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { requireAdminRequest } from '@/lib/admin-session';

// Listar todos os dispositivos cadastrados
export async function GET() {
  const unauthorized = await requireAdminRequest();
  if (unauthorized) return unauthorized;
  try {
    const devices = await sql`
      SELECT * FROM "Device" ORDER BY "updatedAt" DESC
    `;
    return NextResponse.json(devices);
  } catch (error: any) {
    console.error('Error fetching devices:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}

// Criar ou ativar dispositivo manualmente pelo painel
export async function POST(req: Request) {
  const unauthorized = await requireAdminRequest();
  if (unauthorized) return unauthorized;
  try {
    const body = await req.json();
    const { macAddress, deviceKey, name, xtreamUrl, username, password, expiresAt, notes } = body;

    if (!macAddress) {
      return NextResponse.json({ error: 'macAddress is required' }, { status: 400 });
    }

    const cleanMac = macAddress.toUpperCase().trim();
    const safeKey = typeof deviceKey === 'string' && /^[a-f0-9]{64}$/i.test(deviceKey)
      ? deviceKey
      : `${crypto.randomUUID().replace(/-/g, '')}${crypto.randomUUID().replace(/-/g, '')}`;
    const generatedId = crypto.randomUUID();
    const expDate = expiresAt ? new Date(expiresAt).toISOString() : null;

    const devices = await sql`
      INSERT INTO "Device" (
        "id", "macAddress", "deviceKey", "name", "xtreamUrl", "username", "password", "expiresAt", "notes", "isActive", "createdAt", "updatedAt", "lastSeenAt"
      ) VALUES (
        ${generatedId}, ${cleanMac}, ${safeKey}, ${name || 'Smart TV / TV Box'}, ${xtreamUrl || ''}, ${username || ''}, ${password || ''}, ${expDate}, ${notes || ''}, true, NOW(), NOW(), NOW()
      )
      ON CONFLICT ("macAddress") DO UPDATE SET
        "name" = COALESCE(EXCLUDED."name", "Device"."name"),
        "xtreamUrl" = EXCLUDED."xtreamUrl",
        "username" = EXCLUDED."username",
        "password" = EXCLUDED."password",
        "expiresAt" = EXCLUDED."expiresAt",
        "notes" = EXCLUDED."notes",
        "isActive" = true,
        "updatedAt" = NOW()
      RETURNING *
    `;

    return NextResponse.json(devices[0]);
  } catch (error: any) {
    console.error('Error saving device:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
