import { NextResponse } from 'next/server';

export async function GET() {
  const envKeys = Object.keys(process.env).filter(
    (k) =>
      k.includes('DATABASE') ||
      k.includes('POSTGRES') ||
      k.includes('PRISMA') ||
      k.includes('URL') ||
      k.includes('VERCEL')
  );

  return NextResponse.json({
    status: 'ok',
    environmentKeys: envKeys,
    hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
    hasPostgresUrl: Boolean(process.env.POSTGRES_URL),
    hasPostgresPrismaUrl: Boolean(process.env.POSTGRES_PRISMA_URL),
  });
}
