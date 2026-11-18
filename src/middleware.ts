import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isRequestAuthenticated } from '@/lib/admin-session';

export async function middleware(request: NextRequest) {
  // Proteger todas as rotas /admin, exceto /admin/login
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    const sessionToken = request.cookies.get('center_play_admin_session')?.value;
    const authenticated = await isRequestAuthenticated(sessionToken);
    if (!authenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
