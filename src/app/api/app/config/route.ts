import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

/// Configuração pública mínima consumida pelo aplicativo.
/// Não inclui URLs de fontes, credenciais, dispositivos ou dados administrativos.
export async function GET() {
  try {
    const settings = await sql`SELECT "globalMessage" FROM "AppSettings" LIMIT 1`;
    return NextResponse.json({ globalMessage: settings[0]?.globalMessage || null });
  } catch {
    return NextResponse.json({ globalMessage: null });
  }
}