import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Garante que a tabela AppRelease existe no Neon PostgreSQL
async function ensureReleaseTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS "AppRelease" (
      "id" TEXT PRIMARY KEY,
      "version" TEXT NOT NULL,
      "versionCode" INTEGER NOT NULL DEFAULT 1,
      "apkUrl" TEXT NOT NULL,
      "changelog" TEXT,
      "isMandatory" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;
}

// Retorna a versao mais recente cadastrada
export async function GET() {
  try {
    await ensureReleaseTable();
    const releases = await sql`
      SELECT * FROM "AppRelease"
      ORDER BY "versionCode" DESC, "createdAt" DESC
      LIMIT 1
    `;

    if (releases.length === 0) {
      return NextResponse.json({
        hasUpdate: false,
        latestVersion: '2.0.0',
        versionCode: 1,
        apkUrl: '',
        changelog: '',
        isMandatory: false,
      });
    }

    const rel = releases[0];
    return NextResponse.json({
      hasUpdate: true,
      id: rel.id,
      latestVersion: rel.version,
      versionCode: rel.versionCode,
      apkUrl: rel.apkUrl,
      changelog: rel.changelog || '',
      isMandatory: rel.isMandatory || false,
      createdAt: rel.createdAt,
    });
  } catch (error: any) {
    console.error('Error fetching latest release:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}

// Cadastrar nova versao do APK
export async function POST(req: Request) {
  try {
    await ensureReleaseTable();
    const body = await req.json();
    const { version, versionCode, apkUrl, changelog, isMandatory } = body;

    if (!version || !apkUrl) {
      return NextResponse.json({ error: 'version and apkUrl are required' }, { status: 400 });
    }

    const generatedId = 'rel_' + Math.random().toString(36).substring(2, 12);
    const vCode = parseInt(versionCode) || 1;

    const inserted = await sql`
      INSERT INTO "AppRelease" (
        "id", "version", "versionCode", "apkUrl", "changelog", "isMandatory", "createdAt"
      ) VALUES (
        ${generatedId}, ${version.trim()}, ${vCode}, ${apkUrl.trim()}, ${changelog || ''}, ${Boolean(isMandatory)}, NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(inserted[0]);
  } catch (error: any) {
    console.error('Error creating app release:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
