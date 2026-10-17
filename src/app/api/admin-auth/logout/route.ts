import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionCookieName, sessionCookieOptions } from '@/lib/admin-session';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, '', { ...sessionCookieOptions(), maxAge: 0 });
  cookieStore.set('admin_token', '', { ...sessionCookieOptions(), maxAge: 0 });
  return NextResponse.json({ success: true });
}