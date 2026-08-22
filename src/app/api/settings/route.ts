import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const settings = await sql`SELECT * FROM "AppSettings" LIMIT 1`;
    if (settings.length === 0) {
      return NextResponse.json({ xtreamUrl: 'http://observacaoonline.pro', globalMessage: null });
    }
    return NextResponse.json({
      xtreamUrl: settings[0].xtreamUrl || 'http://observacaoonline.pro',
      globalMessage: settings[0].globalMessage,
    });
  } catch (error: any) {
    return NextResponse.json({ xtreamUrl: 'http://observacaoonline.pro', globalMessage: null });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { xtreamUrl, globalMessage } = body;
    const cleanUrl = (xtreamUrl || 'http://observacaoonline.pro').trim();

    const existing = await sql`SELECT * FROM "AppSettings" LIMIT 1`;
    let result: any;

    if (existing.length > 0) {
      const updated = await sql`
        UPDATE "AppSettings"
        SET
          "xtreamUrl" = ${cleanUrl},
          "globalMessage" = ${globalMessage || null},
          "updatedAt" = NOW()
        WHERE "id" = ${existing[0].id}
        RETURNING *
      `;
      result = updated[0];
    } else {
      const generatedId = 'set_' + Math.random().toString(36).substring(2, 12);
      const inserted = await sql`
        INSERT INTO "AppSettings" ("id", "xtreamUrl", "globalMessage", "updatedAt")
        VALUES (${generatedId}, ${cleanUrl}, ${globalMessage || null}, NOW())
        RETURNING *
      `;
      result = inserted[0];
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
