// Session cookie helpers. Web APIs only, so the same code runs in Vercel middleware, Vercel functions,
// the local dev server, and the test suite.

import { safeNextPath } from '../public/scripts/next-path.js';

export { safeNextPath };

export const SESSION_COOKIE = 'twiford_session';
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const encoder = new TextEncoder();

/** Paths anyone may load without a session: the login page and what it needs. */
export function isPublicPath(pathname) {
  if (pathname === '/login' || pathname === '/login.html') return true;
  if (pathname === '/api/login') return true;
  if (pathname.startsWith('/styles/') || pathname.startsWith('/fonts/')) return true;
  if (pathname === '/scripts/login.js' || pathname === '/scripts/next-path.js') return true;
  return false;
}

function base64UrlEncode(bytes) {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return base64UrlEncode(new Uint8Array(sig));
}

/** Constant-time string comparison (hashes both sides so unequal lengths do not short-circuit). */
export async function timingSafeEqual(a, b) {
  const [ha, hb] = await Promise.all([a, b].map((s) => crypto.subtle.digest('SHA-256', encoder.encode(String(s)))));
  const ba = new Uint8Array(ha);
  const bb = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0 && a.length === b.length;
}

function assertSecret(secret) {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('SESSION_SECRET must be a string of at least 32 characters.');
  }
}

/** Token format: `<expiresAtMs>.<base64url HMAC-SHA256(secret, expiresAtMs)>` */
export async function createSessionToken(secret, now = Date.now(), ttlMs = SESSION_TTL_MS) {
  assertSecret(secret);
  const expiresAt = String(now + ttlMs);
  return `${expiresAt}.${await hmac(secret, expiresAt)}`;
}

export async function verifySessionToken(secret, token, now = Date.now()) {
  assertSecret(secret);
  if (typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expiresAt = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  if (!/^\d{1,16}$/.test(expiresAt) || signature.length === 0) return false;
  if (Number(expiresAt) <= now) return false;
  return timingSafeEqual(await hmac(secret, expiresAt), signature);
}

export function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  }
  return out;
}

export function sessionCookieHeader(token, { secure, maxAgeMs = SESSION_TTL_MS } = {}) {
  const parts = [
    `${SESSION_COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
  ];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookieHeader({ secure } = {}) {
  const parts = [`${SESSION_COOKIE}=`, 'Path=/', 'HttpOnly', 'SameSite=Lax', 'Max-Age=0'];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export async function hasValidSession(request, secret, now = Date.now()) {
  const token = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE];
  if (!token) return false;
  return verifySessionToken(secret, token, now);
}

export function isSecureRequest(request) {
  const proto = request.headers.get('x-forwarded-proto');
  if (proto) return proto.split(',')[0].trim() === 'https';
  return new URL(request.url).protocol === 'https:';
}
