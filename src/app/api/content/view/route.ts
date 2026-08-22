import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

async function ensureContentViewTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS "ContentView" (
      "id" TEXT PRIMARY KEY,
      "contentId" TEXT UNIQUE NOT NULL,
      "title" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "posterUrl" TEXT,
      "viewCount" INTEGER NOT NULL DEFAULT 1,
      "lastViewedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

// Registrar visualizacao de filme ou serie
export async function POST(req: Request) {
  try {
    await ensureContentViewTable();
    const body = await req.json();
    const { contentId, title, type, posterUrl } = body;

    if (!contentId || !title) {
      return NextResponse.json({ error: 'contentId and title are required' }, { status: 400 });
    }

    const cId = String(contentId).trim();
    const cType = (type || 'vod').trim();
    const cTitle = String(title).trim();
    const cPoster = (posterUrl || '').trim();
    const generatedId = 'cv_' + Math.random().toString(36).substring(2, 12);

    await sql`
      INSERT INTO "ContentView" ("id", "contentId", "title", "type", "posterUrl", "viewCount", "lastViewedAt")
      VALUES (${generatedId}, ${cId}, ${cTitle}, ${cType}, ${cPoster}, 1, NOW())
      ON CONFLICT ("contentId") DO UPDATE SET
        "title" = EXCLUDED."title",
        "posterUrl" = COALESCE(EXCLUDED."posterUrl", "ContentView"."posterUrl"),
        "viewCount" = "ContentView"."viewCount" + 1,
        "lastViewedAt" = NOW()
    `;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error logging content view:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
