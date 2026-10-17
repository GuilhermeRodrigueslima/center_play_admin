import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminSession, sessionCookieName, sessionCookieOptions, checkAdminPassword } from '@/lib/admin-session';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = typeof body.password === 'string' ? body.password : '';

    if (!password) {
      return NextResponse.json({ error: 'Informe a senha mestra.' }, { status: 400 });
    }

    const isValid = await checkAdminPassword(password);

    if (isValid) {
      const cookieStore = await cookies();
      const sessionToken = await createAdminSession();
      const cookieOpts = sessionCookieOptions();

      // Salva ambos os cookies para máxima robustez e compatibilidade
      cookieStore.set(sessionCookieName, sessionToken, cookieOpts);
      cookieStore.set('admin_token', password.trim(), cookieOpts);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  } catch (error) {
    console.error('Erro no login admin:', error);
    return NextResponse.json({ error: 'Erro interno ao autenticar' }, { status: 500 });
  }
}