import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { macAddress, deviceKey } = body as {
      macAddress: string;
      deviceKey: string;
    };

    if (!macAddress) {
      return NextResponse.json({ error: 'macAddress is required' }, { status: 400 });
    }

    const cleanMac = macAddress.toUpperCase().trim();
    const safeKey = deviceKey || Math.floor(100000 + Math.random() * 900000).toString();

    // 1. Busca dispositivo no Neon PostgreSQL
    const existing = await sql`
      SELECT * FROM "Device" WHERE "macAddress" = ${cleanMac} LIMIT 1
    `;

    let device: any = null;

    if (existing.length === 0) {
      // Auto-cadastra aparelho no banco imediatamente como "Aguardando Lista"
      const generatedId = 'dev_' + Math.random().toString(36).substring(2, 12);
      const inserted = await sql`
        INSERT INTO "Device" (
          "id", "macAddress", "deviceKey", "name", "isActive", "createdAt", "updatedAt", "lastSeenAt"
        ) VALUES (
          ${generatedId}, ${cleanMac}, ${safeKey}, 'Smart TV / TV Box', true, NOW(), NOW(), NOW()
        ) RETURNING *
      `;
      device = inserted[0];
    } else {
      device = existing[0];
      // Atualiza lastSeenAt
      await sql`
        UPDATE "Device" SET "lastSeenAt" = NOW() WHERE "id" = ${device.id}
      `;
    }

    if (!device.isActive) {
      return NextResponse.json({
        activated: false,
        macAddress: device.macAddress,
        deviceKey: device.deviceKey,
        error: 'Dispositivo bloqueado pelo administrador.',
      });
    }

    if (device.expiresAt && new Date(device.expiresAt) < new Date()) {
      return NextResponse.json({
        activated: false,
        macAddress: device.macAddress,
        deviceKey: device.deviceKey,
        error: 'Assinatura expirada. Contate o suporte para renovar.',
      });
    }

    const isConfigured = Boolean(
      device.xtreamUrl &&
      device.username &&
      device.password &&
      String(device.xtreamUrl).trim().length > 0 &&
      String(device.username).trim().length > 0 &&
      String(device.password).trim().length > 0
    );

    return NextResponse.json({
      activated: isConfigured,
      macAddress: device.macAddress,
      deviceKey: device.deviceKey,
      xtreamUrl: device.xtreamUrl || null,
      username: device.username || null,
      password: device.password || null,
      name: device.name || null,
      expiresAt: device.expiresAt || null,
      statusMessage: isConfigured ? 'Ativado' : 'Aguardando Lista',
    });
  } catch (error: any) {
    console.error('Error in /api/device/check:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
