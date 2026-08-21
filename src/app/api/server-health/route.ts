import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL inválida' }, { status: 400 });
    }

    const cleanUrl = url.trim().replace(/\/$/, '');
    const testEndpoint = `${cleanUrl}/player_api.php`;

    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(testEndpoint, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - startTime;

      let statusCategory: 'excellent' | 'good' | 'slow' | 'down' = 'good';
      if (latencyMs < 150) statusCategory = 'excellent';
      else if (latencyMs < 400) statusCategory = 'good';
      else statusCategory = 'slow';

      return NextResponse.json({
        online: response.status < 500,
        statusCode: response.status,
        latencyMs,
        statusCategory,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startTime;
      return NextResponse.json({
        online: false,
        statusCode: 0,
        latencyMs: latencyMs >= 6000 ? 6000 : latencyMs,
        statusCategory: 'down',
        error: err.name === 'AbortError' ? 'Tempo limite esgotado (Timeout > 6s)' : 'Falha na conexão',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao testar latência' }, { status: 500 });
  }
}
