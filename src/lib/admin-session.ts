import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const sessionCookieName = 'center_play_admin_session';
const encoder = new TextEncoder();
const sessionLifetimeSeconds = 60 * 60 * 8;

function toBase64Url(value: Uint8Array | string) {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value;
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_SECRET deve ter ao menos 32 caracteres.');
  }
  return secret;
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
  const token = (await cookies()).get(sessionCookieName)?.value;
  const valid = await isValidAdminSession(token);
  return valid ? null : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export { sessionCookieName };