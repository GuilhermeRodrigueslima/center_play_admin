import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getPanelSession } from '@/lib/admin-session';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getPanelSession();
  if (!session || session.role !== 'master') return NextResponse.json({ error: 'Acesso restrito ao master' }, { status: 403 });
  const { id } = await params;
  const { isActive, password, name, notes } = await req.json();
  const rows = await sql`
    UPDATE "Reseller" SET
      "isActive" = COALESCE(${isActive}, "isActive"),
      "password" = COALESCE(${password || null}, "password"),
      "name" = COALESCE(${name ?? null}, "name"),
      "notes" = COALESCE(${notes ?? null}, "notes"),
      "updatedAt" = NOW()
    WHERE "id" = ${id}
    RETURNING "id", "username", "name", "isActive", "notes", "createdAt"
  `;
  if (!rows[0]) return NextResponse.json({ error: 'Revendedor não encontrado' }, { status: 404 });
  return NextResponse.json(rows[0]);
}
