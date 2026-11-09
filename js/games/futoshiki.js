/* Futoshiki — quadrato latino con disuguaglianze, indizi minimi con soluzione unica */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 7, choices: [{ v: 6, label: '6×6' }, { v: 7, label: '7×7' }, { v: 8, label: '8×8' }, { v: 9, label: '9×9' }, { v: 10, label: '10×10' }, { v: 11, label: '11×11' }, { v: 12, label: '12×12' }] },
    { id: 'aid', label: 'Indizi', def: 2, choices: [
      { v: 1, label: 'Qualcuno in più', help: 'Alcuni numeri e segni in più per partire.' },
      { v: 2, label: 'Il minimo', help: 'Solo quelli indispensabili per una soluzione unica.' },
    ] },
    { id: 'tec', label: 'Ragionamenti', def: 2, choices: [
      { v: 1, label: 'Semplici', help: 'Bastano righe, colonne e segni.' },
      { v: 2, label: 'Medi', help: 'Servono anche le coppie di candidati.' },
      { v: 3, label: 'Avanzati', help: 'Servono anche terne, X-wing e Y-wing. Mai tentativi a caso.' },
    ] },
  ];

  /* Risolutore con propagazione (per l'8×8): righe/colonne, singoli nascosti e catene di segni */
  function solverProp(n, givens, ineq, limit, nodeLimit) {
    const N = n * n, FULL = ((1 << (n + 1)) - 1) & ~1;
    const hi = m => 31 - Math.clz32(m), lo = m => 31 - Math.clz32(m & -m);
    const units = [];
    for (let r = 0; r < n; r++) units.push(Z.range(n).map(c => r * n + c));
    for (let c = 0; c < n; c++) units.push(Z.range(n).map(r => r * n + c));
    const peers = Z.range(N).map(i => Z.range(N).filter(j => j !== i && (((j / n) | 0) === ((i / n) | 0) || j % n === i % n)));
    let count = 0, nodes = 0;
    const sols = [];
    function prop(cand) {
      for (let ch = true; ch;) {
        ch = false;
        for (let i = 0; i < N; i++) {
          const m = cand[i];
          if (!m) return false;
          if (m & (m - 1)) continue;
          for (const p of peers[i]) if (cand[p] & m) { cand[p] &= ~m; if (!cand[p]) return false; ch = true; }
        }
        for (const [a, b] of ineq) {
          const na = cand[a] & ((1 << hi(cand[b])) - 1);
          if (na !== cand[a]) { cand[a] = na; if (!na) return false; ch = true; }
          const nb = cand[b] & ~((1 << (lo(cand[a]) + 1)) - 1);
          if (nb !== cand[b]) { cand[b] = nb; if (!nb) return false; ch = true; }
        }
        for (const U of units) for (let d = 1; d <= n; d++) {
          const b = 1 << d;
          let cnt = 0, last = -1;
          for (const i of U) if (cand[i] & b) { cnt++; last = i; }
          if (!cnt) return false;
          if (cnt === 1 && cand[last] !== b) { cand[last] = b; ch = true; }
        }
      }
      return true;
    }
    (function rec(cand) {
      if (++nodes > nodeLimit || !prop(cand)) return;
      let best = -1, bc = 99;
      for (let i = 0; i < N; i++) {
        const pc = Z.popcount(cand[i]);
        if (pc > 1 && pc < bc) { bc = pc; best = i; if (pc === 2) break; }
      }
      if (best < 0) { count++; sols.push(Array.from(cand, m => lo(m))); return; }
      for (let d = 1; d <= n; d++) {
        if (!(cand[best] & (1 << d))) continue;
        const c2 = cand.slice();
        c2[best] = 1 << d;
        rec(c2);
        if (count >= limit || nodes > nodeLimit) return;
      }
    })(Int32Array.from(givens, g => (g ? 1 << g : FULL)));
    return { count: nodes > nodeLimit ? -1 : count, sols };
  }

  function solver(n, givens, ineq, limit, nodeLimit) {
    nodeLimit = nodeLimit || Infinity;
    const N = n * n, FULL = ((1 << (n + 1)) - 1) & ~1;
    const v = givens.slice(), rows = new Int32Array(n), cols = new Int32Array(n);
    const lt = Z.range(N).map(() => []), gt = Z.range(N).map(() => []);
    for (const [a, b] of ineq) { lt[a].push(b); gt[b].push(a); }
    for (let i = 0; i < N; i++) if (v[i]) {
      const b = 1 << v[i], r = (i / n) | 0, c = i % n;
      if ((rows[r] | cols[c]) & b) return { count: 0, sols: [] };
      rows[r] |= b; cols[c] |= b;
    }
    for (const [a, b] of ineq) if (v[a] && v[b] && v[a] >= v[b]) return { count: 0, sols: [] };
    const cand = i => {
      let m = FULL & ~(rows[(i / n) | 0] | cols[i % n]);
      for (const b of lt[i]) m &= v[b] ? ((1 << v[b]) - 1) : ((1 << n) - 1); /* minore di */
      for (const a of gt[i]) m &= v[a] ? ~((1 << (v[a] + 1)) - 1) : ~3;   /* maggiore di */
      return m & FULL;
    };
    let count = 0, nodes = 0;
    const sols = [];
    (function rec() {
      if (++nodes > nodeLimit) return;
      let best = -1, bm = 0, bc = 99;
      for (let i = 0; i < N; i++) if (!v[i]) {
        const m = cand(i);
        if (!m) return;
        const pc = Z.popcount(m);
        if (pc < bc) { bc = pc; best = i; bm = m; if (pc === 1) break; }
      }
      if (best < 0) { count++; sols.push(v.slice()); return; }
      const r = (best / n) | 0, c = best % n;
      for (let d = 1; d <= n; d++) {
        const b = 1 << d;
        if (!(bm & b)) continue;
        v[best] = d; rows[r] |= b; cols[c] |= b;
        rec();
        v[best] = 0; rows[r] ^= b; cols[c] ^= b;
        if (count >= limit || nodes > nodeLimit) return;
      }
    })();
    return { count: nodes > nodeLimit ? -1 : count, sols };
  }

  /* ---------- Risolutore «umano»: righe, colonne e segni < > ----------
     Solo ragionamenti che una persona può fare, senza tentativi: se risolve la griglia, la soluzione è anche unica. */
  const hi = m => 31 - Math.clz32(m), lo = m => 31 - Math.clz32(m & -m);
  function makeSolver(n, getIneq) {
    const N = n * n;
    const peers = Z.range(N).map(i => Z.range(N).filter(j => j !== i && (((j / n) | 0) === ((i / n) | 0) || j % n === i % n)));
    const side = (a, b) => { const d = b - a; return d === 1 ? 'a destra' : d === -1 ? 'a sinistra' : d === n ? 'sotto' : 'sopra'; };
    const nums = m => Z.fmtList(Z.bits(m, n).map(d => '<b>' + d + '</b>'));
    const no = m => (Z.popcount(m) === 1 ? `non può stare ${Z.il(hi(m))}` : `non possono stare ${nums(m)}`);
    const sign = S => {
      for (const [a, b] of getIneq()) {
        const ma = S.mask(a), mb = S.mask(b);
        if (!ma || !mb) continue;
        if (!S.v[a]) {
          const out = S.cand[a] & ~((1 << hi(mb)) - 1);
          if (out) {
            S.elim(a, out, `Il segno dice che la casella in ${Z.cellName(a, n)} è più piccola di quella ${side(a, b)}. Quella ${S.v[b] ? 'è ' + S.v[b] : 'può essere al massimo ' + hi(mb)}. Quindi qui ${no(out)}: ${Z.popcount(out) === 1 ? 'è troppo grande' : 'sono troppo grandi'}.`, [b]);
            return true;
          }
        }
        if (!S.v[b]) {
          const out = S.cand[b] & ((1 << (lo(ma) + 1)) - 1);
          if (out) {
            S.elim(b, out, `Il segno dice che la casella in ${Z.cellName(b, n)} è più grande di quella ${side(b, a)}. Quella ${S.v[a] ? 'è ' + S.v[a] : 'è almeno ' + lo(ma)}. Quindi qui ${no(out)}: ${Z.popcount(out) === 1 ? 'è troppo piccolo' : 'sono troppo piccoli'}.`, [a]);
            return true;
          }
        }
      }
      return false;
    };
    return Z.latinSolver({ n, units: Z.lineUnits(n), peers, rules: [{ id: 'sign', lv: 1, fam: 'sign', run: sign }] });
  }
  const solvers = new WeakMap();
  const solverOf = P => { let s = solvers.get(P); if (!s) { s = makeSolver(P.n, () => P.ineq); solvers.set(P, s); } return s; };

  /* Livelli: 1 righe, colonne e segni; 2 anche coppie; 3 anche terne, X-wing e Y-wing.
     Si parte dalla griglia piena con tutti i segni e si tolgono numeri e segni in ordine misto, finché il
     rompicapo resta risolvibile ragionando a quel livello. Tra alcuni tentativi si tiene quello che usa davvero
     il livello scelto. */
  function generate(opt) {
    const n = opt.size, N = n * n, L = Math.min(3, Math.max(1, opt.tec || 2)), t0 = Z.now();
    let best = null;
    for (let t = 0; t < 30; t++) {
      const P = carve(n, L);
      const r = solverOf(P).solve(P.givens, L);
      const score = (r.hard === L ? 1e4 : r.hard * 1e3) - P.givens.filter(Boolean).length - P.ineq.length / 2 + Math.random();
      if (!best || score > best.score) best = { P, score, hard: r.hard };
      if (best.hard === L || Z.now() - t0 > (n >= 10 ? 2500 : 1500)) break;
    }
    const P = best.P;
    if (opt.aid === 1) {
      /* un aiuto in più: alcuni numeri e segni rimessi */
      const { sol, givens } = P;
      Z.shuffle(Z.range(N).filter(i => !givens[i])).slice(0, n - 2).forEach(i => { givens[i] = sol[i]; });
      const all = [];
      for (let i = 0; i < N; i++) {
        const r = (i / n) | 0, c = i % n;
        if (c < n - 1) all.push(sol[i] < sol[i + 1] ? [i, i + 1] : [i + 1, i]);
        if (r < n - 1) all.push(sol[i] < sol[i + n] ? [i, i + n] : [i + n, i]);
      }
      const has = new Set(P.ineq.map(e => e.join()));
      P.ineq = P.ineq.concat(Z.shuffle(all.filter(e => !has.has(e.join()))).slice(0, n));
    }
    return P;
  }
  function carve(n, L) {
    const N = n * n, sol = Z.randomLatin(n), all = [];
    for (let i = 0; i < N; i++) {
      const r = (i / n) | 0, c = i % n;
      if (c < n - 1) all.push(sol[i] < sol[i + 1] ? [i, i + 1] : [i + 1, i]);
      if (r < n - 1) all.push(sol[i] < sol[i + n] ? [i, i + n] : [i + n, i]);
    }
    const givens = sol.slice(), on = all.map(() => true);
    let ineq = all.slice();
    const S = makeSolver(n, () => ineq);
    /* prima i numeri (ne restano pochi), poi i segni */
    for (const i of Z.shuffle(Z.range(N))) {
      givens[i] = 0;
      if (!S.solve(givens, L).ok) givens[i] = sol[i];
    }
    for (const k of Z.shuffle(Z.range(all.length))) {
      on[k] = false;
      ineq = all.filter((_, j) => on[j]);
      if (!S.solve(givens, L).ok) { on[k] = true; ineq = all.filter((_, j) => on[j]); }
    }
    return { n, sol, givens, ineq };
  }

  /* ---------- Suggerimenti spiegati ---------- */
  function hint(P, st) {
    const n = P.n, peers = i => Z.range(n * n).filter(j => j !== i && (((j / n) | 0) === ((i / n) | 0) || j % n === i % n));
    return Z.latinHint(P, st, {
      n, peers, units: Z.lineUnits(n), solver: solverOf(P),
      fam: { sign: 'Guarda i segni &lt; e &gt; vicino alle caselle che si illuminano. La punta del segno indica il numero più piccolo. Un numero più piccolo del vicino non può essere il più grande di tutti; uno più grande non può essere 1.' },
      naked(i, d) {
        const present = [...new Set(peers(i).map(p => st.v[p]).filter(x => x))].sort((a, b) => a - b);
        return `Guarda la casella in ${Z.cellName(i, n)}. Nella sua riga e nella sua colonna ci sono già ${Z.fmtList(present)}. Manca solo ${Z.il(d)}: allora qui va ${Z.il(d)}!`;
      },
      hidden: (U, d, i) => `${U.where} manca ${Z.il(d)}. Le altre caselle vuote non vanno bene: nella loro colonna o riga c’è già un ${d}. Resta solo ${Z.cellName(i, n)}: ${Z.il(d)} va lì!`,
    });
  }

  Z.register({
    options: OPTIONS,
    id: 'futoshiki',
    name: 'Futoshiki',
    hue: 40,
    tagline: 'Maggiore, minore: l\'ordine delle cose.',
    rules: Z.rules({
      goal: `Riempi la griglia con i numeri da <b>1</b> fino alla <b>misura della griglia</b>: in una griglia 7×7 si usano i numeri da 1 a 7.`,
      rules: [
        `In ogni <b>riga</b> e in ogni <b>colonna</b> ogni numero c'è <b>una volta sola</b>.`,
        `Tra alcune caselle c'è un segno <b>&lt;</b> o <b>&gt;</b> (anche in verticale). La <b>punta</b> indica sempre il numero <b>più piccolo</b>, la parte aperta il più grande: 2 &lt; 5, 6 &gt; 3.`,
        `I numeri scritti all'inizio sono giusti e non si cambiano.`,
      ],
      play: [
        `Tocca una casella vuota, poi un numero sulla tastiera.`,
        `Con la <b>matita</b> scrivi numeri piccoli, come promemoria dei numeri possibili. La <b>gomma</b> cancella.`,
      ],
      start: `Guarda le caselle con i segni. Una casella più piccola di una vicina non può avere il numero più alto; una più grande non può avere l'1. Le catene di segni (a &lt; b &lt; c) tolgono ancora più possibilità: nella prima casella di una catena di tre ci sono solo numeri bassi.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><rect x="6" y="20" width="22" height="22" rx="6" class="ic-s ic-st"/><rect x="36" y="20" width="22" height="22" rx="6" class="ic-a"/><path d="M35 26l-5 5 5 5" class="ic-l2" transform="translate(-3 0)"/><text x="17" y="36" class="ic-t">2</text><text x="47" y="36" class="ic-t ic-w">4</text></svg>`,
    generate,
    /* risolto dalla sola logica = soluzione unica; altrimenti si conta con la ricerca */
    _check(P) { return solverOf(P).solve(P.givens).ok || (P.n >= 8 ? solverProp : solver)(P.n, P.givens, P.ineq, 2, Infinity).count === 1 ? '' : 'NON unico'; },
    init: P => ({ v: P.givens.slice(), m: new Array(P.n * P.n).fill(0) }),
    solved: (P, s) => s.v.every((x, i) => x === P.sol[i]),
    hint,
    view(ctx) {
      const P = ctx.puzzle, n = P.n, gap = 0.42;
      const units = [];
      for (let k = 0; k < n; k++) { units.push(Z.range(n).map(c => k * n + c)); units.push(Z.range(n).map(r => r * n + k)); }
      const peers = i => Z.range(n * n).filter(j => j !== i && (((j / n) | 0) === ((i / n) | 0) || j % n === i % n));
      const signs = [];
      return Z.NumGrid(ctx, {
        n, givens: P.givens, units, peers, gap, cls: 'tiles',
        decorate(el, cells, grid) {
          const tot = n + (n - 1) * gap;
          for (const [a, b] of P.ineq) {
            const ra = (a / n) | 0, ca = a % n, rb = (b / n) | 0, cb = b % n;
            const hz = ra === rb;
            const lo = hz ? Math.min(ca, cb) : Math.min(ra, rb);
            const along = (lo + 1) * (1 + gap) - gap / 2;
            const across = (hz ? ra : ca) * (1 + gap) + 0.5;
            /* direzione della punta: verso la casella minore (a) */
            let dir;
            if (hz) dir = ca < cb ? 'left' : 'right';
            else dir = ra < rb ? 'up' : 'down';
            const s = Z.h('div.fs-sign.' + dir, { html: '<svg viewBox="0 0 10 10"><path d="M7 2L3 5l4 3"/></svg>' });
            s.style.left = ((hz ? along : across) / tot * 100) + '%';
            s.style.top = ((hz ? across : along) / tot * 100) + '%';
            s.dataset.a = a; s.dataset.b = b;
            signs.push(s);
            grid.append(s);
          }
        },
        extraConflicts(v) {
          const bad = new Set();
          for (const [a, b] of P.ineq) if (v[a] && v[b] && v[a] >= v[b]) { bad.add(a); bad.add(b); }
          return bad;
        },
        afterPaint(v) {
          signs.forEach(s => {
            const a = +s.dataset.a, b = +s.dataset.b;
            s.classList.toggle('bad', !!(v[a] && v[b] && v[a] >= v[b]));
          });
        },
      });
    },
  });
})();
