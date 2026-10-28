# Local website analytics

A separate, authenticated local analytics service for the static website.
Tested on the installed Node.js 26.0.0. It uses Node's built-in HTTP server and
SQLite; no npm dependencies are needed. The existing website stays static.

## Start

Keep the website preview running at `http://localhost:8000`, then run:

```bash
npm run analytics
```

Open `http://127.0.0.1:8788/admin/`. The server prints the location of the local
admin-key file. Copy that file's contents into the login field. The generated key
has 256 bits of randomness and is not included in the repository. Authentication
is required for every statistics API request, not just for displaying the UI.
The dashboard holds the key only in memory and clears the form after login;
refreshing the page requires signing in again.

The service binds to `127.0.0.1` only. Stop it with Ctrl+C. It can be restarted
with the same command without losing the local data.

## Data location

Keys, the hashing salt and the SQLite database are stored under a project-specific
private folder in the user application-data directory, OUTSIDE the static
website root. On macOS this is inside `~/Library/Application Support/Worst Case a Bug/`. The full folder is printed at startup. Do not move these files into
the web root. Back up the printed state directory as needed, or set `ANALYTICS_STATE_DIR`
to another private, persistent directory outside the website before starting the service.

Optional environment variables:

- `ANALYTICS_STATE_DIR`: private state folder outside the static site.
- `ANALYTICS_DB`: custom SQLite path outside the static site.
- `ANALYTICS_ADMIN_TOKEN`: override the generated key (keep it secret).
- `ANALYTICS_PORT`: local port, default 8788. Update client configuration and
  dashboard connection/CSP settings together if changing it.
- `ALLOWED_ORIGINS`: comma-separated permitted website origins. Default includes
  localhost/127.0.0.1 on ports 8000 and 8788.

## Collection and definitions

`js/analytics-config.js` and `js/analytics.js` are included on all 37 public
content pages. Local pages send events to the loopback service. The production
endpoint is configured as https://wcab-analytics.worstcaseabug.workers.dev.
The updated frontend must be published before online collection starts.

Each page load records one page view; anchor/category changes do not create new
page views. Directory home paths normalize to `index.html`. Event IDs prevent
replaying the same event from adding another count. A random session key is kept
in sessionStorage and hashed with a server salt and UTC date. The dashboard's
**daily sessions** are not unique people and cannot be used as a unique-visitor
estimate. Sessions across different days count separately.

Only the page path, referrer hostname (or direct/internal), broad device/browser
categories, event time and anonymous daily session hash are stored. URL queries,
fragments, full referrer URLs, raw IPs and raw user agents are not stored.
Do Not Track and Global Privacy Control disable collection. Admin pages and
obvious bot user agents are excluded. The collection API restricts browser origins
and caps individual daily sessions at 500 views; this is lightweight measurement,
not an abuse-proof public analytics platform.

Records older than the 90-day cutoff are purged at startup, on collection, and
hourly while the local service is running. Backups should follow the same policy.

## Geography

Local visits have country, region and city set to Unknown. The service does not
call third-party IP lookup APIs and does not request browser geolocation.
`core.mjs` supports trusted edge metadata for a later hosted adapter, but no cloud
service or live geography provider is configured. Client-supplied location values
are ignored. A production deployment and provider setup remain separate work.

## Tests

```bash
npm run test:analytics
```

The tests use isolated, in-memory SQLite databases. They cover authentication,
origin restrictions, event deduplication, daily session counts, retention,
geography spoofing, query/referrer minimization, path normalization and browser
privacy opt-out behavior. No fake visits or sample cities are inserted into the
real local database. Browser verification does add real local preview visits.

## Cloudflare deployment

The Worker adapter and Wrangler configuration are prepared in this directory.
The configured Worker health endpoint has been verified online. The public frontend
must be republished to activate the endpoint configuration.
Follow `CLOUDFLARE.md` (Chinese) to create D1, configure encrypted secrets, deploy
and connect the existing GitHub Pages frontend. Node tests cover adapter routing
and fail-closed behavior; the Cloudflare HTMLRewriter/static-assets integration
still needs verification in the actual Workers runtime after account setup.
