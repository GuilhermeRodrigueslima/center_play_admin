import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminSession, sessionCookieName, sessionCookieOptions } from '@/lib/admin-session';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (password === expectedPassword) {
      const cookieStore = await cookies();
      cookieStore.set(sessionCookieName, await createAdminSession(), sessionCookieOptions());
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao autenticar' }, { status: 500 });
  }
}