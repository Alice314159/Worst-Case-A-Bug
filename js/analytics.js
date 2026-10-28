/* Anonymous per-tab page views; no cookies, full referrer URLs or precise location. */
(() => {
  if (/\/admin(?:\/|$)/.test(location.pathname) || !['http:', 'https:'].includes(location.protocol)) return;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  const config = window.siteAnalytics || {};
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const endpoint = local ? config.localEndpoint : config.endpoint;
  if (!endpoint) return;
  let session;
  try {
    session = sessionStorage.getItem('wcab-analytics-session');
    if (!session) { session = crypto.randomUUID(); sessionStorage.setItem('wcab-analytics-session', session); }
  } catch { session = crypto.randomUUID(); }
  let referrer = '';
  try { if (document.referrer) referrer = new URL(document.referrer).origin; } catch { /* Optional. */ }
  const event = { id: crypto.randomUUID(), session, path: location.pathname, referrer };
  const send = () => fetch(`${endpoint.replace(/\/$/, '')}/api/collect`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(event), credentials: 'omit', keepalive: true }).catch(() => {});
  if (document.prerendering) document.addEventListener('prerenderingchange', send, { once: true });
  else send();
})();
