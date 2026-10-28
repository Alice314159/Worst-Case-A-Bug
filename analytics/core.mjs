/* Shared analytics API. No raw IPs, full referrer URLs or user-agent strings are stored. */
const UUID = /^[a-f0-9-]{36}$/i;
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers }
});
const text = (value, size = 100) => typeof value === 'string' ? value.trim().slice(0, size) : '';
const countryName = value => /^[A-Z]{2}$/.test(value || '') ? value : 'Unknown';
const origins = env => (env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
async function digest(value) {
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(x => x.toString(16).padStart(2, '0')).join('');
}
async function authorized(request, env) {
  if (!env.ADMIN_TOKEN) return false;
  const token = request.headers.get('authorization') || '';
  const a = await digest(token), b = await digest(`Bearer ${env.ADMIN_TOKEN}`);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
export async function handleAPI(request, env) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const allowed = origins(env).includes(origin);
  const cors = allowed ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  if (request.method === 'OPTIONS') {
    if (!allowed) return json({ error: 'Origin not allowed' }, 403);
    return new Response(null, { status: 204, headers: { ...cors, 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Max-Age': '600' } });
  }
  if (url.pathname === '/api/health' && request.method === 'GET') {
    return json({ ok: true, mode: env.MODE || 'cloud', geography: env.MODE === 'local' ? 'unavailable' : 'edge' }, 200, cors);
  }
  if (url.pathname === '/api/collect' && request.method === 'POST') {
    if (!allowed) return json({ error: 'Origin not allowed' }, 403);
    if (!env.VISITOR_SALT) return json({ error: 'Analytics not configured' }, 503, cors);
    if (/bot|crawler|spider|slurp/i.test(request.headers.get('user-agent') || '')) return new Response(null, { status: 204, headers: cors });
    const raw = await request.text();
    if (raw.length > 2048) return json({ error: 'Event too large' }, 413, cors);
    let event;
    try { event = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON' }, 400, cors); }
    if (!event || typeof event !== 'object' || !UUID.test(event.id || '') || !UUID.test(event.session || '')) return json({ error: 'Invalid event' }, 400, cors);
    let path = text(event.path, 240);
    if (!/^\/[a-zA-Z0-9_./-]*$/.test(path) || path.includes('..') || /\/admin(?:\/|$)/.test(path)) return json({ error: 'Invalid page path' }, 400, cors);
    if (path.endsWith('/')) path += 'index.html';
    let referrer = 'Direct';
    if (event.referrer) {
      try {
        const ref = new URL(event.referrer);
        if (!['https:', 'http:'].includes(ref.protocol)) throw new Error();
        referrer = origins(env).includes(ref.origin) ? 'Internal' : ref.hostname.toLowerCase().slice(0, 120);
      } catch { return json({ error: 'Invalid referrer' }, 400, cors); }
    }
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    const session = await digest(`${env.VISITOR_SALT}:${day}:${event.session}`);
    const cf = env.MODE === 'local' ? {} : (request.cf || {});
    const ua = request.headers.get('user-agent') || '';
    const device = /ipad|tablet/i.test(ua) ? 'Tablet' : /mobile|iphone|android/i.test(ua) ? 'Mobile' : 'Desktop';
    const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Other';
    // Per-session daily cap limits accidental loops; this is not an anti-abuse guarantee.
    const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM pageviews WHERE day = ? AND session_hash = ?').bind(day, session).first();
    if (count.n >= 500) return json({ error: 'Daily session limit reached' }, 429, cors);
    await env.DB.prepare('INSERT OR IGNORE INTO pageviews (event_id, occurred_at, day, session_hash, path, referrer, country, region, city, device, browser) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(event.id, now.toISOString(), day, session, path, referrer, countryName(cf.country), text(cf.region) || 'Unknown', text(cf.city) || 'Unknown', device, browser).run();
    await env.DB.prepare('DELETE FROM pageviews WHERE day < ?').bind(new Date(now.getTime() - 90 * 86400000).toISOString().slice(0, 10)).run();
    return new Response(null, { status: 204, headers: cors });
  }
  if (url.pathname.startsWith('/api/admin/')) {
    if (!(await authorized(request, env))) return json({ error: 'Authentication required' }, 401, cors);
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405, cors);
    if (url.pathname !== '/api/admin/stats') return json({ error: 'Not found' }, 404, cors);
    const days = Number(url.searchParams.get('days') || '7');
    if (![7, 30, 90].includes(days)) return json({ error: 'Invalid date range' }, 400, cors);
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - (days - 1) * 86400000).toISOString().slice(0, 10);
    const q = (sql, ...args) => env.DB.prepare(sql).bind(...args);
    const [totals, trend, pages, locations, referrers, devices, browsers, recent] = await Promise.all([
      q('SELECT COUNT(*) AS views, COUNT(DISTINCT session_hash) AS sessions, COUNT(DISTINCT path) AS pages, MAX(occurred_at) AS last_visit FROM pageviews WHERE day >= ?', start).first(),
      q('SELECT day, COUNT(*) AS views, COUNT(DISTINCT session_hash) AS sessions FROM pageviews WHERE day >= ? GROUP BY day ORDER BY day', start).all(),
      q('SELECT path, COUNT(*) AS views FROM pageviews WHERE day >= ? GROUP BY path ORDER BY views DESC, path LIMIT 20', start).all(),
      q('SELECT country, region, city, COUNT(*) AS views FROM pageviews WHERE day >= ? GROUP BY country, region, city ORDER BY views DESC LIMIT 30', start).all(),
      q('SELECT referrer, COUNT(*) AS views FROM pageviews WHERE day >= ? GROUP BY referrer ORDER BY views DESC LIMIT 15', start).all(),
      q('SELECT device AS name, COUNT(*) AS views FROM pageviews WHERE day >= ? GROUP BY device ORDER BY views DESC', start).all(),
      q('SELECT browser AS name, COUNT(*) AS views FROM pageviews WHERE day >= ? GROUP BY browser ORDER BY views DESC', start).all(),
      q('SELECT occurred_at, path, country, city, device FROM pageviews WHERE day >= ? ORDER BY occurred_at DESC LIMIT 20', start).all()
    ]);
    const series = new Map(trend.results.map(row => [row.day, row]));
    const filled = Array.from({ length: days }, (_, i) => {
      const day = new Date(Date.parse(start) + i * 86400000).toISOString().slice(0, 10);
      return series.get(day) || { day, views: 0, sessions: 0 };
    });
    return json({ totals, trend: filled, pages: pages.results, locations: locations.results, referrers: referrers.results, devices: devices.results, browsers: browsers.results, recent: recent.results,
      meta: { days, start, timezone: 'UTC', retention_days: 90, mode: env.MODE || 'cloud', geography: env.MODE === 'local' ? 'unavailable' : 'edge', session_definition: 'Daily, per-tab sessions; not unique people.' } }, 200, cors);
  }
  return json({ error: 'Not found' }, 404, cors);
}
