import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { ids, xtreamUrl } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0 || !xtreamUrl) {
      return NextResponse.json({ error: 'IDs array and xtreamUrl are required' }, { status: 400 });
    }

    const updated = await prisma.device.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        xtreamUrl: xtreamUrl.trim(),
      },
    });

    return NextResponse.json({ success: true, count: updated.count });
  } catch (error) {
    console.error('Error bulk updating device URLs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
