import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body as { username: string; password: string };

    if (!username || !password) {
      return NextResponse.json({ error: 'username and password are required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { username } });

    if (!client) {
      // Cliente nao cadastrado: usa a URL global do painel como fallback.
      // Assim o app funciona mesmo sem cadastrar clientes (autenticacao
      // direta no servidor Xtream com as credenciais digitadas).
      const settings = await prisma.appSettings.findFirst();
      const globalUrl = settings?.xtreamUrl?.trim();
      return NextResponse.json({
        xtreamUrl: globalUrl || '',
        globalMessage: settings?.globalMessage || null,
        fallback: !globalUrl,
      }, { status: 404 });
    }

    if (client.password !== password) {
      return NextResponse.json({ error: 'Usuario ou senha invalidos' }, { status: 403 });
    }

    if (!client.isActive) {
      return NextResponse.json({ error: 'Account is inactive' }, { status: 403 });
    }

    if (client.expiresAt && new Date(client.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Account has expired' }, { status: 403 });
    }

    return NextResponse.json({ xtreamUrl: client.xtreamUrl });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
