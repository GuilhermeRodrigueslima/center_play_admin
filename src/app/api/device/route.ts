import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Listar todos os dispositivos cadastrados / detectados
export async function GET() {
  try {
    const devices = await prisma.device.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
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

    const device = await prisma.device.upsert({
      where: { macAddress: cleanMac },
      update: {
        name: name || undefined,
        xtreamUrl: xtreamUrl || undefined,
        username: username || undefined,
        password: password || undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || undefined,
      },
      create: {
        macAddress: cleanMac,
        deviceKey: deviceKey || Math.floor(100000 + Math.random() * 900000).toString(),
        name: name || 'Dispositivo TV',
        xtreamUrl: xtreamUrl || '',
        username: username || '',
        password: password || '',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || '',
      },
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error('Error saving device:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
