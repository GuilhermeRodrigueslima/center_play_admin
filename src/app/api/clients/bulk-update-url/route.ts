import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getPanelSession } from '@/lib/admin-session';

export async function POST(req: Request) {
  const session = await getPanelSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { ids, xtreamUrl } = body as { ids: string[]; xtreamUrl: string };
    if (!Array.isArray(ids) || ids.length === 0 || !xtreamUrl) return NextResponse.json({ error: 'ids and xtreamUrl are required' }, { status: 400 });
    let count = 0;
    for (const id of ids) {
      const result = session.role === 'master'
        ? await sql`UPDATE "Client" SET "xtreamUrl" = ${xtreamUrl.trim()}, "updatedAt" = NOW() WHERE "id" = ${id} RETURNING "id"`
        : await sql`UPDATE "Client" SET "xtreamUrl" = ${xtreamUrl.trim()}, "updatedAt" = NOW() WHERE "id" = ${id} AND "resellerId" = ${session.resellerId ?? ''} RETURNING "id"`;
      count += (result as unknown[]).length ?? 0;
    }
    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
