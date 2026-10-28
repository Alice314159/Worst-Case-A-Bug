/* Cloudflare adapter: public collection API, authenticated stats, admin-only static bundle. */
import { handleAPI } from './core.mjs';
const securityHeaders = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
};
export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      if (url.pathname.startsWith('/api/')) return await handleAPI(request, { ...env, MODE: 'cloud' });
      if (url.pathname === '/' || url.pathname === '/admin') return Response.redirect(`${url.origin}/admin/`, 302);
      const assets = { '/admin/': '/index.html', '/admin/index.html': '/index.html', '/admin/admin.css': '/admin.css', '/admin/admin.js': '/admin.js' };
      if (!assets[url.pathname] || !['GET', 'HEAD'].includes(request.method)) return new Response('Not found', { status: 404, headers: securityHeaders });
      const assetURL = new URL(assets[url.pathname], request.url);
      const asset = await env.ASSETS.fetch(new Request(assetURL, request));
      let response = new Response(asset.body, asset);
      if (assetURL.pathname === '/index.html') {
        response = new HTMLRewriter().on('html', { element(element) {
          element.setAttribute('data-cloud-analytics', 'true');
          element.setAttribute('data-site-home', env.SITE_URL || '');
        } }).transform(response);
      }
      Object.entries(securityHeaders).forEach(([key, value]) => response.headers.set(key, value));
      return response;
    } catch {
      return Response.json({ error: 'Analytics service unavailable' }, { status: 503, headers: securityHeaders });
    }
  },
  async scheduled(controller, env, context) {
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
    context.waitUntil(env.DB.prepare('DELETE FROM pageviews WHERE day < ?').bind(cutoff).run());
  }
};
