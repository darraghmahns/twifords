import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionToken, verifySessionToken, parseCookies, sessionCookieHeader, clearSessionCookieHeader,
  isPublicPath, safeNextPath, timingSafeEqual, hasValidSession, isSecureRequest, SESSION_COOKIE, SESSION_TTL_MS,
} from '../lib/session.js';

const SECRET = 'a'.repeat(64);
const NOW = 1_800_000_000_000;

test('a fresh token verifies and an expired one does not', async () => {
  const token = await createSessionToken(SECRET, NOW);
  assert.equal(await verifySessionToken(SECRET, token, NOW + 1000), true);
  assert.equal(await verifySessionToken(SECRET, token, NOW + SESSION_TTL_MS + 1), false);
});

test('tokens signed with another secret or tampered are rejected', async () => {
  const token = await createSessionToken(SECRET, NOW);
  assert.equal(await verifySessionToken('b'.repeat(64), token, NOW), false);
  const [exp, sig] = token.split('.');
  assert.equal(await verifySessionToken(SECRET, `${Number(exp) + 99999}.${sig}`, NOW), false);
  assert.equal(await verifySessionToken(SECRET, `${exp}.${sig.slice(0, -1)}x`, NOW), false);
});

test('malformed tokens are rejected without throwing', async () => {
  for (const bad of [undefined, null, '', '.', 'abc', '123', '123.', '.sig', 'notanumber.sig', 12345]) {
    assert.equal(await verifySessionToken(SECRET, bad, NOW), false, String(bad));
  }
});

test('weak secrets are refused', async () => {
  await assert.rejects(createSessionToken('short', NOW), /SESSION_SECRET/);
  await assert.rejects(verifySessionToken('', 'x.y', NOW), /SESSION_SECRET/);
});

test('timingSafeEqual compares strings of any length', async () => {
  assert.equal(await timingSafeEqual('pass', 'pass'), true);
  assert.equal(await timingSafeEqual('pass', 'Pass'), false);
  assert.equal(await timingSafeEqual('pass', 'passw'), false);
  assert.equal(await timingSafeEqual('', ''), true);
});

test('cookies parse and the session header is HttpOnly, Lax, and Secure on https', async () => {
  assert.deepEqual(parseCookies('a=1; twiford_session=x%2Ey; b = 2'), { a: '1', twiford_session: 'x.y', b: '2' });
  assert.deepEqual(parseCookies(''), {});
  assert.deepEqual(parseCookies(null), {});
  const header = sessionCookieHeader('tok.en', { secure: true });
  assert.match(header, new RegExp(`^${SESSION_COOKIE}=tok\\.en; Path=/; HttpOnly; SameSite=Lax; Max-Age=\\d+; Secure$`));
  assert.ok(!sessionCookieHeader('t', { secure: false }).includes('Secure'));
  assert.match(clearSessionCookieHeader(), /Max-Age=0/);
});

test('hasValidSession reads the cookie off a Request', async () => {
  const token = await createSessionToken(SECRET, NOW);
  const good = new Request('https://x.test/', { headers: { cookie: `${SESSION_COOKIE}=${token}` } });
  const none = new Request('https://x.test/');
  assert.equal(await hasValidSession(good, SECRET, NOW), true);
  assert.equal(await hasValidSession(none, SECRET, NOW), false);
});

test('isSecureRequest honours x-forwarded-proto then the URL scheme', () => {
  assert.equal(isSecureRequest(new Request('http://x.test/', { headers: { 'x-forwarded-proto': 'https' } })), true);
  assert.equal(isSecureRequest(new Request('https://x.test/', { headers: { 'x-forwarded-proto': 'http' } })), false);
  assert.equal(isSecureRequest(new Request('https://x.test/')), true);
  assert.equal(isSecureRequest(new Request('http://localhost/')), false);
});

test('only the login page and its assets are public', () => {
  for (const p of ['/login', '/login.html', '/api/login', '/styles/site.css', '/fonts/figtree-latin.woff2', '/scripts/login.js', '/scripts/next-path.js']) {
    assert.equal(isPublicPath(p), true, p);
  }
  for (const p of ['/', '/index.html', '/dc-map.html', '/scripts/site.js', '/scripts/restaurants.js', '/vendor/leaflet-1.9.4.min.js', '/api/gift-cards', '/api/logout', '/styles', '/logins']) {
    assert.equal(isPublicPath(p), false, p);
  }
});

test('safeNextPath only allows same-site relative paths', () => {
  assert.equal(safeNextPath('/'), '/');
  assert.equal(safeNextPath('/#map'), '/#map');
  assert.equal(safeNextPath('/dc-map.html'), '/dc-map.html');
  for (const bad of [undefined, null, '', 'https://evil.test', '//evil.test', '/\\evil.test', '/login', '/login?next=/', '/api/gift-cards', '/\r\nSet-Cookie: x']) {
    assert.equal(safeNextPath(bad), '/', String(bad));
  }
});
