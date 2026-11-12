import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const sessionCookieName = 'center_play_admin_session';
const encoder = new TextEncoder();
const sessionLifetimeSeconds = 60 * 60 * 24 * 30;

export type PanelRole = 'master' | 'reseller';
export type PanelSession = { role: PanelRole; resellerId?: string };

function toBase64Url(value: Uint8Array | string) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/\//g, '/');
  const remainder = normalized.length % 4;
  const padded = remainder === 0 ? normalized : normalized + '='.repeat(4 - remainder);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function isAdminAuthConfigured() {
  const password = process.env.ADMIN_PASSWORD?.trim() ?? '';
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() ?? '';
  return password.length >= 8 && secret.length >= 32;
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET?.trim() ?? '';
  if (secret.length < 32) return null;
  return secret;
}

async function signingKey() {
  const secret = getSessionSecret();
  if (!secret) return null;
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

async function sign(payload: string) {
  const key = await signingKey();
  if (!key) throw new Error('ADMIN_SESSION_SECRET ausente ou curto demais');
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return toBase64Url(new Uint8Array(signature));
}

export async function createAdminSession(context: PanelSession = { role: 'master' }) {
  const payload = toBase64Url(
    JSON.stringify({ role: context.role, resellerId: context.resellerId, exp: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds }),
  );
  return `${payload}.${await sign(payload)}`;
}

export async function isValidAdminSession(token?: string) {
  if (!token) return false;
  const key = await signingKey();
  if (!key) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;
  try {
    const validSignature = await crypto.subtle.verify(
      'HMAC',
      key,
      fromBase64Url(signature),
      encoder.encode(payload),
    );
    if (!validSignature) return false;
    const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as {
      role?: string;
      exp?: number;
    };
    return (decoded.role === 'master' || decoded.role === 'reseller') && typeof decoded.exp === 'number' && decoded.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function matchesConfiguredPassword(inputPassword: string): boolean {
  const configured = process.env.ADMIN_PASSWORD?.trim() ?? '';
  if (!configured || !inputPassword) return false;
  return timingSafeEqual(inputPassword.trim(), configured);
}

export async function checkAdminPassword(password: string): Promise<boolean> {
  if (matchesConfiguredPassword(password)) return true;

  try {
    const prismaModule = await import('@/lib/prisma');
    const prisma = prismaModule.default;
    const clean = password.trim();
    const user = await prisma.adminUser.findFirst({
      where: { password: { in: [password, clean] } },
    });
    if (user) return true;
  } catch {
    // Banco indisponível não libera acesso.
  }

  return false;
}

export async function isRequestAuthenticated(sessionToken?: string): Promise<boolean> {
  return isValidAdminSession(sessionToken);
}

export async function getPanelSession(): Promise<PanelSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;
  const key = await signingKey();
  if (!key) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  try {
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(signature), encoder.encode(payload));
    if (!valid) return null;
    const decoded = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { role?: PanelRole; resellerId?: string; exp?: number };
    if ((decoded.role !== 'master' && decoded.role !== 'reseller') || !decoded.exp || decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    return { role: decoded.role, resellerId: decoded.resellerId };
  } catch {
    return null;
  }
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
  const valid = await isRequestAuthenticated(sessionToken);
  return valid ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export { sessionCookieName };
