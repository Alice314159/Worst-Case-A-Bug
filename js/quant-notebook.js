/* Progressive enhancement: without JavaScript, the complete archive is visible. */
(() => {
  const controls = document.querySelector('.notebook-controls');
  if (!controls) return;
  const buttons = [...controls.querySelectorAll('[data-quant-view]')];
  const groups = [...document.querySelectorAll('.quant-archive > .quant-group')];
  const status = controls.querySelector('.notebook-view-status');
  let selected = 'strategies';
  function render(view) {
    selected = buttons.some(button => button.dataset.quantView === view) ? view : 'strategies';
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.quantView === selected)));
    groups.forEach(group => { group.hidden = selected !== 'all' && selected !== group.id; });
    const count = groups.filter(group => !group.hidden).reduce((sum, group) => sum + group.querySelectorAll('.quant-card').length, 0);
    status.textContent = document.documentElement.dataset.lang === 'zh' ? `这一页，${count} 个项目。` : `${count} projects on this page.`;
  }
  function fromHash() { render(location.hash.slice(1) || 'strategies'); }
  controls.hidden = false;
  buttons.forEach(button => button.addEventListener('click', () => {
    render(button.dataset.quantView);
    history.replaceState(null, '', `#${selected}`);
  }));
  window.addEventListener('hashchange', fromHash);
  window.addEventListener('popstate', fromHash);
  new MutationObserver(() => render(selected)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-lang'] });
  fromHash();
})();
