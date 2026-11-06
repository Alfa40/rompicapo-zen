/* Service worker: rende il gioco disponibile anche offline quando è servito via http(s) */
const CACHE = 'rompicapo-zen-v29';
const FILES = [
  './', 'index.html', 'css/style.css', 'icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'manifest.webmanifest',
  'js/core.js', 'js/numgrid.js', 'js/app.js', 'js/worker.js', 'js/proposte.js', 'js/stats.js', 'js/percorso.js', 'js/quiz.js',
  'js/games/sudoku.js', 'js/games/hashi.js', 'js/games/futoshiki.js', 'js/games/calcudoku.js',
  'js/games/flow.js', 'js/games/stars.js', 'js/games/pipes.js', 'js/games/lights.js', 'js/games/blocks.js',
  'js/games/crossword.js', 'js/games/wordsearch.js', 'js/games/maze.js', 'js/games/cipher.js', 'js/games/anagram.js', 'js/games/cards.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    /* si chiede sempre al server se il file è cambiato (no-cache): così dopo un aggiornamento non si mescolano
       file nuovi e vecchi tenuti dal browser */
    fetch(e.request, { cache: 'no-cache' }).then(r => {
      const copy = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
