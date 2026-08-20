import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids, xtreamUrl } = body as { ids: string[]; xtreamUrl: string };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }
    if (!xtreamUrl) {
      return NextResponse.json({ error: 'xtreamUrl is required' }, { status: 400 });
    }

    const result = await prisma.client.updateMany({
      where: { id: { in: ids } },
      data: { xtreamUrl },
    });

    return NextResponse.json({ updated: result.count });
  } catch {
    return NextResponse.json({ error: 'Error bulk updating' }, { status: 500 });
  }
}
