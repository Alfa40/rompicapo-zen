// Risolve ogni rompicapo usando solo i suggerimenti: verifica coerenza tra hint() e solved()
global.window = global;
require('../js/core.js'); require('../js/numgrid.js');
const fs = require('fs');
for (const f of fs.readdirSync(__dirname + '/../js/games')) require('../js/games/' + f);
const Z = window.Zen;
let fail = 0;
for (const id of Z.ORDER) for (const L of ['easy', 'normal', 'hard']) for (let r = 0; r < 5; r++) {
  const G = Z.GAMES[id];
  const P = JSON.parse(JSON.stringify(G.generate(L)));
  if (G._check) { const m = G._check(P); if (m) { console.log(id, L, m); fail++; } }
  let s = G.init(P), steps = 0;
  while (!G.solved(P, s) && steps < 2000) {
    const h = G.hint(P, s);
    if (!h) { console.log(id, L, 'hint nullo prima della soluzione'); fail++; break; }
    s = JSON.parse(JSON.stringify(h.state)); steps++;
  }
  if (!G.solved(P, s)) { console.log(id, L, 'non risolto'); fail++; }
}
console.log(fail ? 'ERRORI: ' + fail : 'Tutto ok');
