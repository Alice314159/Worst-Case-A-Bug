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
