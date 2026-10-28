import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync, existsSync, writeFileSync, copyFileSync, chmodSync } from 'node:fs';
import { randomBytes, createHash } from 'node:crypto';
import { tmpdir, homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { handleAPI } from './core.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectID = createHash('sha256').update(root).digest('hex').slice(0, 12);
const appData = process.platform === 'darwin' ? resolve(homedir(), 'Library/Application Support/Worst Case a Bug') : process.platform === 'win32' ? resolve(process.env.LOCALAPPDATA || homedir(), 'Worst Case a Bug') : resolve(homedir(), '.local/share/worst-case-a-bug');
const state = process.env.ANALYTICS_STATE_DIR || resolve(appData, `analytics-${projectID}`);
mkdirSync(state, { recursive: true, mode: 0o700 });
// Preserve visits collected during the initial local preview when moving to durable storage.
const legacy = resolve(tmpdir(), `wcab-analytics-${projectID}`);
for (const file of ['admin-token', 'visitor-salt', 'visits.sqlite']) {
  if (!process.env.ANALYTICS_STATE_DIR && !existsSync(resolve(state, file)) && existsSync(resolve(legacy, file))) {
    copyFileSync(resolve(legacy, file), resolve(state, file)); chmodSync(resolve(state, file), 0o600);
  }
}
const secret = name => {
  const file = resolve(state, name);
  if (!existsSync(file)) writeFileSync(file, randomBytes(32).toString('hex'), { mode: 0o600 });
  return readFileSync(file, 'utf8').trim();
};
const db = new DatabaseSync(process.env.ANALYTICS_DB || resolve(state, 'visits.sqlite'));
db.exec(readFileSync(resolve(root, 'analytics/schema.sql'), 'utf8'));
db.exec('PRAGMA journal_mode=WAL;');
const purge = () => db.prepare('DELETE FROM pageviews WHERE day < ?').run(new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10));
purge();
const purgeTimer = setInterval(purge, 3600000); purgeTimer.unref();
export function adaptDatabase(database) {
  return { prepare(sql) {
    let params = [];
    return { bind(...args) { params = args; return this; }, async first() { return database.prepare(sql).get(...params) || null; }, async all() { return { results: database.prepare(sql).all(...params) }; }, async run() { return database.prepare(sql).run(...params); } };
  } };
}
const port = Number(process.env.ANALYTICS_PORT || 8788);
const env = {
  DB: adaptDatabase(db), MODE: 'local',
  ADMIN_TOKEN: process.env.ANALYTICS_ADMIN_TOKEN || secret('admin-token'),
  VISITOR_SALT: secret('visitor-salt'),
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || `http://localhost:8000,http://127.0.0.1:8000,http://localhost:${port},http://127.0.0.1:${port}`
};
const files = new Map([['/admin/', ['admin/index.html', 'text/html; charset=utf-8']], ['/admin/admin.css', ['admin/admin.css', 'text/css']], ['/admin/admin.js', ['admin/admin.js', 'application/javascript']]]);
const server = http.createServer(async (req, res) => {
  try {
    const origin = `http://127.0.0.1:${port}`;
    const url = new URL(req.url, origin);
    if (url.pathname === '/' || url.pathname === '/admin') { res.writeHead(302, { Location: '/admin/' }); return res.end(); }
    if (files.has(url.pathname) && req.method === 'GET') {
      const [file, mime] = files.get(url.pathname);
      res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self' http://127.0.0.1:8788 http://localhost:8788; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'" });
      return res.end(readFileSync(resolve(root, file)));
    }
    if (!url.pathname.startsWith('/api/')) { res.writeHead(404); return res.end('Not found'); }
    let chunks = [], size = 0;
    for await (const chunk of req) { size += chunk.length; if (size > 4096) { res.writeHead(413); return res.end(); } chunks.push(chunk); }
    const request = new Request(url, { method: req.method, headers: req.headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body: Buffer.concat(chunks), duplex: 'half' } : {}) });
    const response = await handleAPI(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) { console.error('Analytics request failed:', error.message); res.writeHead(500, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: 'Server error' })); }
});
server.listen(port, '127.0.0.1', () => {
  console.log(`Analytics admin: http://127.0.0.1:${port}/admin/`);
  console.log(`Local admin key file: ${resolve(state, 'admin-token')}`);
  console.log(`Local database: ${process.env.ANALYTICS_DB || resolve(state, 'visits.sqlite')}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => { db.close(); process.exit(); }));
