/* The selected site language also selects the entire script edition. */
(() => {
  const root = document.documentElement;
  const sync = () => {
    const en = root.dataset.lang === 'en';
    document.querySelectorAll('[data-alt-en]').forEach(image => { image.alt = image.dataset[en ? 'altEn' : 'altZh']; });
    document.querySelectorAll('[data-aria-en]').forEach(element => { element.setAttribute('aria-label', element.dataset[en ? 'ariaEn' : 'ariaZh']); });
    const description = root.dataset[en ? 'draftDescriptionEn' : 'draftDescriptionZh'];
    if (description) document.querySelector('meta[name="description"]').content = description;
  };
  new MutationObserver(sync).observe(root,{attributes:true,attributeFilter:['data-lang']});
  sync();
  const episodes = [...document.querySelectorAll('.draft-episode')];
  episodes.forEach(episode => episode.addEventListener('toggle', () => {
    if (episode.open) episodes.forEach(other => { if (other !== episode) other.open = false; });
  }));
})();
