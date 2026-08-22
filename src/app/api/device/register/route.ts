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

    if (!macAddress) {
      return NextResponse.json({ error: 'macAddress is required' }, { status: 400 });
    }

    const cleanMac = macAddress.toUpperCase().trim();
    const safeKey = deviceKey || Math.floor(100000 + Math.random() * 900000).toString();

    // Upsert o dispositivo para manter registrado e atualizado
    const device = await prisma.device.upsert({
      where: { macAddress: cleanMac },
      update: {
        deviceKey: safeKey,
        lastSeenAt: new Date(),
      },
      create: {
        macAddress: cleanMac,
        deviceKey: safeKey,
        name: name || 'Smart TV / TV Box',
        isActive: true,
      },
    });

    const isConfigured = Boolean(
      device.xtreamUrl &&
      device.username &&
      device.password &&
      device.xtreamUrl.trim().length > 0 &&
      device.username.trim().length > 0 &&
      device.password.trim().length > 0
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
  } catch (error) {
    console.error('Error in /api/device/register:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
