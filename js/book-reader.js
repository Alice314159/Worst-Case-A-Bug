/* Optional reading preferences. Every chapter remains readable without JavaScript. */
(() => {
  const ids = new Set(['preface', ...Array.from({length:16}, (_, i) => `chapter-${String(i+1).padStart(2,'0')}`), 'afterword']);
  const reader = document.querySelector('[data-book-chapter]');
  const resume = document.querySelector('[data-book-resume]');
  try {
    const last = localStorage.getItem('wcab-book-restart-chapter');
    if (resume && ids.has(last)) { resume.href = `books/restart/${last}.html`; resume.hidden = false; }
    if (reader && ids.has(reader.dataset.bookChapter)) localStorage.setItem('wcab-book-restart-chapter', reader.dataset.bookChapter);
  } catch { /* Reading and navigation do not require storage. */ }
  if (!reader) return;
  const article = reader.querySelector('.reader-article');
  let size = 17;
  try { const saved = Number(localStorage.getItem('wcab-book-font')); if (saved >= 15 && saved <= 23) size = saved; } catch { /* Optional. */ }
  const controls = [...reader.querySelectorAll('[data-reader-size]')];
  const apply = () => {
    article.style.setProperty('--reader-size', `${size}px`);
    controls.forEach(button => { button.disabled = Number(button.dataset.readerSize) < 0 ? size <= 15 : size >= 23; });
  };
  apply();
  controls.forEach(button => button.addEventListener('click', () => {
    size = Math.max(15, Math.min(23, size + Number(button.dataset.readerSize)));
    apply();
    try { localStorage.setItem('wcab-book-font', String(size)); } catch { /* Optional. */ }
  }));
})();

/* Keep book metadata and accessible labels in sync with the site's language. */
(() => {
  const root = document.documentElement;
  if (root.dataset.currentPage !== 'books') return;
  const sync = () => {
    const lang = root.dataset.lang === 'en' ? 'en' : 'zh';
    const description = root.dataset[lang === 'en' ? 'descriptionEn' : 'descriptionZh'];
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    document.querySelectorAll('[data-aria-en]').forEach(element => {
      element.setAttribute('aria-label', element.dataset[lang === 'en' ? 'ariaEn' : 'ariaZh']);
    });
  };
  new MutationObserver(sync).observe(root, {attributes:true, attributeFilter:['data-lang']});
  sync();
})();

/* A compact volume index; chapter pages remain separate, fully readable pages. */
(() => {
  const sections = [...document.querySelectorAll('.book-toc .book-volume-section')];
  const volumes = sections.map(section => {
    const details = document.createElement('details');
    details.className = 'book-volume-section book-volume-fold';
    details.id = section.id;
    const summary = document.createElement('summary');
    const banner = section.querySelector('.book-volume-banner');
    if (!banner) return null;
    summary.append(banner);
    const mark = document.createElement('span');
    mark.className = 'book-volume-fold-mark'; mark.textContent = '+';mark.setAttribute('aria-hidden','true');summary.append(mark);
    details.append(summary);
    while (section.firstChild) details.append(section.firstChild);
    section.replaceWith(details);
    details.addEventListener('toggle', () => {
      if (details.open) volumes.forEach(other => { if (other && other !== details) other.open = false; });
    });
    return details;
  }).filter(Boolean);
  const openHash = () => {
    const target = volumes.find(volume => '#'+volume.id === location.hash);
    if (target) { target.open = true; requestAnimationFrame(() => target.scrollIntoView({block:'start'})); }
  };
  window.addEventListener('hashchange',openHash);
  document.querySelectorAll('a[href^="#volume-"]').forEach(link => link.addEventListener('click',() => {
    const target = volumes.find(volume => '#'+volume.id === link.getAttribute('href'));
    if (target) target.open = true;
  }));
  openHash();
})();
