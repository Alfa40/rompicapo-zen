// Test generatori in Node: node tools/test.js [gioco] [livello] [n]
global.window = global;
require('../js/core.js');
const fs=require('fs');
for (const f of fs.readdirSync(__dirname+'/../js/games')) require('../js/games/'+f);
const Z = window.Zen;
/* combinazioni: tutte al minimo, predefinite, tutte al massimo (rispettando i vincoli "need") */
function optsFor(G, L) {
  const o = Z.defaultOpts(G);
  if (L === 'def') return o;
  for (const d of G.options) { const c = L === 'min' ? d.choices[0] : d.choices[d.choices.length - 1]; o[d.id] = c.v; }
  for (const d of G.options) { const c = d.choices.find(x => x.v === o[d.id]); if (c.need && !c.need(o)) o[d.id] = d.choices[0].v; }
  return o;
}
const only = process.argv[2], lv = process.argv[3], reps = +(process.argv[4]||3);
for (const id of Z.ORDER) {
  if (only && only !== id) continue;
  const G = Z.GAMES[id];
  for (const L of ['min','def','max']) {
    if (lv && lv !== L) continue;
    const times=[];
    for (let r=0;r<reps;r++){ const t=Date.now(); const P=G.generate(optsFor(G, L)); times.push(Date.now()-t);
      if (G._check) { const msg=G._check(P,L); if (msg) { console.log('  ', msg); process.exitCode = 1; } }
      const s=G.init(P); if (G.solved(P,s)) { console.log('  ! già risolto all\'inizio'); process.exitCode = 1; }
    }
    console.log(id, L, 'ms:', times.join(', '));
  }
}
