/* Futoshiki — quadrato latino con disuguaglianze, indizi minimi con soluzione unica */
(function () {
  'use strict';
  const Z = window.Zen;
  const SIZE = { easy: 5, normal: 6, hard: 7 };

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

  const LIM = 6000;
  function generate(level) {
    const n = SIZE[level], N = n * n;
    const sol = Z.randomLatin(n);
    const allIneq = [];
    for (let i = 0; i < N; i++) {
      const r = (i / n) | 0, c = i % n;
      for (const j of [c < n - 1 ? i + 1 : -1, r < n - 1 ? i + n : -1]) {
        if (j < 0) continue;
        allIneq.push(sol[i] < sol[j] ? [i, j] : [j, i]);
      }
    }
    let givens = new Array(N).fill(0), ineq = allIneq.slice();
    /* Assicura l'unicità di partenza */
    for (;;) {
      const r = solver(n, givens, ineq, 2);
      if (r.count === 1) break;
      const alt = r.sols.find(s => s.some((x, i) => x !== sol[i]));
      const diffs = Z.range(N).filter(i => alt[i] !== sol[i]);
      const i = Z.pick(diffs);
      givens[i] = sol[i];
    }
    /* Togli prima i numeri, poi i segni, finché resta unica */
    const gIdx = Z.shuffle(Z.range(N).filter(i => givens[i]));
    for (const i of gIdx) {
      const k = givens[i];
      givens[i] = 0;
      if (solver(n, givens, ineq, 2, LIM).count !== 1) givens[i] = k;
    }
    for (const e of Z.shuffle(allIneq.slice())) {
      const without = ineq.filter(x => x !== e);
      if (solver(n, givens, without, 2, LIM).count === 1) ineq = without;
    }
    if (level === 'easy') {
      /* un aiuto in più: alcuni numeri e segni rimessi */
      const empty = Z.shuffle(Z.range(N).filter(i => !givens[i]));
      empty.slice(0, 3).forEach(i => { givens[i] = sol[i]; });
      const missing = Z.shuffle(allIneq.filter(e => !ineq.includes(e)));
      ineq = ineq.concat(missing.slice(0, 4));
    }
    return { n, sol, givens, ineq };
  }

  /* ---------- Suggerimenti spiegati ---------- */
  const peersOf = n => i => Z.range(n * n).filter(j => j !== i && (((j / n) | 0) === ((i / n) | 0) || j % n === i % n));
  function propagate(P, v) {
    const n = P.n, N = n * n, peers = peersOf(n);
    const cand = Z.basicCand(v, n, peers);
    for (let i = 0; i < N; i++) if (v[i]) cand[i] = 1 << v[i];
    const hi = m => 31 - Math.clz32(m), lo = m => 31 - Math.clz32(m & -m);
    for (let it = 0, ch = true; ch && it < 200; it++) {
      ch = false;
      for (const [a, b] of P.ineq) {
        if (!cand[a] || !cand[b]) continue;
        const na = cand[a] & ((1 << hi(cand[b])) - 1);
        if (na !== cand[a]) { cand[a] = na; ch = true; }
        if (!cand[a]) continue;
        const nb = cand[b] & ~((1 << (lo(cand[a]) + 1)) - 1);
        if (nb !== cand[b]) { cand[b] = nb; ch = true; }
      }
      for (let i = 0; i < N; i++) {
        const m = cand[i];
        if (v[i] || !m || (m & (m - 1))) continue;
        for (const p of peers(i)) if (!v[p] && (cand[p] & m) && cand[p] !== m) { cand[p] &= ~m; ch = true; }
      }
    }
    for (let i = 0; i < N; i++) if (v[i]) cand[i] = 0;
    return { cand };
  }
  function relations(P, i) {
    const n = P.n, out = [];
    const side = (a, b) => { const d = b - a; return d === 1 ? 'a destra' : d === -1 ? 'a sinistra' : d === n ? 'sotto' : 'sopra'; };
    for (const [a, b] of P.ineq) {
      if (a === i) out.push(`minore della casella ${side(i, b)}`);
      if (b === i) out.push(`maggiore della casella ${side(i, a)}`);
    }
    return out;
  }
  function hint(P, st) {
    const n = P.n, peers = peersOf(n);
    return Z.latinHint(P, st, {
      n, peers, units: Z.lineUnits(n),
      levels: [v => ({ cand: Z.basicCand(v, n, peers) }), v => propagate(P, v)],
      naked(i, d, lv) {
        const present = [...new Set(peers(i).map(p => st.v[p]).filter(x => x))].sort();
        if (lv === 0) return `In ${Z.cellName(i, n)} la riga e la colonna contengono già ${Z.fmtList(present)}: l'unico numero possibile è il <b>${d}</b>.`;
        const base = Z.bits(Z.basicCand(st.v, n, peers)[i], n);
        const rel = relations(P, i);
        return `In ${Z.cellName(i, n)} riga e colonna lasciano ${Z.fmtList(base)}. ` +
          (rel.length ? `Questa casella è ${Z.fmtList(rel)}: ` : 'Seguendo i segni &lt; &gt; delle caselle vicine (che si influenzano a catena) ') +
          `questi vincoli, propagati anche alle caselle vicine, escludono gli altri valori. Resta solo il <b>${d}</b>.`;
      },
      hidden(U, d, i, lv) {
        if (lv === 0) return `${U.where} il <b>${d}</b> manca ancora e può andare solo in ${Z.cellName(i, n)}: nelle altre caselle libere c'è già un ${d} nella stessa colonna o riga.`;
        return `${U.where} il <b>${d}</b> manca ancora. Considerando colonne, righe e i segni &lt; &gt; (un numero più piccolo di un vicino non può essere ${n}, uno più grande non può essere 1, e così via), l'unico posto possibile è ${Z.cellName(i, n)}.`;
      },
    });
  }

  Z.register({
    id: 'futoshiki',
    name: 'Futoshiki',
    hue: 40,
    tagline: 'Maggiore, minore: l\'ordine delle cose.',
    rules: `<p>Inserisci in ogni riga e in ogni colonna i numeri da 1 a N, senza ripetizioni.</p>
      <p>I simboli <b>&lt;</b> e <b>&gt;</b> tra due caselle indicano quale numero è più piccolo e quale più grande (la punta indica il minore).</p>
      <p>Usa la <b>matita</b> per annotare i candidati. La soluzione è sempre una sola.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="6" y="20" width="22" height="22" rx="6" class="ic-s ic-st"/><rect x="36" y="20" width="22" height="22" rx="6" class="ic-a"/><path d="M35 26l-5 5 5 5" class="ic-l2" transform="translate(-3 0)"/><text x="17" y="36" class="ic-t">2</text><text x="47" y="36" class="ic-t ic-w">4</text></svg>`,
    generate,
    _check(P) { return solver(P.n, P.givens, P.ineq, 2).count === 1 ? '' : 'NON unico'; },
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
