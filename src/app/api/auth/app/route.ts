import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();

    // 1. Procura na tabela Client (acesso cadastrado manualmente pelo admin)
    const clients = await sql`
      SELECT * FROM "Client"
      WHERE "username" = ${cleanUser} AND "password" = ${cleanPass} AND "isActive" = true
        AND ("expiresAt" IS NULL OR "expiresAt" >= NOW())
      LIMIT 1
    `;

    if (clients.length > 0) {
      return NextResponse.json({
        xtreamUrl: clients[0].xtreamUrl,
        expiresAt: clients[0].expiresAt ?? null,
      });
    }

    // 2. Procura na tabela Device
    const devices = await sql`
      SELECT * FROM "Device"
      WHERE "username" = ${cleanUser} AND "password" = ${cleanPass} AND "isActive" = true
        AND ("expiresAt" IS NULL OR "expiresAt" >= NOW())
      LIMIT 1
    `;

    if (devices.length > 0 && devices[0].xtreamUrl) {
      return NextResponse.json({
        xtreamUrl: devices[0].xtreamUrl,
        expiresAt: devices[0].expiresAt ?? null,
      });
    }

    // 3. Não encontrado pelo admin — tenta todos os servidores configurados nas Settings
    const settings = await sql`SELECT "xtreamUrl", "backupUrls" FROM "AppSettings" LIMIT 1`;
    if (settings.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Coleta: servidor principal + backups (separados por vírgula)
    const mainUrl: string = (settings[0].xtreamUrl || '').trim();
    const backupRaw: string = (settings[0].backupUrls || '').trim();
    const backupList: string[] = backupRaw
      .split(',')
      .map((u: string) => u.trim())
      .filter((u: string) => u.length > 0 && u !== mainUrl);

    const candidates: string[] = [mainUrl, ...backupList].filter(
      (u: string) => u.startsWith('http')
    );

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 4. Testa cada servidor em sequência com credenciais do usuário
    for (const serverUrl of candidates) {
      try {
        const testUrl = `${serverUrl}/player_api.php?username=${encodeURIComponent(cleanUser)}&password=${encodeURIComponent(cleanPass)}`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(testUrl, { signal: controller.signal });
        clearTimeout(timeout);

        if (!res.ok) continue;

        const data = await res.json().catch(() => null);
        if (!data || !data.user_info || data.user_info.auth === 0) continue;

        // Servidor válido encontrado! Extrai data de expiração do Xtream
        let expiresAt: string | null = null;
        const expRaw = data.user_info?.exp_date;
        if (expRaw) {
          const expSecs = parseInt(String(expRaw), 10);
          if (!isNaN(expSecs) && expSecs > 0) {
            expiresAt = new Date(expSecs * 1000).toISOString();
          }
        }

        // 5. Salva o acesso automaticamente para o próximo login
        const existing = await sql`SELECT id FROM "Client" WHERE "username" = ${cleanUser} LIMIT 1`;
        if (existing.length > 0) {
          await sql`
            UPDATE "Client"
            SET "password" = ${cleanPass},
                "xtreamUrl" = ${serverUrl},
                "expiresAt" = ${expiresAt ? new Date(expiresAt) : null},
                "updatedAt" = NOW()
            WHERE "username" = ${cleanUser}
          `;
        } else {
          const newId = 'auto_' + Math.random().toString(36).slice(2, 14);
          await sql`
            INSERT INTO "Client" ("id", "username", "password", "xtreamUrl", "isActive", "expiresAt", "updatedAt")
            VALUES (${newId}, ${cleanUser}, ${cleanPass}, ${serverUrl}, true, ${expiresAt ? new Date(expiresAt) : null}, NOW())
          `;
        }

        return NextResponse.json({
          xtreamUrl: serverUrl,
          expiresAt,
        });
      } catch {
        // Tenta próximo servidor
        continue;
      }
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  } catch (error: unknown) {
    console.error('Error in /api/auth/app:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
