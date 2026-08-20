import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(clients);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, name, xtreamUrl, isActive, expiresAt, notes } = body;

    if (!username || !password || !xtreamUrl) {
      return NextResponse.json({ error: 'username, password and xtreamUrl are required' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        username,
        password,
        name: name || null,
        xtreamUrl,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error creating client';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
