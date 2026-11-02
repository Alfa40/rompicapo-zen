// Test generatori in Node: node tools/test.js [gioco] [livello] [n]
global.window = global;
require('../js/core.js');
const fs=require('fs');
for (const f of fs.readdirSync(__dirname+'/../js/games')) require('../js/games/'+f);
const Z = window.Zen;
const only = process.argv[2], lv = process.argv[3], reps = +(process.argv[4]||3);
for (const id of Z.ORDER) {
  if (only && only !== id) continue;
  const G = Z.GAMES[id];
  for (const L of ['easy','normal','hard']) {
    if (lv && lv !== L) continue;
    const times=[];
    for (let r=0;r<reps;r++){ const t=Date.now(); const P=G.generate(L); times.push(Date.now()-t);
      if (G._check) { const msg=G._check(P,L); if (msg) console.log('  ', msg); }
      const s=G.init(P); if (G.solved(P,s)) console.log('  ! già risolto all\'inizio');
    }
    console.log(id, L, 'ms:', times.join(', '));
  }
}
