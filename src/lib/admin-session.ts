import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const sessionCookieName = 'center_play_admin_session';
const encoder = new TextEncoder();
const sessionLifetimeSeconds = 60 * 60 * 24 * 30; // 30 dias

function toBase64Url(value: Uint8Array | string) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const remainder = normalized.length % 4;
  const padded = remainder === 0 ? normalized : normalized + '='.repeat(4 - remainder);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
  if (secret && secret.length >= 32) {
    return secret;
  }
  if (secret && secret.length > 0) {
    return (secret + '-center-play-admin-secret-padding-32').slice(0, 32);
  }
  return 'center-play-admin-default-secret-key-32-chars-ok';
}

async function signingKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(payload: string) {
  const signature = await crypto.subtle.sign('HMAC', await signingKey(), encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

export async function createAdminSession() {
  const payload = toBase64Url(JSON.stringify({ role: 'admin', exp: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds }));
  return `${payload}.${await sign(payload)}`;
}

export async function isValidAdminSession(token?: string) {
  if (!token) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  try {
    const validSignature = await crypto.subtle.verify('HMAC', await signingKey(), fromBase64Url(signature), encoder.encode(payload));
    if (!validSignature) return false;
    const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { role?: string; exp?: number };
    return decoded.role === 'admin' && typeof decoded.exp === 'number' && decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function matchesConfiguredPassword(inputPassword: string): boolean {
  if (!inputPassword) return false;

  const configured = [
    process.env.ADMIN_PASSWORD,
    process.env.ADMIN_PASS,
    process.env.ADMIN_PWD,
    process.env.PASSWORD,
    process.env.ADMIN_KEY,
    process.env.MASTER_PASSWORD,
    process.env.ADMIN_SECRET,
  ].filter(Boolean) as string[];

  // Fallback padrão somente se nenhuma variável estiver configurada
  if (configured.length === 0) {
    configured.push('admin123');
  }

  const cleanInput = inputPassword.trim();

  for (const candidate of configured) {
    const cleanCand = candidate.trim();
    const unquotedCand = cleanCand.replace(/^["']|["']$/g, '');
    if (
      inputPassword === candidate ||
      cleanInput === cleanCand ||
      cleanInput === unquotedCand ||
      inputPassword === unquotedCand
    ) {
      return true;
    }
  }

  return false;
}

export async function checkAdminPassword(password: string): Promise<boolean> {
  // 1. Verifica contra as variáveis de ambiente na Vercel
  if (matchesConfiguredPassword(password)) {
    return true;
  }

  // 2. Verifica se existe tabela AdminUser no banco Neon
  try {
    const prismaModule = await import('@/lib/prisma');
    const prisma = prismaModule.default;
    const clean = password.trim();
    const user = await prisma.adminUser.findFirst({
      where: {
        password: {
          in: [password, clean],
        },
      },
    });
    if (user) return true;
  } catch {
    // Não-fatal caso o banco esteja indisponível
  }

  return false;
}

export async function isRequestAuthenticated(sessionToken?: string, adminToken?: string): Promise<boolean> {
  if (sessionToken) {
    const valid = await isValidAdminSession(sessionToken);
    if (valid) return true;
  }

  if (adminToken && matchesConfiguredPassword(adminToken)) {
    return true;
  }

  return false;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: sessionLifetimeSeconds,
  };
}

export async function requireAdminRequest() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(sessionCookieName)?.value;
  const adminToken = cookieStore.get('admin_token')?.value;

  const valid = await isRequestAuthenticated(sessionToken, adminToken);
  return valid ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export { sessionCookieName };