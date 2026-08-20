import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { macAddress, deviceKey, name } = body as {
      macAddress: string;
      deviceKey: string;
      name?: string;
    };

    if (!macAddress || !deviceKey) {
      return NextResponse.json({ error: 'macAddress and deviceKey are required' }, { status: 400 });
    }

    const cleanMac = macAddress.toUpperCase().trim();

    // Upsert o dispositivo para manter registrado
    const device = await prisma.device.upsert({
      where: { macAddress: cleanMac },
      update: {
        deviceKey,
        lastSeenAt: new Date(),
      },
      create: {
        macAddress: cleanMac,
        deviceKey,
        name: name || 'Smart TV / TV Box',
      },
    });

    const isConfigured = Boolean(
      device.xtreamUrl && device.username && device.password && device.isActive
    );

    if (device.expiresAt && new Date(device.expiresAt) < new Date()) {
      return NextResponse.json({
        activated: false,
        error: 'Assinatura expirada. Contate o suporte para renovar.',
      });
    }

    if (!device.isActive) {
      return NextResponse.json({
        activated: false,
        error: 'Dispositivo bloqueado ou inativo.',
      });
    }

    return NextResponse.json({
      activated: isConfigured,
      macAddress: device.macAddress,
      deviceKey: device.deviceKey,
      xtreamUrl: device.xtreamUrl || null,
      username: device.username || null,
      password: device.password || null,
      name: device.name || null,
      expiresAt: device.expiresAt || null,
    });
  } catch (error) {
    console.error('Error in /api/device/register:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
