import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Proteger todas as rotas /admin, exceto /admin/login
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    const adminToken = request.cookies.get('admin_token')?.value;
    
    // Na Vercel, defina a variavel de ambiente ADMIN_PASSWORD
    // Se bater com a senha salva no cookie (forma simples), permite acesso.
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (adminToken !== expectedPassword) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};