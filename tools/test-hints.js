// Risolve ogni rompicapo usando solo i suggerimenti: verifica coerenza tra hint() e solved()
global.window = global;
require('../js/core.js'); require('../js/numgrid.js');
const fs = require('fs');
for (const f of fs.readdirSync(__dirname + '/../js/games')) require('../js/games/' + f);
const Z = window.Zen;
/* combinazioni: tutte al minimo, predefinite, tutte al massimo (rispettando i vincoli "need") */
function optsFor(G, L) {
  const o = Z.defaultOpts(G);
  if (L === 'def') return o;
  for (const d of G.options) { const c = L === 'min' ? d.choices[0] : d.choices[d.choices.length - 1]; o[d.id] = c.v; }
  for (const d of G.options) { const c = d.choices.find(x => x.v === o[d.id]); if (c.need && !c.need(o)) o[d.id] = d.choices[0].v; }
  return o;
}
let fail = 0;
const won = {};
for (const id of Z.ORDER) for (const L of ['min', 'def', 'max']) for (let r = 0; r < 5; r++) {
  const G = Z.GAMES[id];
  const P = JSON.parse(JSON.stringify(G.generate(optsFor(G, L))));
  if (G._check) { const m = G._check(P); if (m) { console.log(id, L, m); fail++; } }
  let s = G.init(P), steps = 0;
  while (!G.solved(P, s) && steps < 2000) {
    const h = G.hint(P, s);
    /* solitari di carte: smazzate casuali, alcune non si vincono (il gioco lo spiega con G.stuck) */
    if (!h && G.random && G.stuck && G.stuck(P, s)) break;
    if (!h) { console.log(id, L, 'hint nullo prima della soluzione'); fail++; break; }
    if (G.random && !(h.tip && h.why && h.tag)) { console.log(id, L, 'suggerimento senza testi'); fail++; }
    s = JSON.parse(JSON.stringify(h.state)); steps++;
  }
  if (G.random) { if (G.solved(P, s)) won[id] = (won[id] || 0) + 1; else if (steps >= 2000) { console.log(id, L, 'troppi passi'); fail++; } continue; }
  if (!G.solved(P, s)) { console.log(id, L, 'non risolto'); fail++; }
}
for (const id in won) console.log(id, 'vinte col Suggerimento:', won[id], 'su 15');
console.log(fail ? 'ERRORI: ' + fail : 'Tutto ok');
if (fail) process.exitCode = 1;
