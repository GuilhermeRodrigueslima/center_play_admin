import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Listar todos os dispositivos cadastrados
export async function GET() {
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
  try {
    const body = await req.json();
    const { macAddress, deviceKey, name, xtreamUrl, username, password, expiresAt, notes } = body;

    if (!macAddress) {
      return NextResponse.json({ error: 'macAddress is required' }, { status: 400 });
    }

    const cleanMac = macAddress.toUpperCase().trim();
    const safeKey = deviceKey || Math.floor(100000 + Math.random() * 900000).toString();
    const generatedId = 'dev_' + Math.random().toString(36).substring(2, 12);
    const expDate = expiresAt ? new Date(expiresAt).toISOString() : null;

    const devices = await sql`
      INSERT INTO "Device" (
        "id", "macAddress", "deviceKey", "name", "xtreamUrl", "username", "password", "expiresAt", "notes", "isActive", "createdAt", "updatedAt", "lastSeenAt"
      ) VALUES (
        ${generatedId}, ${cleanMac}, ${safeKey}, ${name || 'Smart TV / TV Box'}, ${xtreamUrl || ''}, ${username || ''}, ${password || ''}, ${expDate}, ${notes || ''}, true, NOW(), NOW(), NOW()
      )
      ON CONFLICT ("macAddress") DO UPDATE SET
        "deviceKey" = ${safeKey},
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
