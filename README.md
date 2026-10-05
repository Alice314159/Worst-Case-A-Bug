# My AI Journey

Personal website built as a static site for GitHub Pages.

## Structure

- `index.html` — home page
- `projects/` — portfolio and project pages
- `about/` — personal site / about page
- `assets/` — images and icons
- `css/` — site CSS (reserved for future separation)
- `js/` — runtime scripts
- `_ds/` — design-system runtime required by the exported pages

## Local preview

Open `index.html` in a browser, or run a local static server from this folder.

For example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

Push the repository to GitHub and configure GitHub Pages to deploy from the `main` branch and `/ (root)`.
