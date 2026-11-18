import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import { ensureResellerSchema } from '@/lib/reseller-schema';
import {
  createAdminSession,
  sessionCookieName,
  sessionCookieOptions,
  checkAdminPassword,
  isAdminAuthConfigured,
} from '@/lib/admin-session';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password.trim() : '';

    if (!password) {
      return NextResponse.json({ error: 'Informe a senha.' }, { status: 400 });
    }

    if (!isAdminAuthConfigured()) {
      return NextResponse.json({ error: 'Autenticação do painel não está configurada no ambiente de produção.' }, { status: 503 });
    }

    let role: 'master' | 'reseller' = 'master';
    let resellerId: string | undefined;
    let isValid = !username && await checkAdminPassword(password);

    if (!isValid && !username) {
      const adminRows = await sql`
        SELECT "id"
        FROM "AdminUser"
        WHERE "password" = ${password}
        LIMIT 1
      `;
      isValid = adminRows.length > 0;
    }

    if (!isValid && username) {
      await ensureResellerSchema();
      const rows = await sql`
        SELECT "id", "isActive"
        FROM "Reseller"
        WHERE "username" = ${username} AND "password" = ${password}
        LIMIT 1
      `;
      if (rows[0]?.isActive) {
        isValid = true;
        role = 'reseller';
        resellerId = String(rows[0].id);
      }
    }

    if (isValid) {
      const cookieStore = await cookies();
      const sessionToken = await createAdminSession({ role, resellerId });
      const cookieOpts = sessionCookieOptions();

      cookieStore.set(sessionCookieName, sessionToken, cookieOpts);

      return NextResponse.json({ success: true, role });
    }

    return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 });
  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json({ error: 'Erro interno ao autenticar' }, { status: 500 });
  }
}
