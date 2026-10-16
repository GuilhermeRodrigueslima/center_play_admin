import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { authenticateOrRegisterDevice, type DeviceRecord } from '@/lib/device-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { macAddress, deviceKey, legacyDeviceKey, expiresAt } = body as {
      macAddress: string;
      deviceKey: string;
      legacyDeviceKey?: string;
      expiresAt?: string | null;
    };

    let device: DeviceRecord | null = await authenticateOrRegisterDevice({ macAddress, deviceKey, legacyDeviceKey });
    if (!device) {
      return NextResponse.json({ error: 'Invalid device credentials' }, { status: 401 });
    }

    if (expiresAt) {
      // Se o app enviou a validade puxada do servidor Xtream, salva no banco!
      try {
        const expIso = new Date(expiresAt).toISOString();
        const updated = await sql`
          UPDATE "Device" SET "lastSeenAt" = NOW(), "expiresAt" = ${expIso} WHERE "id" = ${String(device.id)} RETURNING *
        `;
        device = updated[0] as DeviceRecord;
      } catch (_) {
        await sql`UPDATE "Device" SET "lastSeenAt" = NOW() WHERE "id" = ${device.id}`;
      }
    }

    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
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

    const hasCredentials = Boolean(device.xtreamUrl && device.username && device.password);

    return NextResponse.json({
      activated: hasCredentials,
      macAddress: device.macAddress,
      deviceKey: device.deviceKey,
      xtreamUrl: device.xtreamUrl,
      username: device.username,
      password: device.password,
      name: device.name,
      expiresAt: device.expiresAt,
      statusMessage: hasCredentials ? 'Ativo' : 'Aguardando Lista',
    });
  } catch (error: any) {
    console.error('Error in /api/device/check:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
