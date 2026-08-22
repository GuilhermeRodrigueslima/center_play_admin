import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Listar todos os dispositivos cadastrados / detectados
export async function GET() {
  try {
    const devices = await prisma.device.findMany({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(devices);
  } catch (error: any) {
    console.error('Error fetching devices:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error', stack: error?.stack }, { status: 500 });
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
    const safeKey = deviceKey || Math.floor(100000 + Math.random() * 900000).toString();

    const device = await prisma.device.upsert({
      where: { macAddress: cleanMac },
      update: {
        name: name !== undefined ? name : undefined,
        xtreamUrl: xtreamUrl !== undefined ? xtreamUrl : undefined,
        username: username !== undefined ? username : undefined,
        password: password !== undefined ? password : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes !== undefined ? notes : undefined,
        isActive: true,
      },
      create: {
        macAddress: cleanMac,
        deviceKey: safeKey,
        name: name || 'Smart TV / TV Box',
        xtreamUrl: xtreamUrl || '',
        username: username || '',
        password: password || '',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || '',
        isActive: true,
      },
    });

    return NextResponse.json(device);
  } catch (error: any) {
    console.error('Error saving device:', error);
    return NextResponse.json({ error: error?.message || 'Unknown error', stack: error?.stack }, { status: 500 });
  }
}
