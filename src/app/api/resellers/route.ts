import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getPanelSession } from '@/lib/admin-session';

export async function GET() {
  const session = await getPanelSession();
  if (!session || session.role !== 'master') return NextResponse.json({ error: 'Acesso restrito ao master' }, { status: 403 });
  const rows = await sql`SELECT "id", "username", "name", "isActive", "notes", "createdAt" FROM "Reseller" ORDER BY "createdAt" DESC`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = await getPanelSession();
  if (!session || session.role !== 'master') return NextResponse.json({ error: 'Acesso restrito ao master' }, { status: 403 });
  try {
    const { username, password, name, notes } = await req.json();
    if (!username || String(username).trim().length < 3 || !password || String(password).length < 6) {
      return NextResponse.json({ error: 'Usuário com 3+ caracteres e senha com 6+ caracteres são obrigatórios' }, { status: 400 });
    }
    const rows = await sql`
      INSERT INTO "Reseller" ("id", "username", "password", "name", "notes", "isActive", "createdAt", "updatedAt")
      VALUES (${crypto.randomUUID()}, ${String(username).trim()}, ${String(password)}, ${name || null}, ${notes || null}, true, NOW(), NOW())
      RETURNING "id", "username", "name", "isActive", "notes", "createdAt"
    `;
    return NextResponse.json(rows[0]);
  } catch (error: any) {
    if (error?.code === '23505') return NextResponse.json({ error: 'Esse usuário de revendedor já existe' }, { status: 409 });
    return NextResponse.json({ error: 'Erro ao criar revendedor' }, { status: 500 });
  }
}
