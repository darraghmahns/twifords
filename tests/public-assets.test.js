import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const secretsPath = path.join(root, 'secrets', 'gift-cards.json');

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else out.push(full);
  }
  return out;
}

const isText = (file) => /\.(html|css|js|json|svg|txt)$/.test(file);

test('local asset references in the HTML pages resolve to real files', async () => {
  for (const page of ['index.html', 'dc-map.html', 'login.html']) {
    const html = await readFile(path.join(publicDir, page), 'utf8');
    const refs = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
    const local = refs.filter((r) => !/^(https?:|data:|#|mailto:|\/login$)/.test(r));
    assert.ok(local.length > 0, `${page} should reference local assets`);
    for (const ref of local) {
      const target = path.join(publicDir, ref.split('#')[0]);
      // cleanUrls: a bare "dc-map" reference is served from dc-map.html
      assert.ok(existsSync(target) || existsSync(`${target}.html`), `${page} references missing file ${ref}`);
    }
  }
});

test('browser modules only import files that exist', async () => {
  const scriptsDir = path.join(publicDir, 'scripts');
  for (const file of await readdir(scriptsDir)) {
    const src = await readFile(path.join(scriptsDir, file), 'utf8');
    for (const [, spec] of src.matchAll(/from\s+'([^']+)'/g)) {
      const target = path.resolve(scriptsDir, spec);
      assert.ok(existsSync(target), `${file} imports missing ${spec}`);
      assert.ok(target.startsWith(publicDir + path.sep), `${file} imports ${spec}, which is outside public/ and cannot be served`);
    }
  }
});

test('no gift card secrets leak into anything under public/', async () => {
  const files = (await walk(publicDir)).filter(isText);
  const contents = await Promise.all(files.map((f) => readFile(f, 'utf8')));

  const cardNumber = /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/;
  files.forEach((file, i) => {
    assert.ok(!cardNumber.test(contents[i]), `${path.relative(root, file)} contains a 16-digit card-like number`);
  });

  if (!existsSync(secretsPath)) return; // no local secrets to compare against
  const secrets = JSON.parse(await readFile(secretsPath, 'utf8'));
  const sensitive = Object.values(secrets).flatMap((entry) =>
    Object.entries(entry).filter(([k]) => k !== 'kind').map(([, v]) => String(v)));
  for (const value of sensitive) {
    files.forEach((file, i) => {
      assert.ok(!contents[i].includes(value), `${path.relative(root, file)} contains a secret value`);
    });
  }
});

test('the login page never loads protected assets, including transitive module imports', async () => {
  const html = await readFile(path.join(publicDir, 'login.html'), 'utf8');
  const { isPublicPath } = await import('../lib/session.js');
  const queue = [...html.matchAll(/\b(?:src|href)="([^"]+)"/g)].map((m) => m[1]).filter((r) => !/^(https?:|data:|#)/.test(r));
  const seen = new Set();
  while (queue.length) {
    const ref = queue.shift();
    if (seen.has(ref)) continue;
    seen.add(ref);
    assert.ok(isPublicPath('/' + ref), `login.html loads ${ref}, which needs a session`);
    if (!ref.endsWith('.js')) continue;
    const src = await readFile(path.join(publicDir, ref), 'utf8');
    for (const [, spec] of src.matchAll(/from\s+'([^']+)'/g)) {
      queue.push(path.posix.normalize(path.posix.join(path.posix.dirname(ref), spec)));
    }
  }
  assert.ok(seen.size >= 4, 'expected the login page to load styles and scripts');
});

test('fonts and Leaflet are vendored, not fetched from a CDN', async () => {
  for (const file of ['fonts/caprasimo-latin.woff2', 'fonts/figtree-latin.woff2', 'vendor/leaflet-1.9.4.min.js', 'vendor/leaflet-1.9.4.css']) {
    const info = await stat(path.join(publicDir, file));
    assert.ok(info.size > 1000, `${file} looks empty`);
  }
  const organic = await readFile(path.join(publicDir, 'styles', 'organic.css'), 'utf8');
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/.test(organic), 'organic.css still points at bundle UUID font URLs');
});
