import { NextResponse } from 'next/server';
import { authenticateOrRegisterDevice } from '@/lib/device-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { macAddress, deviceKey, legacyDeviceKey, name } = body as {
      macAddress: string;
      deviceKey: string;
      legacyDeviceKey?: string;
      name?: string;
    };

    const device = await authenticateOrRegisterDevice({ macAddress, deviceKey, legacyDeviceKey, name });
    if (!device) {
      return NextResponse.json({ error: 'Invalid device credentials' }, { status: 401 });
    }
    const isConfigured = Boolean(
      device.xtreamUrl &&
      device.username &&
      device.password &&
      String(device.xtreamUrl).trim().length > 0 &&
      String(device.username).trim().length > 0 &&
      String(device.password).trim().length > 0
    );

    return NextResponse.json({
      activated: isConfigured && device.isActive,
      macAddress: device.macAddress,
      deviceKey: device.deviceKey,
      xtreamUrl: device.xtreamUrl || null,
      username: device.username || null,
      password: device.password || null,
      name: device.name || null,
      expiresAt: device.expiresAt || null,
      isActive: device.isActive,
    });
  } catch (error: any) {
    console.error('Error in /api/device/register:', error);
    return NextResponse.json({ error: error?.message || 'Database error' }, { status: 500 });
  }
}
