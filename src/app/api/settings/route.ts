import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.appSettings.findFirst();
    if (!settings) {
      return NextResponse.json({ xtreamUrl: '', globalMessage: null });
    }
    return NextResponse.json({
      xtreamUrl: settings.xtreamUrl,
      globalMessage: settings.globalMessage,
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let settings = await prisma.appSettings.findFirst();

    if (settings) {
      settings = await prisma.appSettings.update({
        where: { id: settings.id },
        data: {
          xtreamUrl: body.xtreamUrl ?? settings.xtreamUrl,
          globalMessage: body.globalMessage !== undefined ? body.globalMessage : settings.globalMessage,
        },
      });
    } else {
      settings = await prisma.appSettings.create({
        data: {
          xtreamUrl: body.xtreamUrl || '',
          globalMessage: body.globalMessage || null,
        },
      });
    }

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: 'Error saving settings' }, { status: 500 });
  }
}
