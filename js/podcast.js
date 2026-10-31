/* Bundled episodes work offline; a successful live RSS request refreshes them. */
(() => {
  const container = document.querySelector('#podcast-episodes');
  const status = document.querySelector('#podcast-status');
  const series = document.querySelector('#podcast-series');
  const feed = document.querySelector('link[type="application/rss+xml"]').href;
  const tabs = [...document.querySelectorAll('.podcast-sections [role="tab"]')];
  function selectSection(id, focus = false) {
    if (!['published', 'upcoming', 'manuscripts'].includes(id)) id = 'published';
    tabs.forEach(tab => {
      const selected = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
      if (selected && focus) tab.focus();
    });
    document.querySelectorAll('[data-podcast-header]').forEach(part => { part.hidden = part.dataset.podcastHeader !== id; });
    document.querySelectorAll('[data-podcast-published-only]').forEach(part => { part.hidden = id !== 'published'; });
    document.querySelector('.podcast-masthead').classList.toggle('podcast-masthead-text', id !== 'published');
    const titles = {published:['播客','Podcast'],upcoming:['筹备中 · 播客','In preparation · Podcast'],manuscripts:['文稿 · 播客','Scripts · Podcast']};
    document.documentElement.dataset.titleZh = titles[id][0];
    document.documentElement.dataset.titleEn = titles[id][1];
    document.title = titles[id][document.documentElement.dataset.lang === 'en' ? 1 : 0] + ' · Worst Case, a Bug';
    if (id !== 'published') container.querySelectorAll('audio').forEach(audio => audio.pause());
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => {
      event.preventDefault(); const id = tab.getAttribute('aria-controls');
      selectSection(id); history.replaceState(null, '', '#' + id);
    });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      else return;
      event.preventDefault(); tabs[next].click(); tabs[next].focus();
    });
  });
  selectSection(location.hash.slice(1));
  window.addEventListener('hashchange', () => selectSection(location.hash.slice(1)));
  const search = document.querySelector('#episode-search');
  const more = document.querySelector('#episode-more');
  const range = document.querySelector('#episode-range');
  const empty = document.querySelector('#episode-empty');
  let limit = 8, selectedSeason = null;
  function applyFilters() {
    const query = (search.value || '').trim().toLocaleLowerCase();
    const articles = [...container.querySelectorAll('article')];
    const matched = articles.filter(article => (selectedSeason === null || article.dataset.season === selectedSeason) && (!query || article.searchText.includes(query)));
    const visible = new Set(matched.slice(0, limit));
    articles.forEach(article => {
      article.hidden = !visible.has(article);
      if (article.hidden) {
        article.querySelector('audio')?.pause();
        const toggle = article.querySelector('.episode-toggle[aria-expanded="true"]');
        if (toggle) toggle.click();
      }
    });
    const count = document.querySelector('#episode-count'); count.replaceChildren();
    bilingual(count, query ? `${matched.length} 期匹配` : `${matched.length} 期节目`, query ? `${matched.length} ${matched.length === 1 ? 'match' : 'matches'}` : `${matched.length} episodes`);
    range.replaceChildren();
    if (matched.length) bilingual(range, `已显示 ${visible.size} / ${matched.length} 期`, `Showing ${visible.size} of ${matched.length}`);
    more.hidden = visible.size >= matched.length;
    empty.hidden = matched.length !== 0;
  }
  search.addEventListener('input', () => { limit = 8; applyFilters(); });
  more.addEventListener('click', () => { limit += 8; applyFilters(); });
  const safeURL = value => {
    try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; }
    catch { return null; }
  };
  const plainText = value => new DOMParser().parseFromString(value || '', 'text/html').body.textContent.trim();
  function bilingual(parent, zh, en) {
    for (const [lang, text] of [['zh', zh], ['en', en]]) {
      const span = document.createElement('span');
      span.dataset.l = lang;
      span.textContent = text;
      parent.append(span);
    }
  }
  function render(episodes) {
    container.replaceChildren();
    series.replaceChildren();
    const sorted = [...episodes].sort((a, b) => (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0));
    const count = document.querySelector('#episode-count');
    count.replaceChildren();
    bilingual(count, `${sorted.length} 期`, `${sorted.length} episodes`);
    const seasons = [...new Set(sorted.map(item => item.season || ''))];
    series.hidden = sorted.length < 30 || seasons.length < 2;
    if (!series.hidden) {
      for (const season of [null, ...seasons]) {
        const button = document.createElement('button');
        button.type = 'button';
        button.setAttribute('aria-pressed', String(season === null));
        bilingual(button, season === null ? '全部' : season ? `第 ${season} 季` : '未分系列', season === null ? 'All' : season ? `Season ${season}` : 'Other episodes');
        button.addEventListener('click', () => {
          series.querySelectorAll('button').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
          selectedSeason = season; limit = 8; applyFilters();
        });
        series.append(button);
      }
    }
    for (const [episodeIndex, item] of sorted.entries()) {
      const article = document.createElement('article');
      article.className = 'podcast-episode';
      article.dataset.season = item.season || '';
      article.searchText = [item.title, plainText(item.description)].join(' ').toLocaleLowerCase();
      const meta = document.createElement('div');
      meta.className = 'episode-meta';
      const date = new Date(item.date);
      if (!Number.isNaN(date.getTime())) {
        const time = document.createElement('time');
        time.dateTime = date.toISOString();
        bilingual(time, date.toLocaleDateString('zh-CN'), date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' }));
        meta.append(time);
      }
      if (item.duration) {
        const duration = document.createElement('span');
        if (/^\d+$/.test(item.duration)) {
          const seconds = Number(item.duration);
          duration.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
        } else duration.textContent = item.duration;
        meta.append(duration);
      }
      const visual = document.createElement('div');
      visual.className = 'episode-visual';
      const cover = document.createElement('img');
      cover.className = 'episode-cover';
      const artwork = window.podcastArtwork || {};
      const entry = artwork[item.link] || artwork[item.title];
      cover.src = entry || 'assets/podcast/podcast-cover.png';
      cover.alt = '';
      cover.width = 640;
      cover.height = 640;
      cover.loading = container.childElementCount < 2 ? 'eager' : 'lazy';
      cover.decoding = 'async';
      cover.addEventListener('error', () => {
        if (!cover.dataset.fallback) {
          cover.dataset.fallback = 'true';
          cover.src = 'assets/podcast/podcast-cover.png';
        }
      });
      visual.append(cover);
      article.append(visual);
      const body = document.createElement('div');
      body.className = 'episode-body';
      body.append(meta);
      const heading = document.createElement('h3');
      const toggle = document.createElement('button');
      toggle.type = 'button'; toggle.className = 'episode-toggle';
      toggle.setAttribute('aria-expanded', 'false');
      const title = document.createElement('span'); title.textContent = item.title || 'Untitled episode';
      const mark = document.createElement('span'); mark.className = 'episode-toggle-mark'; mark.textContent = '+'; mark.setAttribute('aria-hidden', 'true');
      toggle.append(title, mark); heading.append(toggle); body.append(heading);
      const description = plainText(item.description);
      const teaser = document.createElement('p'); teaser.className = 'episode-teaser';
      teaser.textContent = description.length > 80 ? description.slice(0, 80) + '…' : description;
      if (description) body.append(teaser);
      const panel = document.createElement('div'); panel.className = 'episode-expanded';
      panel.id = `episode-panel-${episodeIndex}`; panel.hidden = true;
      toggle.setAttribute('aria-controls', panel.id);
      if (description) { const full = document.createElement('p'); full.textContent = description; panel.append(full); }
      toggle.addEventListener('click', () => {
        const opening = panel.hidden;
        container.querySelectorAll('.episode-toggle[aria-expanded="true"]').forEach(other => {
          if (other !== toggle) other.click();
        });
        panel.hidden = !opening; teaser.hidden = opening;
        toggle.setAttribute('aria-expanded', String(opening)); mark.textContent = opening ? '−' : '+';
        article.classList.toggle('is-expanded', opening);
        const player = panel.querySelector('audio');
        if (opening && player && !player.src) player.src = player.dataset.src;
        if (!opening) player?.pause();
      });
      const audioURL = safeURL(item.audio);
      if (audioURL) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'none';
        audio.dataset.src = audioURL;
        audio.setAttribute('aria-label', title.textContent);
        audio.addEventListener('play', () => container.querySelectorAll('audio').forEach(other => { if (other !== audio) other.pause(); }));
        panel.append(audio);
      }
      const linkURL = safeURL(item.link);
      if (linkURL) {
        const link = document.createElement('a');
        link.href = linkURL; link.target = '_blank'; link.rel = 'noopener noreferrer';
        bilingual(link, '单集详情 ↗', 'Episode details ↗');
        panel.append(link);
      }
      body.append(panel);
      article.append(body);
      container.append(article);
    }
    document.querySelector('#published-tab-count').textContent = String(sorted.length).padStart(2, '0');
    applyFilters();
    container.setAttribute('aria-busy', 'false');
  }
  let episodes = window.podcastEpisodes || [];
  render(episodes);
  status.replaceChildren();
  async function load() {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(feed, { signal:controller.signal, credentials:'omit' });
      if (!response.ok) throw new Error('Feed unavailable');
      const xml = new DOMParser().parseFromString(await response.text(), 'application/xml');
      if (xml.querySelector('parsererror') || !xml.querySelector('channel')) throw new Error('Invalid RSS');
      const live = [...xml.querySelectorAll('item')].map(item => {
        const text = name => item.getElementsByTagName(name)[0]?.textContent.trim() || '';
        const itunes = name => item.getElementsByTagNameNS('http://www.itunes.com/dtds/podcast-1.0.dtd', name)[0]?.textContent.trim() || '';
        return {title:text('title'), description:text('description'), date:text('pubDate'), link:text('link'), season:itunes('season'), duration:itunes('duration'), audio:item.querySelector('enclosure')?.getAttribute('url') || ''};
      });
      // Do not interrupt a listener when a background refresh completes.
      if (live.length && !container.querySelector('.episode-toggle[aria-expanded="true"]') && ![...container.querySelectorAll('audio')].some(audio => !audio.paused)) {
        episodes = live;
        render(episodes);
      }
      if (!episodes.length) bilingual(status, '还没有发布单集。', 'No episodes published yet.');
    } catch {
      if (episodes.length) bilingual(status, '正在展示已同步的单集。', 'Showing synced episodes.');
      else document.querySelector('#podcast-fallback').hidden = false;
    } finally { clearTimeout(timeout); }
  }
  let started = false;
  function loadWhenVisible() {
    if (!started && document.documentElement.dataset.route === 'podcast') { started = true; load(); }
  }
  for (const event of ['hashchange', 'popstate', 'site:routechange']) window.addEventListener(event, loadWhenVisible);
  loadWhenVisible();
})();
