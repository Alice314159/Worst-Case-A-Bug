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
  let explicitLanguage = false;
  let cachedRegion = false;
  try {
    const saved = localStorage.getItem('wcab-lang');
    if (saved === 'zh' || saved === 'en') { language = saved; explicitLanguage = true; }
  } catch { /* Optional manual preference. */ }
  if (!explicitLanguage) {
    try {
      const cached = JSON.parse(sessionStorage.getItem('wcab-region-language') || 'null');
      if (cached && ['zh', 'en'].includes(cached.language) && Date.now() - cached.time >= 0 && Date.now() - cached.time < 1800000) {
        language = cached.language; cachedRegion = true;
      }
    } catch { /* Ignore expired or invalid session hints. */ }
  }
  setLanguage(language);
  toggle.addEventListener('click', () => {
    explicitLanguage = true;
    const next = root.dataset.lang === 'en' ? 'zh' : 'en';
    setLanguage(next);
    try { localStorage.setItem('wcab-lang', next); } catch { /* Optional preference. */ }
  });
  async function detectRegionLanguage() {
    if (explicitLanguage || cachedRegion) return;
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    const endpoint = local ? window.siteAnalytics?.localEndpoint : window.siteAnalytics?.endpoint;
    if (!endpoint) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    try {
      const url = new URL('/api/locale', endpoint);
      if (!local && url.protocol !== 'https:') return;
      const response = await fetch(url.href, { credentials:'omit', signal:controller.signal, referrerPolicy:'no-referrer' });
      if (!response.ok) return;
      const result = await response.json();
      if (!['zh', 'en'].includes(result.language) || explicitLanguage) return;
      // Another page may have saved a manual preference while this request ran.
      try {
        const saved = localStorage.getItem('wcab-lang');
        if (saved === 'zh' || saved === 'en') { explicitLanguage = true; setLanguage(saved); return; }
      } catch { /* Use this page's manual-selection flag. */ }
      setLanguage(result.language);
      try { sessionStorage.setItem('wcab-region-language', JSON.stringify({ language:result.language, time:Date.now() })); } catch { /* Optional cache. */ }
    } catch { /* Keep English when location detection is unavailable. */ }
    finally { clearTimeout(timeout); }
  }
  // The public endpoint configuration is loaded by a later deferred script.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', detectRegionLanguage, {once:true});
  else detectRegionLanguage();
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
  document.querySelectorAll('[data-copy-email]').forEach(button => {
    button.addEventListener('click', async () => {
      const status = document.querySelector('.contact-status');
      try {
        await navigator.clipboard.writeText(button.dataset.copyEmail);
        status.textContent = '';
        clearTimeout(button.copyResetTimer);
        button.querySelector('[data-l="zh"]').textContent = '已复制';
        button.querySelector('[data-l="en"]').textContent = 'Copied';
        button.copyResetTimer = setTimeout(() => {
          button.querySelector('[data-l="zh"]').textContent = '复制邮箱';
          button.querySelector('[data-l="en"]').textContent = 'Copy email';
        }, 2000);
      } catch {
        status.textContent = root.dataset.lang === 'zh' ? '请选中上方邮箱地址复制。' : 'Please select and copy the email address above.';
      }
    });
  });
  const activeLink = navigation.find(link => link.dataset.nav === route);
  if (activeLink && matchMedia('(max-width: 980px)').matches) {
    const nav = activeLink.parentElement;
    nav.scrollLeft = activeLink.offsetLeft - nav.clientWidth / 2 + activeLink.clientWidth / 2;
  }
})();
