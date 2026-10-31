# Worst Case, a Bug

A bilingual static personal website for GitHub Pages. No build step is required.

## Pages

- `index.html` — homepage: introduction, two featured works, latest podcast episode
- `products.html` — main products and a compact small-tools list
- `products/*.html` — 15 standalone product detail pages (Strata and ParquetViewer are listed under quant)
- `quant.html` — Vesper quant project archive
- `quant/*.html` — eight independent research project pages
- `podcast.html` — published episodes, with unrecorded scripts and topics at the end
- `writing.html` — books & writing: the book, essays and poems (`#poems`)
- `book.html`, `books/restart/*.html` — book contents, chapters and downloads
- `essays/*.html` — three individual bilingual reading pages
- `poems/*.html` — two individual poem reading pages
- `journal.html` — trails and film, with `#trails` and `#film` anchors
- `about.html` — background and contact links
- `work.html`, `stories.html`, `poems.html` — redirects kept for old links
- `projects/index.html` — compatibility redirect to the product catalog

Every page includes its own content, shared navigation and relative asset links.
Pages work with GitHub Pages repository subdirectories and direct file browsing.
The HTML files are maintained directly. When changing shared navigation, update
all page headers. Shared appearance and behavior live in `css/` and `js/`.

## Navigation and language

Navigation uses normal page links, supporting refresh, bookmarks and browser
back/forward. Product features and screenshots live on detail pages rather than
expanding the catalog. The first language is English; the language button saves
the preference across pages when local storage is available. The skip link,
keyboard focus indicators and reduced-motion support are retained.

`js/legacy-routes.js` redirects former homepage links such as `/#products`,
`/#video` and `/#poem-rings-of-time` to the corresponding new pages. The script
runs only on the homepage. `js/site.js` manages language, platform filtering,
active navigation and poem motion controls; it no longer switches page content.

## Assets and content

`assets/icons/` contains app icons; `assets/projects/` contains project artwork;
`assets/poems/` contains poem illustrations; `assets/podcast/` contains cover art;
`assets/uploads/` contains user images; `assets/videos/` contains the short film.

Travel and About use captioned existing artwork until personal photographs are
supplied. Unconfigured repository links and contact details remain marked as
unavailable. The essays are three short bilingual notes on building tools,
reviewing research and protecting attention.

## Videos

Place videos and matching posters in `assets/videos/`. Use native `<video
controls playsinline preload="metadata">` with a poster and `<source>` in
`journal.html`. The site is static; commit media with the HTML for hosting.
`<image-slot>` accepts images only, not video playback.

## Podcast RSS

`js/podcast-data.js` bundles 24 supplied episodes, newest first. Only
`podcast.html` loads the podcast scripts. A live RSS request refreshes the
archive; bundled episodes remain available if the request fails. Audio requires
network access. Notes expand on demand; season filters appear at 30 or more
episodes with multiple seasons.

Refresh the snapshot using the Python standard library:

```bash
python3 scripts/update_podcast.py
```

A downloaded RSS XML path can also be passed. Failed or empty responses leave
existing data intact. Commit the updated data file with the site.

## Local preview and deployment

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. For GitHub Pages, select the `main` branch and the
repository root in Pages settings. Publish the complete directory tree so that
nested product, poem and essay links resolve.

## Quantitative project archive

The Vesper archive groups strategy/monitoring, data/tools, and models/sentiment.
Related earlier iterations are listed under project lineage rather than as
repeated cards. ParquetViewer links to its existing product detail page.
`docs/quant-content-sources.md` records the documentation and source modules used.
Only project descriptions are included; no account configuration, datasets or
reported performance numbers are published. Runtime behavior was not revalidated
as part of the website content update.

## Podcast episode artwork

All 24 bundled episodes have individually generated warm watercolor covers in
`assets/podcast/episodes/`. `prompts.json` records the built-in image generation
prompt set. The artwork illustrates episode themes rather than documenting real
people or locations. WebP files are lossless encodings of the generated images.
`js/podcast-artwork.js` maps artwork by episode URL and title independently of the
RSS snapshot, so refreshing the feed does not discard the mapping. Unmapped or
failed images fall back to the show cover. Covers load lazily after the first two
rows; on narrow screens they appear above the episode text.

## Local analytics dashboard

Run `npm run analytics` with the installed Node.js 26, then open
`http://127.0.0.1:8788/admin/`. The startup log shows the local admin-key file.
The dashboard shows page views, daily sessions, trends, top pages, approximate
location fields, referring sites and device/browser summaries. Local geography
remains Unknown. The frontend production endpoint is configured for the Cloudflare
Worker at https://wcab-analytics.worstcaseabug.workers.dev; publishing the frontend
update enables online collection.
Keys and data are kept outside the website root. Never place key files inside this folder; `secret/` is git-ignored as a safeguard. See `analytics/README.md` for
storage, privacy definitions, startup, backup and production limitations.
