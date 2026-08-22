import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

async function ensureSettingsColumns() {
  try {
    await sql`
      ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS "backupUrls" TEXT;
    `;
    await sql`
      ALTER TABLE "AppSettings" ADD COLUMN IF NOT EXISTS "globalMessage" TEXT;
    `;
  } catch (_) {}
}

export async function GET() {
  try {
    await ensureSettingsColumns();
    const settings = await sql`SELECT * FROM "AppSettings" LIMIT 1`;
    if (settings.length === 0) {
      return NextResponse.json({
        xtreamUrl: 'http://observacaoonline.pro',
        backupUrls: '',
        globalMessage: null,
      });
    }
    return NextResponse.json({
      xtreamUrl: settings[0].xtreamUrl || 'http://observacaoonline.pro',
      backupUrls: settings[0].backupUrls || '',
      globalMessage: settings[0].globalMessage || null,
    });
  } catch (error: any) {
    return NextResponse.json({
      xtreamUrl: 'http://observacaoonline.pro',
      backupUrls: '',
      globalMessage: null,
    });
  }
}

export async function POST(req: Request) {
  try {
    await ensureSettingsColumns();
    const body = await req.json();
    const { xtreamUrl, backupUrls, globalMessage } = body;
    const cleanUrl = (xtreamUrl || 'http://observacaoonline.pro').trim();
    const cleanBackup = (backupUrls || '').trim();

    const existing = await sql`SELECT * FROM "AppSettings" LIMIT 1`;
    let result: any;

    if (existing.length > 0) {
      const updated = await sql`
        UPDATE "AppSettings"
        SET
          "xtreamUrl" = ${cleanUrl},
          "backupUrls" = ${cleanBackup},
          "globalMessage" = ${globalMessage || null},
          "updatedAt" = NOW()
        WHERE "id" = ${existing[0].id}
        RETURNING *
      `;
      result = updated[0];
    } else {
      const generatedId = 'set_' + Math.random().toString(36).substring(2, 12);
      const inserted = await sql`
        INSERT INTO "AppSettings" ("id", "xtreamUrl", "backupUrls", "globalMessage", "updatedAt")
        VALUES (${generatedId}, ${cleanUrl}, ${cleanBackup}, ${globalMessage || null}, NOW())
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
