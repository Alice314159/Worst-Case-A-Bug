(() => {
  const $ = selector => document.querySelector(selector);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const cloud = document.documentElement.dataset.cloudAnalytics === 'true';
  const base = local ? (location.port === '8788' ? '' : 'http://127.0.0.1:8788') : cloud ? '' : window.siteAnalytics?.endpoint;
  let token = '', busy = false, requestID = 0;
  if (location.port === '8788') document.querySelectorAll('.back, .admin-brand').forEach(link => { link.href = 'http://localhost:8000/index.html'; });
  if (cloud) {
    const site = document.documentElement.dataset.siteHome;
    if (site && /^https:\/\//.test(site)) document.querySelectorAll('.back, .admin-brand').forEach(link => { link.href = site; });
    const help = document.querySelector('.login-help p');
    help.textContent = '使用部署时设置的 ADMIN_TOKEN 登录。管理密钥保存在 Cloudflare 的加密变量中，不会出现在网页源码里。';
  }
  const labels = { Desktop: '电脑', Mobile: '手机', Tablet: '平板', Unknown: '未知', Direct: '直接访问', Internal: '站内跳转' };
  const name = value => labels[value] || value;
  const format = value => Number(value || 0).toLocaleString('zh-CN');
  const date = value => value ? new Intl.DateTimeFormat('zh-CN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Los_Angeles' }).format(new Date(value)) : '暂无访问';
  const node = (tag, text, className) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; };
  function emptyRow(target, columns) { const tr = node('tr'); const td = node('td', '暂无记录'); td.colSpan = columns; tr.append(td); target.append(tr); }
  function table(selector, rows) {
    const target = $(selector); target.replaceChildren();
    if (!rows.length) return emptyRow(target, selector === '#recent-table' ? 4 : 3);
    rows.forEach(values => { const tr = node('tr'); values.forEach(value => tr.append(node('td', value))); target.append(tr); });
  }
  function bars(selector, rows, field) {
    const target = $(selector); target.replaceChildren();
    if (!rows.length) { target.append(node('p', '暂无记录', 'empty')); return; }
    const max = Math.max(...rows.map(row => row.views), 1);
    rows.forEach(row => {
      const line = node('div', undefined, 'bar-row');
      const top = node('div', undefined, 'bar-row-top'); top.append(node('span', name(row[field]), 'bar-row-label'), node('span', format(row.views), 'bar-row-count'));
      const track = node('div', undefined, 'bar-track'); const fill = node('div', undefined, 'bar-fill'); fill.style.width = `${row.views / max * 100}%`; track.append(fill); line.append(top, track); target.append(line);
    });
  }
  function render(data) {
    $('#metric-views').textContent = format(data.totals.views); $('#metric-sessions').textContent = format(data.totals.sessions); $('#metric-pages').textContent = format(data.totals.pages); $('#metric-latest').textContent = date(data.totals.last_visit);
    $('#mode-label').textContent = data.meta.mode === 'local' ? '本地统计 · 未上线' : '线上统计';
    $('#geography-notice').textContent = data.meta.geography === 'unavailable' ? '本地模式：访问量可以记录，国家和城市显示为“未知”。正式部署后可接入大致地域识别；当前没有模拟地点。' : '访问地点来自边缘网络的大致地域信息，可能未知或不准确。';
    const chart = $('#trend-chart'); chart.replaceChildren();
    const max = Math.max(...data.trend.map(row => row.views), 1);
    data.trend.forEach(row => { const bar = node('div', undefined, 'trend-bar'); bar.style.height = `${row.views / max * 100}%`; bar.title = `${row.day} · ${row.views} 次访问 · ${row.sessions} 个每日会话`; chart.append(bar); });
    $('#trend-empty').hidden = data.totals.views !== 0; chart.hidden = !data.totals.views;
    $('#trend-start').textContent = data.trend[0].day; $('#trend-end').textContent = data.trend.at(-1).day;
    table('#daily-table', data.trend.map(row => [row.day, format(row.views), format(row.sessions)]));
    bars('#page-list', data.pages, 'path'); bars('#referrer-list', data.referrers, 'referrer'); bars('#device-list', data.devices, 'name'); bars('#browser-list', data.browsers, 'name');
    const countries = new Intl.DisplayNames(['zh-CN'], { type: 'region' });
    table('#locations-table', data.locations.map(row => [row.country === 'Unknown' ? '未知' : countries.of(row.country), row.city === 'Unknown' ? '未知' : row.city, format(row.views)]));
    table('#recent-table', data.recent.map(row => [date(row.occurred_at), row.path, [row.country, row.city].map(name).join(' / '), name(row.device)]));
  }
  async function load() {
    if (busy) return;
    if (base === undefined || (!local && !cloud && !base)) { $('#login-error').textContent = '线上统计服务尚未配置，请先使用本地后台。'; return; }
    busy = true;
    const id = ++requestID; $('#refresh').disabled = true; $('#login-button').disabled = true;
    $('#dashboard-status').textContent = '正在读取统计…'; $('#login-error').textContent = '';
    try {
      const response = await fetch(`${base}/api/admin/stats?days=${$('#days').value}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' });
      if (!response.ok) { if (response.status === 401) { logout(); throw new Error('管理密钥不正确，请重新输入。'); } throw new Error('暂时无法读取统计，请检查后台服务。'); }
      const data = await response.json(); if (id !== requestID) return;
      render(data); $('#login').hidden = true; $('#dashboard').hidden = false; $('#access-key').value = '';
      $('#dashboard-status').textContent = `已更新 · ${date(new Date().toISOString())}`;
    } catch (error) { $('#login-error').textContent = error.message === 'Failed to fetch' ? '统计服务未连接。请先启动本地后台。' : error.message; $('#dashboard-status').textContent = '刷新失败，现有数据可能已过时。'; }
    finally { busy = false; $('#refresh').disabled = false; $('#login-button').disabled = false; }
  }
  function logout() { token = ''; requestID++; $('#dashboard').hidden = true; $('#login').hidden = false; $('#access-key').value = ''; }
  $('#login-form').addEventListener('submit', event => { event.preventDefault(); token = $('#access-key').value.trim(); load(); });
  $('#logout').addEventListener('click', logout); $('#refresh').addEventListener('click', load); $('#days').addEventListener('change', load);
})();
