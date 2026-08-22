import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { macAddress, deviceKey, name } = body as {
      macAddress: string;
      deviceKey: string;
      name?: string;
    };

    if (!macAddress) {
      return NextResponse.json({ error: 'macAddress is required' }, { status: 400 });
    }

    const cleanMac = macAddress.toUpperCase().trim();
    const safeKey = deviceKey || Math.floor(100000 + Math.random() * 900000).toString();
    const generatedId = 'dev_' + Math.random().toString(36).substring(2, 12);

    const devices = await sql`
      INSERT INTO "Device" (
        "id", "macAddress", "deviceKey", "name", "isActive", "createdAt", "updatedAt", "lastSeenAt"
      ) VALUES (
        ${generatedId}, ${cleanMac}, ${safeKey}, ${name || 'Smart TV / TV Box'}, true, NOW(), NOW(), NOW()
      )
      ON CONFLICT ("macAddress") DO UPDATE SET
        "deviceKey" = ${safeKey},
        "lastSeenAt" = NOW()
      RETURNING *
    `;

    const device = devices[0];
    const isConfigured = Boolean(
      device.xtreamUrl &&
      device.username &&
      device.password &&
      String(device.xtreamUrl).trim().length > 0 &&
      String(device.username).trim().length > 0 &&
      String(device.password).trim().length > 0
    );

    return NextResponse.json({
      activated: isConfigured && device.isActive,
      macAddress: device.macAddress,
      deviceKey: device.deviceKey,
      xtreamUrl: device.xtreamUrl || null,
      username: device.username || null,
      password: device.password || null,
      name: device.name || null,
      expiresAt: device.expiresAt || null,
      isActive: device.isActive,
    });
  } catch (error: any) {
    console.error('Error in /api/device/register:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
