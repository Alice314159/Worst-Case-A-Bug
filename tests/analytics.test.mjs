import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { handleAPI } from '../analytics/core.mjs';

function context() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(new URL('../analytics/schema.sql', import.meta.url), 'utf8'));
  const DB = { prepare(sql) { let params = []; return {
    bind(...args) { params = args; return this; },
    async first() { return db.prepare(sql).get(...params); },
    async all() { return { results: db.prepare(sql).all(...params) }; },
    async run() { return db.prepare(sql).run(...params); }
  }; } };
  return { db, env: { DB, MODE: 'local', ADMIN_TOKEN: 'test-only-key', VISITOR_SALT: 'test-only-salt', ALLOWED_ORIGINS: 'http://localhost:8000' } };
}
const payload = (session = crypto.randomUUID()) => ({ id: crypto.randomUUID(), session, path: '/quant.html', referrer: 'https://example.org/article?email=private@example.org' });
const collect = (env, data, origin = 'http://localhost:8000', cf) => {
  const request = new Request('http://localhost/api/collect', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/130.0.0.0' }, body: typeof data === 'string' ? data : JSON.stringify(data) });
  if (cf) Object.defineProperty(request, 'cf', { value: cf });
  return handleAPI(request, env);
};
const stats = (env, token = 'test-only-key', days = '7') => handleAPI(new Request(`http://localhost/api/admin/stats?days=${days}`, { headers: { Authorization: `Bearer ${token}` } }), env);

test('admin stats are protected and invalid time ranges are rejected', async () => {
  const { env, db } = context();
  assert.equal((await stats(env, '')).status, 401);
  assert.equal((await stats(env, 'wrong')).status, 401);
  assert.equal((await stats(env, 'test-only-key', '999')).status, 400);
  const response = await stats(env); assert.equal(response.status, 200);
  const data = await response.json(); assert.equal(data.totals.views, 0); assert.equal(data.trend.length, 7); assert(data.trend.every(x => x.views === 0));
  db.close();
});
test('counts page views, deduplicates event IDs and groups daily sessions correctly', async () => {
  const { env, db } = context(); const session = crypto.randomUUID(), event = payload(session);
  assert.equal((await collect(env, event)).status, 204);
  assert.equal((await collect(env, event)).status, 204);
  await collect(env, payload(session)); await collect(env, payload());
  const data = await (await stats(env)).json(); assert.equal(data.totals.views, 3); assert.equal(data.totals.sessions, 2); assert.equal(data.totals.pages, 1);
  db.close();
});
test('stores only referrer hostname and hashed session; local geo cannot be spoofed', async () => {
  const { env, db } = context(); const event = payload();
  await collect(env, event, 'http://localhost:8000', { country: 'US', city: 'Spoofed' });
  const row = db.prepare('SELECT * FROM pageviews').get();
  assert.equal(row.referrer, 'example.org'); assert.notEqual(row.session_hash, event.session); assert.equal(row.country, 'Unknown'); assert.equal(row.city, 'Unknown');
  assert(!JSON.stringify(row).includes('private@example.org')); assert(!Object.hasOwn(row, 'ip'));
  db.close();
});
test('rejects unapproved origins, malformed events, oversized events and admin paths', async () => {
  const { env, db } = context();
  assert.equal((await collect(env, payload(), 'https://untrusted.example')).status, 403);
  assert.equal((await collect(env, '{')).status, 400);
  assert.equal((await collect(env, 'x'.repeat(3000))).status, 413);
  assert.equal((await collect(env, { ...payload(), path: '/admin/' })).status, 400);
  assert.equal((await collect(env, { ...payload(), path: '/x?secret=1' })).status, 400);
  assert.equal((await collect(env, { ...payload(), path: '/../../secret' })).status, 400);
  assert.equal((await collect(env, null)).status, 400);
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM pageviews').get().n, 0);
  db.close();
});
test('retention removes older rows and region dimensions are available in cloud mode', async () => {
  const { env, db } = context(); env.MODE = 'cloud';
  db.prepare('INSERT INTO pageviews VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(crypto.randomUUID(), '2020-01-01T00:00:00Z', '2020-01-01', 'old-session', '/old.html', 'Direct', 'Unknown', 'Unknown', 'Unknown', 'Desktop', 'Other');
  await collect(env, payload(), 'http://localhost:8000', { country: 'US', region: 'California', city: 'Example city' });
  assert.equal(db.prepare('SELECT COUNT(*) AS n FROM pageviews').get().n, 1);
  const data = await (await stats(env)).json(); assert.equal(data.locations[0].country, 'US'); assert.equal(data.locations[0].city, 'Example city'); assert.equal(data.meta.geography, 'edge');
  db.close();
});
test('CORS preflight has explicit origin and private endpoints stay private', async () => {
  const { env, db } = context();
  const response = await handleAPI(new Request('http://localhost/api/collect', { method: 'OPTIONS', headers: { Origin: 'http://localhost:8000' } }), env);
  assert.equal(response.status, 204); assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8000');
  assert.equal((await handleAPI(new Request('http://localhost/api/admin/missing', { headers: { Authorization: 'Bearer test-only-key' } }), env)).status, 404);
  assert.equal((await handleAPI(new Request('http://localhost/api/admin/stats', { method: 'POST', headers: { Authorization: 'Bearer test-only-key' } }), env)).status, 405);
  db.close();
});

test('normalizes directory home paths and distinguishes internal navigation', async () => {
  const { env, db } = context();
  await collect(env, { ...payload(), path: '/', referrer: 'http://localhost:8000/about.html?private=1' });
  await collect(env, { ...payload(), path: '/index.html' });
  const data = await (await stats(env)).json(); assert.equal(data.totals.pages, 1);
  assert.equal(data.pages[0].path, '/index.html'); assert(data.referrers.some(x => x.referrer === 'Internal'));
  db.close();
});

import vm from 'node:vm';
function runTracker(overrides = {}) {
  const events = [], values = new Map();
  const context = { crypto, URL, location: { protocol: 'http:', hostname: 'localhost', pathname: '/index.html' }, navigator: {}, document: { referrer: 'https://example.org/post?private=1', prerendering: false }, sessionStorage: { getItem: k => values.get(k), setItem: (k, v) => values.set(k, v) }, fetch: async (url, options) => { events.push({ url, event: JSON.parse(options.body) }); return {}; } };
  context.window = context; context.siteAnalytics = { endpoint: '', localEndpoint: 'http://127.0.0.1:8788' };
  Object.assign(context, overrides);
  vm.runInNewContext(readFileSync(new URL('../js/analytics.js', import.meta.url), 'utf8'), context);
  return events;
}
test('tracker respects privacy signals and excludes admin or unconfigured production', () => {
  assert.equal(runTracker({ navigator: { doNotTrack: '1' } }).length, 0);
  assert.equal(runTracker({ navigator: { globalPrivacyControl: true } }).length, 0);
  assert.equal(runTracker({ location: { protocol: 'http:', hostname: 'localhost', pathname: '/admin/' } }).length, 0);
  assert.equal(runTracker({ location: { protocol: 'https:', hostname: 'alice314159.github.io', pathname: '/index.html' } }).length, 0);
  const rows = runTracker(); assert.equal(rows.length, 1); assert.equal(rows[0].event.referrer, 'https://example.org'); assert.equal(rows[0].event.path, '/index.html');
});

import worker from '../analytics/worker.mjs';
test('cloud adapter keeps private APIs protected and fails closed on database errors', async () => {
  const { env, db } = context();
  assert.equal((await worker.fetch(new Request('https://analytics.example/api/admin/stats'), env)).status, 401);
  const broken = { ...env, DB: { prepare() { throw new Error('private database detail'); } } };
  const response = await worker.fetch(new Request('https://analytics.example/api/admin/stats', { headers: { Authorization: 'Bearer test-only-key' } }), broken);
  assert.equal(response.status, 503); assert(!(await response.text()).includes('private database detail'));
  db.close();
});
test('cloud adapter exposes only its explicit admin asset paths', async () => {
  const { env, db } = context(); let requestedPath;
  env.ASSETS = { async fetch(request) { requestedPath = new URL(request.url).pathname; return new Response('/* admin script */', { headers: { 'Content-Type': 'application/javascript' } }); } };
  assert.equal((await worker.fetch(new Request('https://analytics.example/analytics/core.mjs'), env)).status, 404);
  const result = await worker.fetch(new Request('https://analytics.example/admin/admin.js'), env);
  assert.equal(requestedPath, '/admin.js'); assert.equal(result.status, 200); assert.equal(result.headers.get('Cache-Control'), 'no-store');
  const pending = []; await worker.scheduled({}, env, { waitUntil(promise) { pending.push(promise); } }); await Promise.all(pending);
  db.close();
});
