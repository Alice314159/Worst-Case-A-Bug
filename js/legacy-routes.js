/* Preserve shared links from the former single-page site. */
(() => {
 const routes = {"home": "index.html", "products": "products.html", "quant": "quant.html", "podcast": "podcast.html", "writing": "writing.html", "poems": "writing.html#poems", "life": "journal.html#trails", "video": "journal.html#film", "about": "about.html", "poem-rings-of-time": "poems/rings-of-time.html", "poem-mooncake-waiting": "poems/mooncake-waiting.html"};
 const target = routes[location.hash.slice(1)];
 if (target && target !== "index.html") location.replace(new URL(target, location.href).href);
})();
