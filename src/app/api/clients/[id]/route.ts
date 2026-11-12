import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getPanelSession } from '@/lib/admin-session';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPanelSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const { username, password, name, xtreamUrl, isActive, expiresAt, notes } = body;
    const expDate = expiresAt ? new Date(expiresAt).toISOString() : null;
    const updated = session.role === 'master'
      ? await sql`UPDATE "Client" SET "username" = COALESCE(${username}, "username"), "password" = COALESCE(${password}, "password"), "name" = COALESCE(${name}, "name"), "xtreamUrl" = COALESCE(${xtreamUrl}, "xtreamUrl"), "isActive" = COALESCE(${isActive}, "isActive"), "expiresAt" = ${expDate}, "notes" = COALESCE(${notes}, "notes"), "updatedAt" = NOW() WHERE "id" = ${id} RETURNING *`
      : await sql`UPDATE "Client" SET "username" = COALESCE(${username}, "username"), "password" = COALESCE(${password}, "password"), "name" = COALESCE(${name}, "name"), "xtreamUrl" = COALESCE(${xtreamUrl}, "xtreamUrl"), "isActive" = COALESCE(${isActive}, "isActive"), "expiresAt" = ${expDate}, "notes" = COALESCE(${notes}, "notes"), "updatedAt" = NOW() WHERE "id" = ${id} AND "resellerId" = ${session.resellerId ?? ''} RETURNING *`;
    if (!updated[0]) return NextResponse.json({ error: 'Cliente não encontrado neste acesso' }, { status: 404 });
    return NextResponse.json(updated[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPanelSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const { id } = await params;
    const deleted = session.role === 'master'
      ? await sql`DELETE FROM "Client" WHERE "id" = ${id} RETURNING "id"`
      : await sql`DELETE FROM "Client" WHERE "id" = ${id} AND "resellerId" = ${session.resellerId ?? ''} RETURNING "id"`;
    if (!deleted[0]) return NextResponse.json({ error: 'Cliente não encontrado neste acesso' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
