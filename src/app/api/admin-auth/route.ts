import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminSession, sessionCookieName, sessionCookieOptions } from '@/lib/admin-session';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword) {
      return NextResponse.json({ error: 'Admin authentication is not configured' }, { status: 503 });
    }

    if (password === expectedPassword) {
      const cookieStore = await cookies();
      cookieStore.set(sessionCookieName, await createAdminSession(), sessionCookieOptions());
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}