import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getPanelSession } from '@/lib/admin-session';

export async function GET() {
  const session = await getPanelSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const devices = session.role === 'master'
      ? await sql`SELECT * FROM "Device" ORDER BY "updatedAt" DESC`
      : await sql`SELECT * FROM "Device" WHERE "resellerId" = ${session.resellerId ?? ''} ORDER BY "updatedAt" DESC`;
    return NextResponse.json(devices);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getPanelSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { macAddress, deviceKey, name, xtreamUrl, username, password, expiresAt, notes } = body;
    if (!macAddress) return NextResponse.json({ error: 'macAddress is required' }, { status: 400 });
    const cleanMac = String(macAddress).toUpperCase().trim();
    const safeKey = typeof deviceKey === 'string' && /^[a-f0-9]{64}$/i.test(deviceKey) ? deviceKey : crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const expDate = expiresAt ? new Date(expiresAt).toISOString() : null;
    const owner = session.role === 'master' ? null : session.resellerId;
    const rows = await sql`
      INSERT INTO "Device" ("id", "macAddress", "deviceKey", "name", "xtreamUrl", "username", "password", "expiresAt", "notes", "resellerId", "isActive", "createdAt", "updatedAt", "lastSeenAt")
      VALUES (${crypto.randomUUID()}, ${cleanMac}, ${safeKey}, ${name || 'Smart TV / TV Box'}, ${xtreamUrl || ''}, ${username || ''}, ${password || ''}, ${expDate}, ${notes || ''}, ${owner}, true, NOW(), NOW(), NOW())
      ON CONFLICT ("macAddress") DO UPDATE SET "name" = EXCLUDED."name", "xtreamUrl" = EXCLUDED."xtreamUrl", "username" = EXCLUDED."username", "password" = EXCLUDED."password", "expiresAt" = EXCLUDED."expiresAt", "notes" = EXCLUDED."notes", "resellerId" = COALESCE("Device"."resellerId", EXCLUDED."resellerId"), "isActive" = true, "updatedAt" = NOW()
      RETURNING *`;
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
