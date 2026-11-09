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

  /* zone con i nomi: servono al risolutore «umano» (Z.latinSolver) e alle spiegazioni */
  const ROWN = ['in alto', 'al centro', 'in basso'], COLN = ['a sinistra', 'al centro', 'a destra'];
  const boxName = b => (b === 4 ? 'Nel riquadro centrale' : `Nel riquadro ${ROWN[(b / 3) | 0]} ${COLN[b % 3]}`);
  const HUNITS = [
    ...Z.range(9).map(k => ({ where: `Nella riga ${k + 1}`, kind: 'row', cells: UNITS[k] })),
    ...Z.range(9).map(k => ({ where: `Nella colonna ${k + 1}`, kind: 'col', cells: UNITS[9 + k] })),
    ...Z.range(9).map(k => ({ where: boxName(k), kind: 'box', cells: UNITS[18 + k] })),
  ];
  const SOLVER = Z.latinSolver({ n: 9, units: HUNITS, peers: PEERS });
  /* risolvibile senza tirare a indovinare, usando i ragionamenti fino al livello scelto (e quindi con una sola soluzione) */
  const logic = (g, level) => SOLVER.solve(g, level);

  /* Toglie indizi a coppie simmetriche finché il rompicapo resta risolvibile con la logica del livello */
  function dig(sol, accept, minClues) {
    const g = sol.slice();
    let clues = 81;
    for (const i of Z.shuffle(Z.range(41))) {
      const j = 80 - i, k = i === j ? 1 : 2;
      if (clues - k < minClues) continue;
      const a = g[i], b = g[j];
      g[i] = 0; g[j] = 0;
      if (accept(g)) clues -= k;
      else { g[i] = a; g[j] = b; }
    }
    return g;
  }

  const OPTIONS = [
    { id: 'tec', label: 'Tecniche richieste', def: 3, choices: [
      { v: 1, label: 'Base', help: 'Basta cercare l’unico posto possibile per ogni numero.' },
      { v: 2, label: 'Intermedie', help: 'Servono anche candidati bloccati e coppie.' },
      { v: 3, label: 'Avanzate', help: 'Servono anche terne, X-wing e Y-wing.' },
      { v: 4, label: 'Esperte', help: 'Servono anche swordfish e XYZ-wing. Mai tentativi a caso.' },
    ] },
  ];

  /* Ogni livello usa i ragionamenti fino al suo (1 posti e numeri unici, 2 candidati bloccati e coppie,
     3 terne, X-wing e Y-wing, 4 swordfish e XYZ-wing) e si cerca un rompicapo che li richieda davvero:
     mai tentativi a caso. */
  function generate(opt) {
    const L = Math.min(4, Math.max(1, opt.tec || 3)), t0 = Z.now();
    let best = null;
    for (let t = 0; t < 400; t++) {
      const sol = search(new Array(81).fill(0), 1, true).sol;
      const g = dig(sol, x => logic(x, L).ok, L === 1 ? 36 : 0);
      const r = logic(g, L);
      if (!r.ok) continue;
      let hard = 0;
      for (const T of SOLVER.TECH) if (T.lv >= 3) hard += r.used[T.id] || 0;
      const score = (r.hard === L ? 1e4 : r.hard * 1e3) + hard * 10 - g.filter(Boolean).length + Math.random();
      if (!best || score > best.score) best = { givens: g, sol, score, hard: r.hard };
      if (best.hard === L && (L < 4 || Z.now() - t0 > 900)) break;
      if (Z.now() - t0 > 2500) break;
    }
    return best && { givens: best.givens, sol: best.sol };
  }

  /* ---------- Suggerimenti spiegati ---------- */
  function hint(P, st) {
    return Z.latinHint(P, st, {
      n: 9, peers: i => PEERS[i], units: HUNITS, solver: SOLVER,
      naked(i, d) {
        const present = [...new Set(PEERS[i].map(p => st.v[p]).filter(x => x))].sort();
        return `Guarda la casella in ${Z.cellName(i, 9)}. Nella sua riga, colonna e riquadro ci sono già ${Z.fmtList(present)}. Manca solo ${Z.il(d)}: allora qui va ${Z.il(d)}!`;
      },
      hidden: (U, d, i) => `${U.where} manca ${Z.il(d)}. Le altre caselle vuote non vanno bene: vicino a ognuna, nella sua riga, colonna o riquadro, c’è già un ${d}. Resta solo ${Z.cellName(i, 9)}: ${Z.il(d)} va lì!`,
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
