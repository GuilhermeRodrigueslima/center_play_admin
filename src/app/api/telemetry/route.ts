import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { macAddress, ping } = await req.json();

    if (!macAddress) {
      return NextResponse.json({ error: 'MAC Address é obrigatório' }, { status: 400 });
    }

    const cleanMac = String(macAddress).toUpperCase().trim();

    // 1. Atualiza o lastSeenAt do dispositivo
    const devices = await sql`
      UPDATE "Device"
      SET "lastSeenAt" = NOW()
      WHERE "macAddress" = ${cleanMac}
      RETURNING "id"
    `;

    if (devices.length === 0) {
      return NextResponse.json({ error: 'Dispositivo não encontrado' }, { status: 404 });
    }

    const deviceId = devices[0].id;
    const sessionId = 'ses_' + Math.random().toString(36).substring(2, 12);

    await sql`
      INSERT INTO "DeviceSession" ("id", "deviceId", "startedAt")
      VALUES (${sessionId}, ${deviceId}, NOW())
    `;

    return NextResponse.json({ success: true, sessionId });
  } catch (error: any) {
    console.error('Erro na telemetria:', error);
    return NextResponse.json({ error: error?.message || 'Erro interno' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const onlineThreshold = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const onlineDevices = await sql`
      SELECT * FROM "Device"
      WHERE "lastSeenAt" >= ${onlineThreshold}
      ORDER BY "lastSeenAt" DESC
    `;

    return NextResponse.json(onlineDevices);
  } catch (error: any) {
    return NextResponse.json([]);
  }
}
