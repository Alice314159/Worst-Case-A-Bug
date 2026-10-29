/* Render real, configured release files without inventing versions or URLs. */
(() => {
  const platformNames = { macos: 'macOS', windows: 'Windows', android: 'Android', ios: 'iOS', linux: 'Linux' };
  const bilingual = (parent, zh, en) => {
    for (const [lang, text] of [['zh', zh], ['en', en]]) {
      const span = document.createElement('span'); span.dataset.l = lang; span.textContent = text; parent.append(span);
    }
  };
  const safeURL = value => {
    try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null; } catch { return null; }
  };
  const formatSize = bytes => {
    if (!Number.isSafeInteger(bytes) || bytes < 0) return '';
    return bytes >= 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} GB` : `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  };
  for (const container of document.querySelectorAll('[data-app-downloads]')) {
    const release = window.appDownloads?.[container.dataset.appDownloads];
    const files = Array.isArray(release?.files) ? release.files.filter(file => file && safeURL(file.url) && platformNames[file.platform]) : [];
    if (!files.length) continue;
    const heading = document.createElement('div'); heading.className = 'download-heading';
    const title = document.createElement('h2'); bilingual(title, '下载与安装', 'Download & install'); heading.append(title);
    if (release.version) { const version = document.createElement('span'); version.className = 'download-version'; version.textContent = `v${String(release.version).replace(/^v/, '')}`; heading.append(version); }
    container.append(heading);
    const list = document.createElement('div'); list.className = 'download-files';
    for (const file of files) {
      const row = document.createElement('article'); row.className = 'download-file';
      const info = document.createElement('div');
      const name = document.createElement('strong'); name.textContent = platformNames[file.platform] + (file.arch ? ` · ${file.arch}` : '');
      const detail = document.createElement('p'); detail.textContent = [file.name, file.minimumOS, formatSize(file.sizeBytes)].filter(Boolean).join(' · '); info.append(name, detail);
      const link = document.createElement('a'); link.className = 'studio-button'; link.href = safeURL(file.url); link.rel = 'noopener noreferrer';
      bilingual(link, file.platform === 'ios' ? '获取 App ↗' : '下载安装包 ↓', file.platform === 'ios' ? 'Get the app ↗' : 'Download ↓');
      // Cross-origin hosts must supply their own attachment response headers.
      if (new URL(link.href).origin === location.origin) link.setAttribute('download', '');
      row.append(info, link);
      if (/^[a-f0-9]{64}$/i.test(file.sha256 || '')) {
        const checksum = document.createElement('details'); checksum.className = 'download-checksum';
        const label = document.createElement('summary'); bilingual(label, 'SHA-256 校验值', 'SHA-256 checksum');
        const code = document.createElement('code'); code.textContent = file.sha256; checksum.append(label, code); row.append(checksum);
      }
      list.append(row);
    }
    container.append(list);
    if (release.notesZh || release.notesEn) {
      const notes = document.createElement('p'); notes.className = 'download-notes';
      bilingual(notes, release.notesZh || release.notesEn, release.notesEn || release.notesZh); container.append(notes);
    }
    container.hidden = false;
  }
})();
