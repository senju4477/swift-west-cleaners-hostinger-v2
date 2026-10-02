import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import mysql from 'mysql2/promise';

const origin = process.env.TEST_BASE_URL || 'http://localhost:3000';
const canonicalOrigin = process.env.SITE_URL || 'http://localhost:3000';
const dbTest = process.env.TEST_ALLOW_DB_WRITE === 'true';
const routes = ['/', '/services', '/commercial-cleaning', '/domestic-cleaning', '/ndis-cleaning', '/end-of-lease-cleaning', '/carpet-cleaning', '/about', '/contact', '/privacy', '/terms'];
const titles = new Set();
const source = JSON.parse(await readFile(new URL('../deploy/source-manifest.json', import.meta.url), 'utf8'));
const assets = new Set(source.files.filter(file => file.path.startsWith('public/')).map(file => '/' + file.path.slice(7)));
for (const path of routes) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('x-robots-tag') || '', /noindex/, path);
  const html = await response.text();
  assert.match(html, /<main id="main">/, path);
  assert.match(html, /name="robots" content="noindex, nofollow"/, path);
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1];
  assert.ok(canonical, 'canonical exists: ' + path);
  assert.equal(new URL(canonical).href, new URL(path, canonicalOrigin).href, 'canonical: ' + path);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title && !titles.has(title), 'unique title: ' + path);
  titles.add(title);
  assert.ok(html.includes('application/ld+json'), 'structured content: ' + path);
  for (const match of html.matchAll(/(?:href|src)="([^"?#]+)(?:\?[^"#]*)?"/g)) {
    if (match[1].startsWith('/_next/') || /\.(?:webp|svg)$/.test(match[1])) assets.add(match[1]);
  }
}
for (const asset of assets) {
  const response = await fetch(origin + asset);
  assert.equal(response.status, 200, asset);
  assert.ok((await response.arrayBuffer()).byteLength > 0, asset);
}
assert.equal((await fetch(origin + '/not-a-real-page')).status, 404);
assert.equal((await fetch(origin + '/contact/', { redirect: 'manual' })).status, 308);
const robots = await (await fetch(origin + '/robots.txt')).text();
assert.match(robots, /Disallow: \/\s/);
assert.doesNotMatch(robots, /Sitemap:/);
assert.doesNotMatch(await (await fetch(origin + '/sitemap.xml')).text(), /<loc>/);

const data = { name: 'TEST MIGRATION – Ayaan 🧹', phone: '0400000000', email: 'migration-test@example.invalid', suburb: 'Melton', service: 'Domestic Cleaning', property: 'TEST ONLY', size: '2 rooms', date: '2027-02-28', time: '10:30', details: 'TEST ONLY – Unicode: Soomaali, café, تنظيف 🧹', website: '' };
async function send(body, key, headers = {}) {
  return fetch(origin + '/api/quote', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: new URL(origin).origin, ...(key ? { 'Idempotency-Key': key } : {}), ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}
for (const body of ['{', 'null', '[]', { ...data, name: '' }, { ...data, name: 12 }, { ...data, website: 'spam' }, { ...data, date: '2027-02-30' }, { ...data, time: '24:61' }, { ...data, details: 'a'.repeat(2001) }]) {
  assert.equal((await send(body)).status, 400);
}
assert.equal((await send(data, undefined, { Origin: 'https://unrelated.example' })).status, 403);
assert.equal((await send(data, undefined, { 'Content-Type': 'text/plain' })).status, 415);
assert.equal((await send('a'.repeat(15001))).status, 413);
assert.equal((await send(data, 'invalid-key')).status, 400);

if (!dbTest) {
  const response = await send(data);
  assert.equal(response.status, 503, 'run without DB configuration for the pages-only test');
  const body = await response.json();
  assert.ok(body.error && !body.reference, 'no fake success');
  console.log(`PASS: ${routes.length} pages, ${assets.size} assets, metadata/noindex, redirects/404, validation, and unavailable-database behavior.`);
} else {
  assert.match(process.env.DB_NAME || '', /_test$/, 'database tests require a separate DB_NAME ending in _test');
  const db = await mysql.createConnection({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, charset: 'utf8mb4', multipleStatements: true });
  const ids = [randomUUID(), ...Array.from({ length: 6 }, () => randomUUID())];
  try {
    const schema = await readFile(new URL('../deploy/schema.mysql.sql', import.meta.url), 'utf8');
    await db.query(schema);
    await db.query(schema);
    const [versions] = await db.query('SELECT VERSION() AS engine');
    const [migration] = await db.query('SELECT version, checksum FROM schema_migrations');
    assert.equal(migration.length, 1);
    assert.equal(migration[0].checksum, schema.match(/checksum: ([a-f0-9]{64})/)[1]);
    const first = await send(data, ids[0]);
    assert.equal(first.status, 201);
    const reference = (await first.json()).reference;
    const retries = await Promise.all(Array.from({ length: 8 }, () => send(data, ids[0])));
    for (const retry of retries) {
      assert.equal(retry.status, 200);
      assert.equal((await retry.json()).reference, reference);
    }
    assert.equal((await send({ ...data, details: 'CHANGED TEST PAYLOAD' }, ids[0])).status, 409);
    const results = await Promise.all(ids.slice(1).map(id => send(data, id)));
    assert.ok(results.every(result => result.status === 201));
    const [rows] = await db.execute('SELECT * FROM enquiries WHERE id = ?', [ids[0]]);
    assert.equal(rows.length, 1);
    for (const key of ['name', 'phone', 'email', 'suburb', 'service', 'property', 'size', 'details']) assert.equal(rows[0][key], data[key]);
    assert.equal(rows[0].preferred_date, data.date);
    assert.equal(rows[0].preferred_time, data.time);
    assert.match(rows[0].created_at, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    const [counts] = await db.execute('SELECT COUNT(*) AS count FROM enquiries WHERE id IN (' + ids.map(() => '?').join(',') + ')', ids);
    assert.equal(counts[0].count, ids.length);
    console.log(`PASS: ${routes.length} pages and ${assets.size} assets; ${versions[0].engine}; schema replay/checksum, stored fields, Unicode, concurrent submissions and safe retries.`);
  } finally {
    for (const id of ids) await db.execute('DELETE FROM enquiries WHERE id = ?', [id]);
    await db.end();
  }
}
