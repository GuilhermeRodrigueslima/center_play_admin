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

    const device = await prisma.device.findUnique({
      where: { macAddress: cleanMac },
    });

    if (!device) {
      return NextResponse.json({
        activated: false,
        error: 'Dispositivo ainda não registrado.',
      }, { status: 404 });
    }

    // Atualiza o timestamp de visualizacao
    await prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    if (!device.isActive) {
      return NextResponse.json({
        activated: false,
        error: 'Dispositivo inativo ou bloqueado pelo administrador.',
      }, { status: 403 });
    }

    if (device.expiresAt && new Date(device.expiresAt) < new Date()) {
      return NextResponse.json({
        activated: false,
        error: 'Assinatura expirada. Contate o suporte para renovar.',
      }, { status: 403 });
    }

    const isConfigured = Boolean(device.xtreamUrl && device.username && device.password);

    return NextResponse.json({
      activated: isConfigured,
      macAddress: device.macAddress,
      deviceKey: device.deviceKey,
      xtreamUrl: device.xtreamUrl,
      username: device.username,
      password: device.password,
      name: device.name,
      expiresAt: device.expiresAt,
    });
  } catch (error) {
    console.error('Error in /api/device/check:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
