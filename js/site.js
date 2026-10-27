/* Shared navigation and language preferences. No framework or build step required. */
(() => {
  const root = document.documentElement;
  const navigation = [...document.querySelectorAll('[data-nav]')];
  const toggle = document.querySelector('[data-lang-toggle]');
  const route = root.dataset.currentPage || 'home';
  root.dataset.route = route;
  function updateTitle() {
    const title = root.dataset.lang === 'zh' ? root.dataset.titleZh : root.dataset.titleEn;
    document.title = `${title} · Worst Case, a Bug`;
  }

  function setLanguage(language) {
    root.dataset.lang = language;
    root.lang = language === 'zh' ? 'zh-CN' : 'en';
    toggle.textContent = language === 'zh' ? 'EN' : '中文';
    toggle.setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换到中文');
    document.querySelectorAll('.product-preview-close').forEach(button => {
      button.setAttribute('aria-label', language === 'zh' ? '关闭预览' : 'Close preview');
    });
    const productFilters = document.querySelector('.product-filters[aria-label="Product platform"]');
    if (productFilters) productFilters.setAttribute('aria-label', language === 'zh' ? '产品平台筛选' : 'Product platform filters');
    document.querySelectorAll('[data-placeholder-en]').forEach(slot => {
      slot.setAttribute('placeholder', slot.getAttribute(`data-placeholder-${language}`));
    });
    updateTitle();
  }

  let language = 'en';
  try {
    if (localStorage.getItem('wcab-lang') === 'zh') language = 'zh';
  } catch { /* Storage may be disabled; navigation and language still work. */ }
  setLanguage(language);
  toggle.addEventListener('click', () => {
    const next = root.dataset.lang === 'en' ? 'zh' : 'en';
    setLanguage(next);
    try { localStorage.setItem('wcab-lang', next); } catch { /* Optional preference. */ }
  });
  document.querySelector('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    document.querySelector('[data-main]').focus();
  });
  const filters = [...document.querySelectorAll('[data-filter]')];
  filters.forEach(button => button.addEventListener('click', () => {
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    document.querySelectorAll('[data-platform]').forEach(item => {
      item.hidden = button.dataset.filter !== 'all' && item.dataset.platform !== button.dataset.filter;
    });
  }));
  const motionButtons = [...document.querySelectorAll('[data-poem-motion]')];
  motionButtons.forEach(button => button.addEventListener('click', () => {
    const paused = root.dataset.poemMotion !== 'paused';
    root.dataset.poemMotion = paused ? 'paused' : 'running';
    motionButtons.forEach(control => {
      control.setAttribute('aria-pressed', String(paused));
      control.querySelector('[data-l="zh"]').textContent = paused ? '播放动态效果' : '暂停动态效果';
      control.querySelector('[data-l="en"]').textContent = paused ? 'Play motion' : 'Pause motion';
    });
  }));
  const activeLink = navigation.find(link => link.dataset.nav === route);
  if (activeLink && matchMedia('(max-width: 980px)').matches) {
    const nav = activeLink.parentElement;
    nav.scrollLeft = activeLink.offsetLeft - nav.clientWidth / 2 + activeLink.clientWidth / 2;
  }
})();
