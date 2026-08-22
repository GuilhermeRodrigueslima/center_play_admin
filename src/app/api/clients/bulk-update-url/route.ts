import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ids, xtreamUrl } = body as { ids: string[]; xtreamUrl: string };

    if (!Array.isArray(ids) || ids.length === 0 || !xtreamUrl) {
      return NextResponse.json({ error: 'ids and xtreamUrl are required' }, { status: 400 });
    }

    for (const id of ids) {
      await sql`
        UPDATE "Client"
        SET "xtreamUrl" = ${xtreamUrl.trim()}, "updatedAt" = NOW()
        WHERE "id" = ${id}
      `;
    }

    return NextResponse.json({ success: true, count: ids.length });
  } catch (error: any) {
    console.error('Error in clients bulk-update-url:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
