import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

    let device = await prisma.device.findUnique({
      where: { macAddress: cleanMac },
    });

    if (!device) {
      device = await prisma.device.create({
        data: {
          macAddress: cleanMac,
          deviceKey: deviceKey || Math.floor(100000 + Math.random() * 900000).toString(),
          name: 'Smart TV / TV Box',
          isActive: true,
        },
      });
    } else {
      await prisma.device.update({
        where: { id: device.id },
        data: {
          lastSeenAt: new Date(),
          deviceKey: deviceKey || device.deviceKey,
        },
      });
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
        error: 'Assinatura expirada. Contate o suporte.',
      });
    }

    const isConfigured = Boolean(
      device.xtreamUrl &&
      device.username &&
      device.password &&
      device.xtreamUrl.trim().length > 0 &&
      device.username.trim().length > 0 &&
      device.password.trim().length > 0
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
    return NextResponse.json({ 
      error: error?.message || 'Database error',
      name: error?.name,
      code: error?.code,
    }, { status: 500 });
  }
}
