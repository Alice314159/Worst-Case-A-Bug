/* Show the supplied color cover again instead of the film's dark final frame. */
(() => {
  document.querySelectorAll('video[data-end-poster]').forEach(video => {
    video.addEventListener('ended', () => {
      // Avoid restarting autoplay when reloading the media to restore its poster.
      video.autoplay = false;
      video.preload = 'none';
      video.load();
    });
  });
})();

/* Pause an inline trail film when its disclosure is closed. */
document.querySelectorAll('.journal-trail-video').forEach(details => {
  details.addEventListener('toggle', () => {
    if (!details.open) details.querySelector('video')?.pause();
  });
});

/* Muted clips further down the page start loading and playing only once they are on screen. */
document.querySelectorAll('video[data-autoplay-visible]').forEach(video => {
  const start = () => {
    video.preload = 'auto';
    video.play().catch(() => {});
  };
  if (!('IntersectionObserver' in window)) { start(); return; }
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      start();
    }
  }, { threshold: 0.35 });
  observer.observe(video);
});
