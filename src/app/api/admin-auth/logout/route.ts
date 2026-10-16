import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessionCookieName, sessionCookieOptions } from '@/lib/admin-session';

export async function POST() {
  (await cookies()).set(sessionCookieName, '', { ...sessionCookieOptions(), maxAge: 0 });
  return NextResponse.json({ success: true });
}