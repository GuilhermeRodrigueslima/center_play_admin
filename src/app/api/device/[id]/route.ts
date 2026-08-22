import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, xtreamUrl, username, password, isActive, expiresAt, notes } = body;
    const expDate = expiresAt ? new Date(expiresAt).toISOString() : null;

    const devices = await sql`
      UPDATE "Device"
      SET
        "name" = COALESCE(${name}, "name"),
        "xtreamUrl" = COALESCE(${xtreamUrl}, "xtreamUrl"),
        "username" = COALESCE(${username}, "username"),
        "password" = COALESCE(${password}, "password"),
        "isActive" = COALESCE(${isActive}, "isActive"),
        "expiresAt" = ${expDate},
        "notes" = COALESCE(${notes}, "notes"),
        "updatedAt" = NOW()
      WHERE "id" = ${id}
      RETURNING *
    `;

    return NextResponse.json(devices[0]);
  } catch (error: any) {
    console.error('Error updating device:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await sql`
      DELETE FROM "Device" WHERE "id" = ${id}
    `;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting device:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
