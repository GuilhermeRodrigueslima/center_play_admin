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

    // Consulta exclusivamente acessos cadastrados pelo administrador. O painel
    // não deve tentar credenciais recebidas contra uma lista de servidores.
    const clients = await sql`
      SELECT * FROM "Client"
      WHERE "username" = ${cleanUser} AND "password" = ${cleanPass} AND "isActive" = true
        AND ("expiresAt" IS NULL OR "expiresAt" >= NOW())
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
        AND ("expiresAt" IS NULL OR "expiresAt" >= NOW())
      LIMIT 1
    `;

    if (devices.length > 0 && devices[0].xtreamUrl) {
      return NextResponse.json({
        xtreamUrl: devices[0].xtreamUrl,
        expiresAt: devices[0].expiresAt,
      });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  } catch (error: any) {
    console.error('Error in /api/auth/app:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
