# Worst Case, a Bug

A bilingual static personal website for GitHub Pages. No build step is required.

## Structure

- `index.html` — all nine sections and bilingual content
- `css/style.css` — layout, responsive navigation, and language visibility
- `js/site.js` — hash routing, active navigation, titles, and language preferences
- `js/image-slot.js` — image placeholders
- `assets/` — images and icons
- `css/base.css` — shared typography, colors, and UI components

## Navigation and language

Sections use `#home`, `#products`, `#quant`, `#podcast`, `#video`, `#writing`,
`#poems`, `#life`, and `#about`. Direct links, reloads, and browser back/forward
use the same routing logic. Empty or unknown hashes show the home section.

The initial language is English. The language button switches between English
and Chinese and saves the preference when local storage is available.

Only `index.html` is maintained; old page exports and redirect entries have been removed.
Relative paths support GitHub Pages repository subdirectories and opening
`index.html` directly from disk.

Unconfigured repository and episode links are displayed as unavailable text.
Replace them with real destinations when available. The email contact is marked as unavailable until a real address is supplied; some
content and image slots are still pending. The missing background music control is omitted.

## Browsing improvements

Products can be filtered by iOS or desktop. Mobile navigation stays visible and
keeps the active section in view. Keyboard users can skip to the main content;
section changes focus the new heading. Animations respect reduced-motion settings.

## Local preview

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`. To deploy on GitHub Pages, select the `main` branch
and `/ (root)` directory in the repository's Pages settings.

## Podcast RSS

The archive shows all supplied episodes, newest first, with a compact header,
full-width rows, expandable notes, and audio controls. `js/podcast-data.js`
bundles 24 real episodes so RSS CORS failures do not leave the page empty.
A live RSS request refreshes the archive when the podcast section opens.
At 30 or more episodes with multiple RSS seasons, season filters appear;
unassigned episodes remain available. Episode titles are preserved as published.

Refresh the bundled data before publishing (Python standard library only):

```bash
python3 scripts/update_podcast.py
```

You can also pass a downloaded RSS XML path. A failed or empty response leaves
existing data intact. Commit the updated `js/podcast-data.js` with the website.
The snapshot needs this refresh when live requests are blocked. Audio playback
still needs network access. The RSS URL is in `index.html` and the update script.

## Poetry collection

`#poems` displays two illustrated covers. The complete poems have shareable
reading views at `#poem-rings-of-time` and `#poem-mooncake-waiting`.
Each view includes collection and adjacent-poem links, with browser history
support. The reading column is capped at 600px; covers stack on small screens.
