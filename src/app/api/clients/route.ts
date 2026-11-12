import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getPanelSession } from '@/lib/admin-session';

async function sessionOrUnauthorized() {
  const session = await getPanelSession();
  return session ?? null;
}

export async function GET() {
  const session = await sessionOrUnauthorized();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const clients = session.role === 'master'
      ? await sql`SELECT * FROM "Client" ORDER BY "createdAt" DESC`
      : await sql`SELECT * FROM "Client" WHERE "resellerId" = ${session.resellerId ?? ''} ORDER BY "createdAt" DESC`;
    return NextResponse.json(clients);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await sessionOrUnauthorized();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const body = await req.json();
    const { username, password, name, xtreamUrl, expiresAt, notes } = body;
    if (!username || !password || !xtreamUrl) {
      return NextResponse.json({ error: 'username, password, and xtreamUrl are required' }, { status: 400 });
    }
    const generatedId = 'cli_' + crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    const expDate = expiresAt ? new Date(expiresAt).toISOString() : null;
    const inserted = session.role === 'master'
      ? await sql`
          INSERT INTO "Client" ("id", "username", "password", "name", "xtreamUrl", "expiresAt", "notes", "isActive", "createdAt", "updatedAt")
          VALUES (${generatedId}, ${username.trim()}, ${password.trim()}, ${name || null}, ${xtreamUrl.trim()}, ${expDate}, ${notes || null}, true, NOW(), NOW())
          ON CONFLICT ("username") DO UPDATE SET "password" = EXCLUDED."password", "name" = EXCLUDED."name", "xtreamUrl" = EXCLUDED."xtreamUrl", "expiresAt" = EXCLUDED."expiresAt", "notes" = EXCLUDED."notes", "updatedAt" = NOW()
          RETURNING *`
      : await sql`
          INSERT INTO "Client" ("id", "username", "password", "name", "xtreamUrl", "expiresAt", "notes", "resellerId", "isActive", "createdAt", "updatedAt")
          VALUES (${generatedId}, ${username.trim()}, ${password.trim()}, ${name || null}, ${xtreamUrl.trim()}, ${expDate}, ${notes || null}, ${session.resellerId}, true, NOW(), NOW())
          ON CONFLICT ("username") DO UPDATE SET "password" = EXCLUDED."password", "name" = EXCLUDED."name", "xtreamUrl" = EXCLUDED."xtreamUrl", "expiresAt" = EXCLUDED."expiresAt", "notes" = EXCLUDED."notes", "resellerId" = EXCLUDED."resellerId", "updatedAt" = NOW()
          WHERE "Client"."resellerId" = ${session.resellerId}
          RETURNING *`;
    return NextResponse.json(inserted[0]);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
