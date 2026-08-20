import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.client.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const updated = await prisma.client.update({
      where: { id },
      data: {
        username: body.username ?? existing.username,
        password: body.password ?? existing.password,
        name: body.name !== undefined ? body.name : existing.name,
        xtreamUrl: body.xtreamUrl ?? existing.xtreamUrl,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : existing.isActive,
        expiresAt: body.expiresAt !== undefined
          ? (body.expiresAt ? new Date(body.expiresAt) : null)
          : existing.expiresAt,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error updating client';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.client.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Error deleting client' }, { status: 500 });
  }
}
