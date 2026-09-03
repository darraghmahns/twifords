// Request handlers for the api/ functions. Factories take their environment explicitly so tests can drive them.
import { ipAddress } from '@vercel/functions';
import {
  createSessionToken, hasValidSession, sessionCookieHeader, clearSessionCookieHeader,
  timingSafeEqual, isSecureRequest,
} from './session.js';
import { createRateLimiter } from './rate-limit.js';
import { safeNextPath } from '../public/scripts/next-path.js';

const MAX_BODY_BYTES = 4096;
const FAILED_LOGIN_DELAY_MS = 400;

const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function clientKey(request) {
  return ipAddress(request) || request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
}

/** Reads a JSON or form-encoded body. `isForm` tells the login handler to answer with redirects. */
async function readBody(request) {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > MAX_BODY_BYTES) return { error: 'Request body too large.' };
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return { error: 'Request body too large.' };
  const contentType = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (contentType === 'application/x-www-form-urlencoded') {
    return { value: Object.fromEntries(new URLSearchParams(text)), isForm: true };
  }
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Expected a JSON object.' };
    return { value, isForm: false };
  } catch {
    return { error: 'Body must be valid JSON.' };
  }
}

const redirect = (request, pathname, headers = {}) =>
  new Response(null, { status: 303, headers: { location: new URL(pathname, request.url).toString(), 'cache-control': 'no-store', ...headers } });

const loginPage = (nextPath, error) => {
  const params = new URLSearchParams();
  if (nextPath !== '/') params.set('next', nextPath);
  if (error) params.set('error', error);
  const query = params.toString();
  return query ? `/login?${query}` : '/login';
};

export function createLoginHandler({ env = process.env, limiter = createRateLimiter(), sleepFn = sleep } = {}) {
  return async function login(request) {
    if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' }, { allow: 'POST' });

    const password = env.SITE_PASSWORD;
    const secret = env.SESSION_SECRET;
    if (!password || !secret) {
      console.error('login: SITE_PASSWORD or SESSION_SECRET is not set');
      return json(500, { error: 'The site is not configured yet.' });
    }

    const body = await readBody(request);
    if (body.error) return json(400, { error: body.error });
    const isForm = body.isForm;
    const nextPath = safeNextPath(typeof body.value.next === 'string' ? body.value.next : '/');
    const attempt = typeof body.value.password === 'string' ? body.value.password : '';

    const limit = limiter.hit(clientKey(request));
    if (!limit.allowed) {
      const retryAfter = { 'retry-after': String(Math.ceil(limit.retryAfterMs / 1000)) };
      if (isForm) return redirect(request, loginPage(nextPath, 'rate'), retryAfter);
      return json(429, { error: 'Too many tries. Please wait a few minutes and try again.' }, retryAfter);
    }

    if (!attempt || !(await timingSafeEqual(attempt, password))) {
      await sleepFn(FAILED_LOGIN_DELAY_MS);
      if (isForm) return redirect(request, loginPage(nextPath, 'password'));
      return json(401, { error: 'That is not the password. Try again.' });
    }

    limiter.clear(clientKey(request));
    const token = await createSessionToken(secret);
    const setCookie = sessionCookieHeader(token, { secure: isSecureRequest(request) });
    if (isForm) return redirect(request, nextPath, { 'set-cookie': setCookie });
    return new Response(null, { status: 204, headers: { 'set-cookie': setCookie, 'cache-control': 'no-store' } });
  };
}

export function createLogoutHandler() {
  return async function logout(request) {
    if (request.method !== 'POST') return json(405, { error: 'Method not allowed.' }, { allow: 'POST' });
    return new Response(null, {
      status: 204,
      headers: { 'set-cookie': clearSessionCookieHeader({ secure: isSecureRequest(request) }), 'cache-control': 'no-store' },
    });
  };
}

export function createGiftCardsHandler({ env = process.env } = {}) {
  return async function giftCards(request) {
    if (request.method !== 'GET') return json(405, { error: 'Method not allowed.' }, { allow: 'GET' });
    const secret = env.SESSION_SECRET;
    if (!secret) {
      console.error('gift-cards: SESSION_SECRET is not set');
      return json(500, { error: 'The site is not configured yet.' });
    }
    // The middleware already gates this route; check again so the function never leaks on its own.
    if (!(await hasValidSession(request, secret))) return json(401, { error: 'Please sign in first.' });

    const raw = env.GIFT_CARDS_JSON;
    if (!raw) {
      console.error('gift-cards: GIFT_CARDS_JSON is not set');
      return json(500, { error: 'Gift cards are not configured yet.' });
    }
    let cards;
    try {
      cards = JSON.parse(raw);
    } catch (err) {
      console.error('gift-cards: GIFT_CARDS_JSON is not valid JSON', err);
      return json(500, { error: 'Gift cards are misconfigured.' });
    }
    if (!cards || typeof cards !== 'object' || Array.isArray(cards)) {
      console.error('gift-cards: GIFT_CARDS_JSON must be an object keyed by restaurant id');
      return json(500, { error: 'Gift cards are misconfigured.' });
    }
    return json(200, cards);
  };
}
