/* Shared navigation and language preferences. No framework or build step required. */
(() => {
  const root = document.documentElement;
  const pages = [...document.querySelectorAll('[data-page]')];
  const navigation = [...document.querySelectorAll('[data-nav]')];
  const toggle = document.querySelector('[data-lang-toggle]');
  const titles = {
    home: ['Start here', '开场'], products: ['Products', '产品'],
    quant: ['Quant notes', '量化笔记'], podcast: ['Podcast', '播客'],
    video: ['Video', '视频'], writing: ['Essays', '长文'],
    poems: ['Poems', '英文小诗'], life: ['Trails & travel', '山路与旅行'],
    about: ['About', '关于我'],
    'poem-rings-of-time': ['Rings of Time and Light', 'Rings of Time and Light'],
    'poem-mooncake-waiting': ['Mooncake Waiting', 'Mooncake Waiting']
  };

  function updateTitle() {
    const title = titles[root.dataset.route || 'home'];
    document.title = `${title[root.dataset.lang === 'zh' ? 1 : 0]} · Worst Case, a Bug`;
  }

  function setLanguage(language) {
    root.dataset.lang = language;
    root.lang = language === 'zh' ? 'zh-CN' : 'en';
    toggle.textContent = language === 'zh' ? 'EN' : '中文';
    toggle.setAttribute('aria-label', language === 'zh' ? 'Switch to English' : '切换到中文');
    document.querySelectorAll('[data-placeholder-en]').forEach(slot => {
      slot.setAttribute('placeholder', slot.getAttribute(`data-placeholder-${language}`));
    });
    updateTitle();
  }

  function syncRoute(event) {
    const hash = location.hash.slice(1);
    const requested = hash;
    const route = Object.prototype.hasOwnProperty.call(titles, requested) ? requested : 'home';
    root.dataset.route = route;
    pages.forEach(page => { page.hidden = page.dataset.page !== route; });
    const navRoute = route.startsWith('poem-') ? 'poems' : route;
    navigation.forEach(link => {
      if (link.dataset.nav === navRoute) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    updateTitle();
    if (event) {
      const heading = document.querySelector(`[data-page="${route}"] h1`);
      if (heading) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      }
    }
    const activeLink = navigation.find(link => link.dataset.nav === navRoute);
    if (activeLink && matchMedia('(max-width: 980px)').matches) {
      const nav = activeLink.parentElement;
      nav.scrollLeft = activeLink.offsetLeft - nav.clientWidth / 2 + activeLink.clientWidth / 2;
    }
    window.scrollTo(0, 0);
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
  // Handle clicks immediately, including links to the already active section.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const hash = link.getAttribute('href');
    if (!Object.prototype.hasOwnProperty.call(titles, hash.slice(1))) return;
    event.preventDefault();
    if (location.hash !== hash) {
      try { history.pushState(null, '', hash); }
      catch { location.hash = hash; }
    }
    syncRoute(event);
    window.dispatchEvent(new Event('site:routechange'));
  });
  window.addEventListener('popstate', syncRoute);
  window.addEventListener('hashchange', syncRoute);
  syncRoute();
})();
