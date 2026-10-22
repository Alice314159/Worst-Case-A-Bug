/* Bundled episodes work offline; a successful live RSS request refreshes them. */
(() => {
  const container = document.querySelector('#podcast-episodes');
  const status = document.querySelector('#podcast-status');
  const series = document.querySelector('#podcast-series');
  const feed = document.querySelector('link[type="application/rss+xml"]').href;
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
          let visible = 0;
          container.querySelectorAll('article').forEach(article => {
            article.hidden = season !== null && article.dataset.season !== season;
            if (!article.hidden) visible++;
            else article.querySelector('audio')?.pause();
          });
          count.replaceChildren();
          bilingual(count, `${visible} 期`, `${visible} episodes`);
        });
        series.append(button);
      }
    }
    for (const item of sorted) {
      const article = document.createElement('article');
      article.className = 'podcast-episode';
      article.dataset.season = item.season || '';
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
      article.append(meta);
      const body = document.createElement('div');
      const heading = document.createElement('h3');
      heading.textContent = item.title || 'Untitled episode';
      body.append(heading);
      const description = plainText(item.description);
      if (description) {
        const paragraph = document.createElement('p');
        paragraph.textContent = description.length > 180 ? description.slice(0, 180) + '…' : description;
        body.append(paragraph);
        if (description.length > 180) {
          const details = document.createElement('details');
          const summary = document.createElement('summary');
          bilingual(summary, '完整单集简介', 'Full episode notes');
          const full = document.createElement('p');
          full.textContent = description;
          details.append(summary, full);
          body.append(details);
        }
      }
      const audioURL = safeURL(item.audio);
      if (audioURL) {
        const audio = document.createElement('audio');
        audio.controls = true;
        audio.preload = 'none';
        audio.src = audioURL;
        audio.setAttribute('aria-label', heading.textContent);
        audio.addEventListener('play', () => container.querySelectorAll('audio').forEach(other => { if (other !== audio) other.pause(); }));
        body.append(audio);
      }
      const linkURL = safeURL(item.link);
      if (linkURL) {
        const link = document.createElement('a');
        link.href = linkURL; link.target = '_blank'; link.rel = 'noopener noreferrer';
        bilingual(link, '单集详情 ↗', 'Episode details ↗');
        body.append(link);
      }
      article.append(body);
      container.append(article);
    }
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
      if (live.length && ![...container.querySelectorAll('audio')].some(audio => !audio.paused)) {
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
