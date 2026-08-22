import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, xtreamUrl, username, password, isActive, expiresAt, notes } = body;

    const device = await prisma.device.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        xtreamUrl: xtreamUrl !== undefined ? xtreamUrl : undefined,
        username: username !== undefined ? username : undefined,
        password: password !== undefined ? password : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        notes: notes !== undefined ? notes : undefined,
      },
    });

    return NextResponse.json(device);
  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.device.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
