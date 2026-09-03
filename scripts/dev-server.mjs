#!/usr/bin/env node
// Local stand-in for Vercel: serves public/ with cleanUrls, runs middleware.js on every request,
// and routes /api/* to the same handlers Vercel deploys. Loads .env.local when present.
import http from 'node:http';
import { existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const envFile = path.join(root, '.env.local');
if (existsSync(envFile)) process.loadEnvFile(envFile);

const { default: middleware } = await import('../middleware.js');
const api = {
  '/api/login': (await import('../api/login.js')).default,
  '/api/logout': (await import('../api/logout.js')).default,
  '/api/gift-cards': (await import('../api/gift-cards.js')).default,
};

const PORT = Number(process.env.PORT || 4173);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json; charset=utf-8',
};

async function toRequest(req) {
  const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v);
  const hasBody = !['GET', 'HEAD'].includes(req.method);
  const body = hasBody ? Buffer.concat(await req.toArray()) : undefined;
  return new Request(url, { method: req.method, headers, body });
}

async function send(res, response) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  const buf = Buffer.from(await response.arrayBuffer());
  res.end(buf);
}

async function resolveStatic(pathname) {
  const decoded = decodeURIComponent(pathname);
  const candidates = decoded.endsWith('/') ? [`${decoded}index.html`] : [decoded, `${decoded}.html`];
  for (const candidate of candidates) {
    const full = path.normalize(path.join(publicDir, candidate));
    if (!full.startsWith(publicDir + path.sep)) continue; // path traversal guard
    try {
      const info = await stat(full);
      if (info.isFile()) return full;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

const server = http.createServer(async (req, res) => {
  try {
    const request = await toRequest(req);
    const url = new URL(request.url);

    const mw = await middleware(request);
    if (mw && !mw.headers.has('x-middleware-next')) return send(res, mw);

    const handler = api[url.pathname];
    if (handler) return send(res, await handler(request));

    // cleanUrls: /login.html → /login (mirrors Vercel's redirect)
    if (url.pathname.endsWith('.html')) {
      res.statusCode = 308;
      res.setHeader('location', url.pathname.replace(/\.html$/, '') || '/');
      return res.end();
    }

    const file = await resolveStatic(url.pathname);
    if (!file) {
      res.statusCode = 404;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      return res.end('Not found');
    }
    res.statusCode = 200;
    res.setHeader('content-type', MIME[path.extname(file)] || 'application/octet-stream');
    res.end(await readFile(file));
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Internal error');
  }
});

server.listen(PORT, () => {
  console.log(`The Twifords Try D.C. → http://localhost:${PORT}`);
  if (!process.env.SITE_PASSWORD || !process.env.SESSION_SECRET) console.warn('warning: SITE_PASSWORD / SESSION_SECRET not set; copy .env.example to .env.local');
  if (!process.env.GIFT_CARDS_JSON) console.warn('warning: GIFT_CARDS_JSON not set; gift cards will show as unavailable');
});
