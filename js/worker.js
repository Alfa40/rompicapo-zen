/* Rompicapo Zen — prepara i rompicapo in anticipo, in un thread separato (l'interfaccia non si blocca) */
self.window = self;
importScripts(
  'core.js', 'numgrid.js',
  'games/sudoku.js', 'games/hashi.js', 'games/futoshiki.js', 'games/calcudoku.js',
  'games/flow.js', 'games/stars.js', 'games/pipes.js', 'games/lights.js', 'games/blocks.js'
);

/* messaggio: { id, opt, key, n } → risponde con { id, key, P } per ogni rompicapo e infine { done: true } */
self.onmessage = e => {
  const { id, opt, key, n } = e.data;
  const G = self.Zen.GAMES[id];
  for (let k = 0; G && k < n; k++) {
    let P = null;
    for (let t = 0; t < 5 && !P; t++) P = G.generate(opt);
    if (!P) break;
    P.opt = opt;
    self.postMessage({ id, key, P });
  }
  self.postMessage({ id, key, done: true });
};
