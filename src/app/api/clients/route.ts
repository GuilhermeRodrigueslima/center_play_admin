import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const clients = await sql`
      SELECT * FROM "Client" ORDER BY "createdAt" DESC
    `;
    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, name, xtreamUrl, expiresAt, notes } = body;

    if (!username || !password || !xtreamUrl) {
      return NextResponse.json({ error: 'username, password, and xtreamUrl are required' }, { status: 400 });
    }

    const generatedId = 'cli_' + Math.random().toString(36).substring(2, 12);
    const expDate = expiresAt ? new Date(expiresAt).toISOString() : null;

    const inserted = await sql`
      INSERT INTO "Client" (
        "id", "username", "password", "name", "xtreamUrl", "expiresAt", "notes", "isActive", "createdAt", "updatedAt"
      ) VALUES (
        ${generatedId}, ${username.trim()}, ${password.trim()}, ${name || null}, ${xtreamUrl.trim()}, ${expDate}, ${notes || null}, true, NOW(), NOW()
      )
      ON CONFLICT ("username") DO UPDATE SET
        "password" = EXCLUDED."password",
        "name" = EXCLUDED."name",
        "xtreamUrl" = EXCLUDED."xtreamUrl",
        "expiresAt" = EXCLUDED."expiresAt",
        "notes" = EXCLUDED."notes",
        "updatedAt" = NOW()
      RETURNING *
    `;

    return NextResponse.json(inserted[0]);
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
