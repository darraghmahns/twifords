#!/usr/bin/env node
// Local stand-in for Vercel: serves public/ with cleanUrls, runs middleware.js on every request,
// and routes /api/* to the same handlers Vercel deploys. Loads .env.local when present.
import http from 'node:http';
import { existsSync, watch } from 'node:fs';
import { execFile } from 'node:child_process';
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
const previewClients = new Set();
let reloadTimer;
let buildTimer;
let building = false;
let rebuildPending = false;
function rebuild() {
  if (building) { rebuildPending = true; return; }
  building = true;
  execFile(process.execPath, ['scripts/build-pages.mjs'], { cwd: root }, (error) => {
    building = false;
    if (error) console.error('Page build failed:', error.message);
    if (rebuildPending) { rebuildPending = false; rebuild(); }
  });
}
function scheduleBuild() {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(rebuild, 100);
}
watch(publicDir, { recursive: true }, (_event, file) => {
  if (file === 'scripts/restaurants.js') scheduleBuild();
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(() => {
    for (const client of previewClients) client.write('data: reload\n\n');
  }, 250);
});
watch(path.join(root, 'scripts'), (_event, file) => {
  if (file === 'build-pages.mjs' || file === 'artwork.mjs') scheduleBuild();
});
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

    // Development-only refresh endpoints. These never serve site or card data.
    if (url.pathname === '/__dev/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
      res.write(': connected\n\n');
      previewClients.add(res);
      res.on('close', () => previewClients.delete(res));
      return;
    }
    if (url.pathname === '/__dev/live.js') {
      res.writeHead(200, { 'content-type': MIME['.js'], 'cache-control': 'no-store' });
      return res.end("new EventSource('/__dev/events').onmessage = () => location.reload();");
    }

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
    res.setHeader('cache-control', 'no-store');
    const contents = await readFile(file);
    res.end(path.extname(file) === '.html'
      ? contents.toString().replace('</body>', '<script src="/__dev/live.js"></script></body>')
      : contents);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('content-type', 'text/plain; charset=utf-8');
    res.end('Internal error');
  }
});

server.listen(PORT, 'localhost', () => {
  console.log(`The Twifords Try D.C. → http://localhost:${PORT}`);
  if (!process.env.SITE_PASSWORD || !process.env.SESSION_SECRET) console.warn('warning: SITE_PASSWORD / SESSION_SECRET not set; copy .env.example to .env.local');
  if (!process.env.GIFT_CARDS_JSON) console.warn('warning: GIFT_CARDS_JSON not set; gift cards will show as unavailable');
});
