import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {join, dirname, relative, normalize} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// 404.html uses absolute paths for the published address.
const SKIP_REFS = new Set(['404.html']);
// Compatibility redirects for old links: no content of their own.
const REDIRECTS = new Set(['work.html', 'stories.html', 'poems.html', 'projects/index.html']);
const contentPages = () => pages.filter(p => !p.startsWith('admin/') && p !== '404.html' && !REDIRECTS.has(p));

function htmlFiles(dir) {
  return readdirSync(dir).flatMap(name => {
    if (name === '.git' || name === 'node_modules') return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [relative(root, full)] : [];
  });
}
const pages = htmlFiles(root);
const sources = new Map(pages.map(p => [p, readFileSync(join(root, p), 'utf8')]));
const idsOf = html => new Set([...html.matchAll(/\s(?:id|name)="([^"]+)"/g)].map(m => m[1]));

function refsOf(html) {
  const refs = [...html.matchAll(/\s(?:href|src|poster)="([^"]*)"/g)].map(m => m[1]);
  for (const m of html.matchAll(/\ssrcset="([^"]*)"/g)) {
    refs.push(...m[1].split(',').map(part => part.trim().split(/\s+/)[0]));
  }
  return refs.map(r => r.replaceAll('&amp;', '&')).filter(r => r && !/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(r));
}

function resolve(page, ref) {
  const [pathPart, fragment = ''] = ref.split('#');
  const path = decodeURIComponent(pathPart.split('?')[0]);
  let target = path ? normalize(join(dirname(page), path)) : page;
  if (path.endsWith('/') || (existsSync(join(root, target)) && statSync(join(root, target)).isDirectory())) {
    target = join(target, 'index.html');
  }
  return {target, fragment};
}

test('every internal link, asset and anchor resolves', () => {
  const problems = [];
  for (const [page, html] of sources) {
    if (SKIP_REFS.has(page)) continue;
    for (const ref of refsOf(html)) {
      const {target, fragment} = resolve(page, ref);
      if (!existsSync(join(root, target))) { problems.push(`${page}: missing ${ref}`); continue; }
      if (fragment && sources.has(target) && !idsOf(sources.get(target)).has(fragment)) {
        problems.push(`${page}: missing anchor ${ref}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test('every content page is listed in sitemap.xml', () => {
  const sitemap = readFileSync(join(root, 'sitemap.xml'), 'utf8');
  const missing = contentPages().filter(p => !sitemap.includes(`/Worst-Case-A-Bug/${p === 'index.html' ? '' : p}<`));
  assert.deepEqual(missing, []);
});

test('every page has a title and description', () => {
  const missing = contentPages().filter(p => !/<title>[^<]+<\/title>/.test(sources.get(p)) || !/<meta[^>]+name="description"/.test(sources.get(p)));
  assert.deepEqual(missing, []);
});
