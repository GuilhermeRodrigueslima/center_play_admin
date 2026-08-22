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

// Retornar lista dos filmes e series mais assistidos
export async function GET(req: Request) {
  try {
    await ensureContentViewTable();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let trending;
    if (type) {
      trending = await sql`
        SELECT * FROM "ContentView"
        WHERE "type" = ${type}
        ORDER BY "viewCount" DESC, "lastViewedAt" DESC
        LIMIT ${limit}
      `;
    } else {
      trending = await sql`
        SELECT * FROM "ContentView"
        ORDER BY "viewCount" DESC, "lastViewedAt" DESC
        LIMIT ${limit}
      `;
    }

    return NextResponse.json(trending);
  } catch (error: any) {
    console.error('Error fetching trending content:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
