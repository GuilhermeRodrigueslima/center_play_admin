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

    if (devices.length > 0) {
      return NextResponse.json({
        xtreamUrl: devices[0].xtreamUrl,
        expiresAt: devices[0].expiresAt,
      });
    }

    // 3. Fallback para AppSettings
    const settings = await sql`
      SELECT * FROM "AppSettings" LIMIT 1
    `;

    if (settings.length > 0 && settings[0].xtreamUrl) {
      return NextResponse.json({
        xtreamUrl: settings[0].xtreamUrl,
      });
    }

    return NextResponse.json({ xtreamUrl: 'http://observacaoonline.pro' });
  } catch (error: any) {
    console.error('Error in /api/auth/app:', error);
    return NextResponse.json({ xtreamUrl: 'http://observacaoonline.pro' });
  }
}
