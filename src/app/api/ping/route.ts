import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'pong', version: '2.5', timestamp: new Date().toISOString() });
}
