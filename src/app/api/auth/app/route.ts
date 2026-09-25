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

    // 1. Procura primeiro na tabela Client
    const clients = await sql`
      SELECT * FROM "Client"
      WHERE "username" = ${cleanUser} AND "password" = ${cleanPass} AND "isActive" = true
      LIMIT 1
    `;

    if (clients.length > 0) {
      return NextResponse.json({
        xtreamUrl: clients[0].xtreamUrl,
        expiresAt: clients[0].expiresAt,
      });
    }

    // 2. Procura na tabela Device
    const devices = await sql`
      SELECT * FROM "Device"
      WHERE "username" = ${cleanUser} AND "password" = ${cleanPass} AND "isActive" = true
      LIMIT 1
    `;

    if (devices.length > 0 && devices[0].xtreamUrl) {
      return NextResponse.json({
        xtreamUrl: devices[0].xtreamUrl,
        expiresAt: devices[0].expiresAt,
      });
    }

    // 3. Se não achou, pega TODAS as URLs cadastradas no painel (distintas)
    const allUrls = await sql`
      SELECT DISTINCT "xtreamUrl" FROM (
        SELECT "xtreamUrl" FROM "Client" WHERE "xtreamUrl" IS NOT NULL
        UNION
        SELECT "xtreamUrl" FROM "Device" WHERE "xtreamUrl" IS NOT NULL
        UNION
        SELECT "xtreamUrl" FROM "AppSettings" WHERE "xtreamUrl" IS NOT NULL
      ) as urls
    `;

    const uniqueUrls = allUrls.map((r: any) => r.xtreamUrl).filter((u: string) => u && u.startsWith('http'));

    if (uniqueUrls.length === 0) {
       return NextResponse.json({ error: 'No URLs configured' }, { status: 404 });
    }

    // 4. Faz um teste iterativo para descobrir qual URL aceita este user/pass
    let validUrl = null;
    let expDateObj = null;

    for (const url of uniqueUrls) {
      try {
        const testUrl = `${url}/player_api.php?username=${encodeURIComponent(cleanUser)}&password=${encodeURIComponent(cleanPass)}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 sec timeout por URL

        const res = await fetch(testUrl, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data && data.user_info && data.user_info.auth !== 0) {
            validUrl = url;
            if (data.user_info.exp_date) {
               const expSecs = parseInt(data.user_info.exp_date, 10);
               if (!isNaN(expSecs) && expSecs > 0) {
                 expDateObj = new Date(expSecs * 1000);
               }
            }
            break;
          }
        }
      } catch (err) {
        // ignora se falhar nesta URL, tenta a proxima
      }
    }

    // 5. Se achou a URL válida, salva na tabela Client para futuro e retorna
    if (validUrl) {
      const existing = await sql`SELECT id FROM "Client" WHERE "username" = ${cleanUser} LIMIT 1`;
      
      if (existing.length > 0) {
         await sql`
           UPDATE "Client" 
           SET "password" = ${cleanPass}, "xtreamUrl" = ${validUrl}, "expiresAt" = ${expDateObj}, "updatedAt" = NOW()
           WHERE id = ${existing[0].id}
         `;
      } else {
         // Precisa usar prisma-cuid compatível ou gen_random_uuid se o id for suportado como string
         await sql`
           INSERT INTO "Client" ("id", "username", "password", "xtreamUrl", "isActive", "expiresAt", "updatedAt")
           VALUES (gen_random_uuid()::text, ${cleanUser}, ${cleanPass}, ${validUrl}, true, ${expDateObj}, NOW())
         `;
      }

      return NextResponse.json({
        xtreamUrl: validUrl,
        expiresAt: expDateObj,
      });
    }

    // 6. Se nenhuma validou, retorna erro
    return NextResponse.json({ error: 'User not found in any known Xtream server' }, { status: 401 });

  } catch (error: any) {
    console.error('Error in /api/auth/app:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
