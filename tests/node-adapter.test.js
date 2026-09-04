import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { nodeHandler } from '../lib/node-adapter.js';
import { createLoginHandler } from '../lib/handlers.js';

const SECRET = 'n'.repeat(64);
const env = { SITE_PASSWORD: 'open sesame', SESSION_SECRET: SECRET };

async function withServer(handler, fn) {
  const server = http.createServer((req, res) => handler(req, res));
  server.listen(0);
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    server.close();
  }
}

test('passes a Web Request straight through', async () => {
  const adapted = nodeHandler(async (request) => new Response(request.headers.get('x-test'), { status: 201 }));
  const res = await adapted(new Request('https://x.test/', { headers: { 'x-test': 'hi' } }));
  assert.equal(res.status, 201);
  assert.equal(await res.text(), 'hi');
});

test('converts a Node request (method, url, headers, body) and writes the Response back', async () => {
  const seen = {};
  const adapted = nodeHandler(async (request) => {
    seen.method = request.method;
    seen.url = request.url;
    seen.contentType = request.headers.get('content-type');
    seen.body = await request.text();
    return new Response('ok', { status: 202, headers: { 'x-out': '1', 'set-cookie': 'a=1; Path=/' } });
  });
  await withServer(adapted, async (base) => {
    const res = await fetch(`${base}/api/login?x=1`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-proto': 'https', 'x-forwarded-host': 'dctwifords.com' },
      body: '{"password":"p"}',
    });
    assert.equal(res.status, 202);
    assert.equal(res.headers.get('x-out'), '1');
    assert.equal(res.headers.get('set-cookie'), 'a=1; Path=/');
    assert.equal(await res.text(), 'ok');
  });
  assert.equal(seen.method, 'POST');
  assert.equal(seen.url, 'https://dctwifords.com/api/login?x=1');
  assert.equal(seen.contentType, 'application/json');
  assert.equal(seen.body, '{"password":"p"}');
});

test('the real login handler works end to end through the adapter', async () => {
  const adapted = nodeHandler(createLoginHandler({ env, sleepFn: async () => {} }));
  await withServer(adapted, async (base) => {
    const bad = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"password":"nope"}' });
    assert.equal(bad.status, 401);
    assert.equal((await bad.json()).error, 'That is not the password. Try again.');
    const good = await fetch(`${base}/api/login`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-proto': 'https' }, body: '{"password":"open sesame"}' });
    assert.equal(good.status, 204);
    assert.match(good.headers.get('set-cookie'), /twiford_session=.*HttpOnly.*Secure/);
  });
});

test('a handler that throws becomes a generic 500, never a crash', async () => {
  const adapted = nodeHandler(async () => { throw new Error('boom'); });
  await withServer(adapted, async (base) => {
    const res = await fetch(`${base}/x`);
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: 'Something went wrong.' });
  });
});
