import { NextResponse } from 'next/server';
import { getPanelSession } from '@/lib/admin-session';

export async function GET() {
  const session = await getPanelSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(session);
}
