import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { username, password, name, xtreamUrl, isActive, expiresAt, notes } = body;
    const expDate = expiresAt ? new Date(expiresAt).toISOString() : null;

    const updated = await sql`
      UPDATE "Client"
      SET
        "username" = COALESCE(${username}, "username"),
        "password" = COALESCE(${password}, "password"),
        "name" = COALESCE(${name}, "name"),
        "xtreamUrl" = COALESCE(${xtreamUrl}, "xtreamUrl"),
        "isActive" = COALESCE(${isActive}, "isActive"),
        "expiresAt" = ${expDate},
        "notes" = COALESCE(${notes}, "notes"),
        "updatedAt" = NOW()
      WHERE "id" = ${id}
      RETURNING *
    `;

    return NextResponse.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await sql`
      DELETE FROM "Client" WHERE "id" = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting client:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
