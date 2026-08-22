import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { macAddress, ping } = await req.json();

    if (!macAddress) {
      return NextResponse.json({ error: 'MAC Address é obrigatório' }, { status: 400 });
    }

    // Busca o dispositivo pelo MAC
    const device = await prisma.device.findUnique({
      where: { macAddress },
    });

    if (!device) {
      return NextResponse.json({ error: 'Dispositivo não encontrado' }, { status: 404 });
    }

    // Atualiza o lastSeenAt do dispositivo
    await prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    // Busca sessão ativa ou cria uma nova
    let session = await prisma.deviceSession.findFirst({
      where: {
        deviceId: device.id,
        status: 'online',
        lastPingAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // Considera online se pingou nos últimos 5 min
        },
      },
    });

    if (session) {
      await prisma.deviceSession.update({
        where: { id: session.id },
        data: {
          ping: ping || session.ping,
          lastPingAt: new Date(),
        },
      });
    } else {
      session = await prisma.deviceSession.create({
        data: {
          deviceId: device.id,
          ping: ping || 0,
          status: 'online',
        },
      });
    }

    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (error) {
    console.error('Erro na telemetria:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Retorna todos os usuários online (ping nos últimos 2 minutos)
    const onlineThreshold = new Date(Date.now() - 2 * 60 * 1000);
    const onlineSessions = await prisma.deviceSession.findMany({
      where: {
        lastPingAt: { gte: onlineThreshold },
        status: 'online',
      },
      include: {
        device: true,
      },
    });

    return NextResponse.json(onlineSessions);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar sessões' }, { status: 500 });
  }
}
