import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionToken, SESSION_COOKIE } from '../lib/session.js';

const SECRET = 'm'.repeat(64);
let middleware;
let previousSecret;

before(async () => {
  previousSecret = process.env.SESSION_SECRET;
  process.env.SESSION_SECRET = SECRET;
  middleware = (await import('../middleware.js')).default;
});
after(() => {
  if (previousSecret === undefined) delete process.env.SESSION_SECRET;
  else process.env.SESSION_SECRET = previousSecret;
});

const isNext = (res) => res.headers.get('x-middleware-next') === '1';

test('public paths pass through without a cookie', async () => {
  for (const p of ['/login', '/api/login', '/styles/site.css', '/fonts/figtree-latin.woff2', '/scripts/login.js']) {
    assert.ok(isNext(await middleware(new Request(`https://x.test${p}`))), p);
  }
});

test('protected pages redirect to /login with a safe next param', async () => {
  const home = await middleware(new Request('https://x.test/'));
  assert.equal(home.status, 302);
  assert.equal(home.headers.get('location'), 'https://x.test/login');
  const map = await middleware(new Request('https://x.test/dc-map.html?x=1'));
  assert.equal(map.headers.get('location'), 'https://x.test/login?next=%2Fdc-map.html%3Fx%3D1');
  assert.equal(map.headers.get('cache-control'), 'no-store');
});

test('protected API routes get a JSON 401 instead of a redirect', async () => {
  const res = await middleware(new Request('https://x.test/api/gift-cards'));
  assert.equal(res.status, 401);
  assert.equal((await res.json()).error, 'Please sign in first.');
});

test('a valid session cookie passes through; a forged one does not', async () => {
  const token = await createSessionToken(SECRET);
  const ok = await middleware(new Request('https://x.test/scripts/site.js', { headers: { cookie: `${SESSION_COOKIE}=${token}` } }));
  assert.ok(isNext(ok));
  const forged = await middleware(new Request('https://x.test/scripts/site.js', { headers: { cookie: `${SESSION_COOKIE}=${token}x` } }));
  assert.equal(forged.status, 302);
});

test('a missing SESSION_SECRET fails closed', async () => {
  const saved = process.env.SESSION_SECRET;
  delete process.env.SESSION_SECRET;
  try {
    const res = await middleware(new Request('https://x.test/'));
    assert.equal(res.status, 500);
  } finally {
    process.env.SESSION_SECRET = saved;
  }
});
