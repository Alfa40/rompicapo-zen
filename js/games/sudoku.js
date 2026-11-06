/* Sudoku — generatore con soluzione unica e valutazione logica della difficoltà */
(function () {
  'use strict';
  const Z = window.Zen;
  const R = [], C = [], B = [], UNITS = [], PEERS = [];
  for (let i = 0; i < 81; i++) { R[i] = (i / 9) | 0; C[i] = i % 9; B[i] = ((R[i] / 3) | 0) * 3 + ((C[i] / 3) | 0); }
  for (let k = 0; k < 9; k++) UNITS.push(Z.range(81).filter(i => R[i] === k));
  for (let k = 0; k < 9; k++) UNITS.push(Z.range(81).filter(i => C[i] === k));
  for (let k = 0; k < 9; k++) UNITS.push(Z.range(81).filter(i => B[i] === k));
  for (let i = 0; i < 81; i++) PEERS[i] = Z.range(81).filter(j => j !== i && (R[j] === R[i] || C[j] === C[i] || B[j] === B[i]));
  const ALL = 0x3fe;
  const DIG = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  function search(g, limit, random) {
    const a = g.slice(), rows = new Int32Array(9), cols = new Int32Array(9), boxs = new Int32Array(9);
    for (let i = 0; i < 81; i++) if (a[i]) {
      const b = 1 << a[i];
      if ((rows[R[i]] | cols[C[i]] | boxs[B[i]]) & b) return { count: 0, sol: null };
      rows[R[i]] |= b; cols[C[i]] |= b; boxs[B[i]] |= b;
    }
    let count = 0, sol = null;
    (function rec() {
      let best = -1, bm = 0, bc = 10;
      for (let i = 0; i < 81; i++) if (!a[i]) {
        const m = ALL & ~(rows[R[i]] | cols[C[i]] | boxs[B[i]]);
        if (!m) return;
        const pc = Z.popcount(m);
        if (pc < bc) { bc = pc; best = i; bm = m; if (pc === 1) break; }
      }
      if (best < 0) { count++; if (!sol) sol = a.slice(); return; }
      const r = R[best], c = C[best], x = B[best];
      for (const d of (random ? Z.shuffle(DIG.slice()) : DIG)) {
        const b = 1 << d;
        if (!(bm & b)) continue;
        a[best] = d; rows[r] |= b; cols[c] |= b; boxs[x] |= b;
        rec();
        a[best] = 0; rows[r] ^= b; cols[c] ^= b; boxs[x] ^= b;
        if (count >= limit) return;
      }
    })();
    return { count, sol };
  }

  /* Risolutore "umano": livello 1 = singoli; livello 2 = + candidati bloccati, coppie nude e nascoste */
  function logic(g, level, out) {
    const v = g.slice(), cand = new Int32Array(81);
    let left = 0;
    for (let i = 0; i < 81; i++) if (!v[i]) {
      let m = ALL;
      for (const p of PEERS[i]) if (v[p]) m &= ~(1 << v[p]);
      cand[i] = m; left++;
    }
    const place = (i, d) => {
      v[i] = d; cand[i] = 0; left--;
      const b = ~(1 << d);
      for (const p of PEERS[i]) cand[p] &= b;
    };
    while (left > 0) {
      let prog = false;
      for (let i = 0; i < 81; i++) if (!v[i]) {
        const m = cand[i];
        if (!m) return false;
        if (!(m & (m - 1))) { place(i, 31 - Math.clz32(m)); prog = true; }
      }
      if (prog) continue;
      for (const U of UNITS) for (let d = 1; d <= 9; d++) {
        const b = 1 << d;
        let cnt = 0, last = -1, done = false;
        for (const i of U) { if (v[i] === d) { done = true; break; } if (cand[i] & b) { cnt++; last = i; } }
        if (done) continue;
        if (cnt === 0) return false;
        if (cnt === 1) { place(last, d); prog = true; }
      }
      if (prog) continue;
      if (level < 2) { if (out) out.left = left; return false; }
      if (locked(cand) || nakedPairs(cand) || hiddenPairs(cand)) continue;
      if (out) out.left = left;
      return false;
    }
    return true;
  }
  function locked(cand) {
    let ch = false;
    for (let u = 0; u < 27; u++) {
      const U = UNITS[u];
      for (let d = 1; d <= 9; d++) {
        const b = 1 << d;
        const cs = U.filter(i => cand[i] & b);
        if (cs.length < 2) continue;
        if (u >= 18) {
          const bx = u - 18;
          const r = R[cs[0]];
          if (cs.every(i => R[i] === r)) for (const i of UNITS[r]) if (B[i] !== bx && (cand[i] & b)) { cand[i] &= ~b; ch = true; }
          const c = C[cs[0]];
          if (cs.every(i => C[i] === c)) for (const i of UNITS[9 + c]) if (B[i] !== bx && (cand[i] & b)) { cand[i] &= ~b; ch = true; }
        } else {
          const x = B[cs[0]];
          if (cs.every(i => B[i] === x)) for (const i of UNITS[18 + x]) if (!U.includes(i) && (cand[i] & b)) { cand[i] &= ~b; ch = true; }
        }
      }
    }
    return ch;
  }
  function nakedPairs(cand) {
    let ch = false;
    for (const U of UNITS) {
      const two = U.filter(i => Z.popcount(cand[i]) === 2);
      for (let a = 0; a < two.length; a++) for (let b = a + 1; b < two.length; b++) {
        const m = cand[two[a]];
        if (m !== cand[two[b]]) continue;
        for (const i of U) if (i !== two[a] && i !== two[b] && (cand[i] & m)) { cand[i] &= ~m; ch = true; }
      }
    }
    return ch;
  }
  function hiddenPairs(cand) {
    let ch = false;
    for (const U of UNITS) {
      const pos = [];
      for (let d = 1; d <= 9; d++) pos[d] = U.filter(i => cand[i] & (1 << d));
      for (let d1 = 1; d1 <= 9; d1++) {
        if (pos[d1].length !== 2) continue;
        for (let d2 = d1 + 1; d2 <= 9; d2++) {
          if (pos[d2].length !== 2 || pos[d2][0] !== pos[d1][0] || pos[d2][1] !== pos[d1][1]) continue;
          const m = (1 << d1) | (1 << d2);
          for (const i of pos[d1]) if (cand[i] & ~m) { cand[i] &= m; ch = true; }
        }
      }
    }
    return ch;
  }

  /* Rimozione simmetrica degli indizi mantenendo unicità + criterio di accettazione */
  function dig(sol, accept, minClues) {
    const g = sol.slice();
    let clues = 81;
    for (const i of Z.shuffle(Z.range(41))) {
      const j = 80 - i, k = i === j ? 1 : 2;
      if (clues - k < minClues) continue;
      const a = g[i], b = g[j];
      g[i] = 0; g[j] = 0;
      if (search(g, 2, false).count === 1 && accept(g)) clues -= k;
      else { g[i] = a; g[j] = b; }
    }
    return g;
  }

  const OPTIONS = [
    { id: 'tec', label: 'Tecniche richieste', def: 3, choices: [
      { v: 1, label: 'Base', help: 'Basta cercare l’unico posto possibile per ogni numero.' },
      { v: 2, label: 'Intermedie', help: 'Servono anche candidati bloccati e coppie.' },
      { v: 3, label: 'Avanzate', help: 'Indizi minimi: le tecniche comuni non sempre bastano.' },
      { v: 4, label: 'Esperte', help: 'Scelto tra molti come quello in cui ci si blocca prima.' },
    ] },
  ];

  function generate(opt) {
    const level = ['easy', 'easy', 'easy', 'normal', 'hard'][opt.tec] || 'normal';
    let fallback = null;
    const t0 = Z.now();
    for (let t = 0; t < 150; t++) {
      const sol = search(new Array(81).fill(0), 1, true).sol;
      if (opt.tec === 1) return { givens: dig(sol, g => logic(g, 1), 36), sol };
      if (level === 'easy') {
        /* richiede candidati bloccati o coppie: le sole caselle singole non bastano */
        const g = dig(sol, x => logic(x, 2), 22);
        if (!logic(g, 1)) return { givens: g, sol };
        fallback = fallback || { givens: g, sol };
      } else if (level === 'normal') {
        /* minimo: nemmeno candidati bloccati e coppie bastano */
        const g = dig(sol, () => true, 0);
        if (!logic(g, 2)) return { givens: g, sol };
        fallback = fallback || { givens: g, sol };
      } else {
        /* come Normale, ma tra molti candidati si sceglie quello in cui
           le tecniche note si bloccano prima (più caselle ancora vuote) */
        const g = dig(sol, () => true, 0);
        const out = {};
        if (logic(g, 2, out)) continue;
        const clues = g.filter(Boolean).length;
        const score = out.left * 2 - clues + Math.random();
        if (!fallback || score > fallback.score) fallback = { givens: g, sol, score };
        if ((fallback.score >= 100 && t >= 4) || Z.now() - t0 > 2500) break;
      }
    }
    return fallback && { givens: fallback.givens, sol: fallback.sol };
  }

  /* ---------- Suggerimenti spiegati ---------- */
  const ROWN = ['in alto', 'al centro', 'in basso'], COLN = ['a sinistra', 'al centro', 'a destra'];
  const boxName = b => (b === 4 ? 'Nel riquadro centrale' : `Nel riquadro ${ROWN[(b / 3) | 0]} ${COLN[b % 3]}`);
  const HUNITS = [
    ...Z.range(9).map(k => ({ where: `Nella riga ${k + 1}`, cells: UNITS[k] })),
    ...Z.range(9).map(k => ({ where: `Nella colonna ${k + 1}`, cells: UNITS[9 + k] })),
    ...Z.range(9).map(k => ({ where: boxName(k), cells: UNITS[18 + k] })),
  ];
  const TECH = {
    locked: '<b>candidati bloccati</b> (se in un riquadro un numero può stare solo su una riga o colonna, lo togli dal resto di quella riga o colonna)',
    naked: '<b>coppie nude</b> (due caselle della stessa zona con gli stessi due soli candidati: quei due numeri non possono stare altrove nella zona)',
    hidden: '<b>coppie nascoste</b> (due numeri che in una zona possono stare solo nelle stesse due caselle: quelle caselle non possono contenere altro)',
  };
  const basic = v => ({ cand: Z.basicCand(v, 9, i => PEERS[i]) });
  const advanced = v => {
    const cand = Z.basicCand(v, 9, i => PEERS[i]), used = new Set();
    for (let k = 0; k < 30; k++) {
      if (locked(cand)) { used.add('locked'); continue; }
      if (nakedPairs(cand)) { used.add('naked'); continue; }
      if (hiddenPairs(cand)) { used.add('hidden'); continue; }
      break;
    }
    return { cand, used: [...used] };
  };
  function hint(P, st) {
    return Z.latinHint(P, st, {
      n: 9, peers: i => PEERS[i], units: HUNITS, levels: [basic, advanced],
      naked(i, d, lv, info) {
        if (lv === 0) {
          const present = [...new Set(PEERS[i].map(p => st.v[p]).filter(x => x))].sort();
          return `In ${Z.cellName(i, 9)} i numeri ${Z.fmtList(present)} compaiono già nella sua riga, colonna o riquadro: l'unico possibile è il <b>${d}</b>.`;
        }
        return `Annota i candidati e usa le ${Z.fmtList(info.used.map(t => TECH[t]))}. Dopo queste eliminazioni, in ${Z.cellName(i, 9)} resta solo il <b>${d}</b>.`;
      },
      hidden(U, d, i, lv, info) {
        const base = `${U.where} il <b>${d}</b> manca ancora e può andare solo in ${Z.cellName(i, 9)}`;
        if (lv === 0) return `${base}: tutte le altre caselle libere sono escluse da un ${d} già presente nella loro riga, colonna o riquadro.`;
        return `${base}. Per vederlo annota i candidati e usa le ${Z.fmtList(info.used.map(t => TECH[t]))}.`;
      },
    });
  }

  Z.register({
    options: OPTIONS,
    _logic: logic,
    id: 'sudoku',
    name: 'Sudoku',
    hue: 150,
    tagline: 'Nove numeri, nove riquadri, una sola armonia.',
    rules: Z.rules({
      goal: `Riempi tutte le caselle vuote della griglia 9×9 con i numeri da <b>1 a 9</b>.`,
      rules: [
        `In ogni <b>riga</b> (in orizzontale) ogni numero da 1 a 9 c'è <b>una volta sola</b>.`,
        `Lo stesso vale per ogni <b>colonna</b> (in verticale)…`,
        `…e per ogni <b>riquadro 3×3</b>, i nove quadrati dal bordo spesso.`,
        `I numeri scritti all'inizio sono giusti e non si cambiano.`,
      ],
      play: [
        `Tocca una casella vuota, poi un numero sulla tastiera sotto la griglia.`,
        `Con la <b>matita</b> scrivi numeri piccoli, come promemoria dei numeri che potrebbero andare lì. Toccala di nuovo per tornare a scrivere normale.`,
        `La <b>gomma</b> cancella la casella scelta.`,
      ],
      start: `Scegli un numero, per esempio l'1, e guarda un riquadro dove manca: le righe e le colonne che hanno già un 1 lo escludono da molte caselle. Se resta un solo posto libero, l'1 va lì. Non serve tirare a indovinare: la soluzione è una sola e ci si arriva ragionando.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M24 8v48M40 8v48M8 24h48M8 40h48" class="ic-l"/><text x="16" y="21" class="ic-t">5</text><text x="48" y="37" class="ic-t">3</text><text x="32" y="53" class="ic-t ic-a-t">9</text></svg>`,
    generate,
    _test: { logic, search },
    init: P => ({ v: P.givens.slice(), m: new Array(81).fill(0) }),
    view(ctx) {
      return Z.NumGrid(ctx, {
        n: 9, givens: ctx.puzzle.givens, units: UNITS, peers: i => PEERS[i], cls: 'lined',
        decorate(el, cells, grid) { grid.append(Z.outline(9, 9, B)); },
      });
    },
    solved: (P, s) => s.v.every((x, i) => x === P.sol[i]),
    hint,
  });
})();
