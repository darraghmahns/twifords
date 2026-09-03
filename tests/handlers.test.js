import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoginHandler, createLogoutHandler, createGiftCardsHandler } from '../lib/handlers.js';
import { createRateLimiter } from '../lib/rate-limit.js';
import { createSessionToken, parseCookies, SESSION_COOKIE } from '../lib/session.js';

const SECRET = 's'.repeat(64);
const env = { SITE_PASSWORD: 'open sesame', SESSION_SECRET: SECRET, GIFT_CARDS_JSON: JSON.stringify({ daikaya: { kind: 'toast', code: '1', pin: '2' } }) };
const noSleep = async () => {};

const post = (body, headers = {}) => new Request('https://x.test/api/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.9', ...headers },
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

test('login: correct password sets an HttpOnly session cookie', async () => {
  const login = createLoginHandler({ env, sleepFn: noSleep });
  const res = await login(post({ password: 'open sesame' }));
  assert.equal(res.status, 204);
  const cookie = res.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.ok(parseCookies(cookie)[SESSION_COOKIE].includes('.'));
});

test('login: wrong, missing, or non-string password is a 401 and waits', async () => {
  let slept = 0;
  const login = createLoginHandler({ env, sleepFn: async (ms) => { slept += ms; } });
  for (const body of [{ password: 'nope' }, {}, { password: 42 }, { password: '' }]) {
    const res = await login(post(body));
    assert.equal(res.status, 401, JSON.stringify(body));
    assert.equal((await res.json()).error, 'That is not the password. Try again.');
    assert.equal(res.headers.get('set-cookie'), null);
  }
  assert.equal(slept, 4 * 400);
});

test('login: bad bodies are 400, other methods are 405', async () => {
  const login = createLoginHandler({ env, sleepFn: noSleep });
  assert.equal((await login(post('not json'))).status, 400);
  assert.equal((await login(post('[1,2]'))).status, 400);
  assert.equal((await login(post('x'.repeat(5000)))).status, 400);
  const get = await login(new Request('https://x.test/api/login'));
  assert.equal(get.status, 405);
  assert.equal(get.headers.get('allow'), 'POST');
});

test('login: rate limited per client after repeated failures, cleared on success', async () => {
  const limiter = createRateLimiter({ max: 3, windowMs: 60_000 });
  const login = createLoginHandler({ env, limiter, sleepFn: noSleep });
  for (let i = 0; i < 3; i++) assert.equal((await login(post({ password: 'x' }))).status, 401);
  const blocked = await login(post({ password: 'open sesame' }));
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get('retry-after')) > 0);
  const other = await login(post({ password: 'open sesame' }, { 'x-forwarded-for': '198.51.100.7' }));
  assert.equal(other.status, 204);
  limiter.reset();
  assert.equal((await login(post({ password: 'open sesame' }))).status, 204);
  assert.equal((await login(post({ password: 'x' }))).status, 401, 'success cleared the counter');
});

const postForm = (fields, headers = {}) => new Request('https://x.test/api/login', {
  method: 'POST',
  headers: { 'content-type': 'application/x-www-form-urlencoded', 'x-forwarded-for': '203.0.113.9', ...headers },
  body: new URLSearchParams(fields).toString(),
});

test('login (no-JS form): success sets the cookie and redirects to a safe next path', async () => {
  const login = createLoginHandler({ env, sleepFn: noSleep });
  const res = await login(postForm({ password: 'open sesame', next: '/#map' }));
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), 'https://x.test/#map');
  assert.match(res.headers.get('set-cookie'), /HttpOnly/);
  const evil = await login(postForm({ password: 'open sesame', next: 'https://evil.test' }));
  assert.equal(evil.headers.get('location'), 'https://x.test/');
});

test('login (no-JS form): failure redirects back to /login with an error flag and no cookie', async () => {
  const login = createLoginHandler({ env, sleepFn: noSleep });
  const res = await login(postForm({ password: 'nope', next: '/dc-map.html' }));
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), 'https://x.test/login?next=%2Fdc-map.html&error=password');
  assert.equal(res.headers.get('set-cookie'), null);
});

test('login (no-JS form): rate limit redirects with error=rate', async () => {
  const limiter = createRateLimiter({ max: 1, windowMs: 60_000 });
  const login = createLoginHandler({ env, limiter, sleepFn: noSleep });
  await login(postForm({ password: 'nope' }));
  const res = await login(postForm({ password: 'open sesame' }));
  assert.equal(res.status, 303);
  assert.equal(res.headers.get('location'), 'https://x.test/login?error=rate');
  assert.ok(Number(res.headers.get('retry-after')) > 0);
});

test('login: unconfigured server is a 500 with a generic message', async () => {
  const login = createLoginHandler({ env: {}, sleepFn: noSleep });
  const res = await login(post({ password: 'anything' }));
  assert.equal(res.status, 500);
  assert.equal((await res.json()).error, 'The site is not configured yet.');
});

test('logout clears the cookie', async () => {
  const logout = createLogoutHandler();
  const res = await logout(new Request('https://x.test/api/logout', { method: 'POST' }));
  assert.equal(res.status, 204);
  assert.match(res.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal((await logout(new Request('https://x.test/api/logout'))).status, 405);
});

test('gift-cards: requires a valid session and returns the configured JSON', async () => {
  const giftCards = createGiftCardsHandler({ env });
  const anon = await giftCards(new Request('https://x.test/api/gift-cards'));
  assert.equal(anon.status, 401);

  const token = await createSessionToken(SECRET);
  const authed = await giftCards(new Request('https://x.test/api/gift-cards', { headers: { cookie: `${SESSION_COOKIE}=${token}` } }));
  assert.equal(authed.status, 200);
  assert.equal(authed.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await authed.json(), { daikaya: { kind: 'toast', code: '1', pin: '2' } });

  const stale = await createSessionToken(SECRET, Date.now() - 40 * 24 * 3600 * 1000);
  const expired = await giftCards(new Request('https://x.test/api/gift-cards', { headers: { cookie: `${SESSION_COOKIE}=${stale}` } }));
  assert.equal(expired.status, 401);
});

test('gift-cards: misconfiguration never leaks details', async () => {
  const token = await createSessionToken(SECRET);
  const authed = () => new Request('https://x.test/api/gift-cards', { headers: { cookie: `${SESSION_COOKIE}=${token}` } });
  for (const bad of [{ ...env, GIFT_CARDS_JSON: undefined }, { ...env, GIFT_CARDS_JSON: '{not json' }, { ...env, GIFT_CARDS_JSON: '[1]' }]) {
    const res = await createGiftCardsHandler({ env: bad })(authed());
    assert.equal(res.status, 500);
    assert.doesNotMatch(await res.text(), /not json|\[1\]/);
  }
  assert.equal((await createGiftCardsHandler({ env })(new Request('https://x.test/api/gift-cards', { method: 'POST' }))).status, 405);
});
