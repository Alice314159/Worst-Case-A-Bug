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
