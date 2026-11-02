/* Calcudoku — gabbie aritmetiche su quadrato latino, unicità verificata */
(function () {
  'use strict';
  const Z = window.Zen;
  const CFG = {
    easy: { n: 6, w: [0.05, 0.42, 0.33, 0.2] },
    normal: { n: 7, w: [0.02, 0.36, 0.36, 0.26] },
    hard: { n: 8, w: [0.01, 0.3, 0.38, 0.31] },
  };
  const SYM = { '+': '+', '-': '−', '*': '×', '/': '÷', '': '' };

  function makeCages(n, sol, weights) {
    const N = n * n, id = new Array(N).fill(-1), cages = [];
    const nb = i => {
      const r = (i / n) | 0, c = i % n, o = [];
      if (c > 0) o.push(i - 1); if (c < n - 1) o.push(i + 1); if (r > 0) o.push(i - n); if (r < n - 1) o.push(i + n);
      return o;
    };
    for (const s of Z.shuffle(Z.range(N))) {
      if (id[s] >= 0) continue;
      let x = Math.random(), want = 1;
      for (let k = 0; k < weights.length; k++) { if (x < weights[k]) { want = k + 1; break; } x -= weights[k]; want = k + 1; }
      const cells = [s];
      id[s] = cages.length;
      while (cells.length < want) {
        const fr = [];
        for (const c of cells) for (const j of nb(c)) if (id[j] < 0 && !fr.includes(j)) fr.push(j);
        if (!fr.length) break;
        const j = Z.pick(fr);
        id[j] = cages.length; cells.push(j);
      }
      cages.push({ cells });
    }
    /* Le celle singole rimaste isolate si fondono con una gabbia vicina piccola */
    for (const cg of cages) {
      const vals = cg.cells.map(i => sol[i]);
      if (vals.length === 1) { cg.op = ''; cg.t = vals[0]; continue; }
      if (vals.length === 2) {
        const a = Math.max(...vals), b = Math.min(...vals), r = Math.random();
        if (a % b === 0 && r < 0.45) { cg.op = '/'; cg.t = a / b; }
        else if (r < 0.75) { cg.op = '-'; cg.t = a - b; }
        else if (Math.random() < 0.5) { cg.op = '+'; cg.t = a + b; }
        else { cg.op = '*'; cg.t = a * b; }
        continue;
      }
      const prod = vals.reduce((p, v) => p * v, 1);
      if (prod <= 2000 && Math.random() < 0.5) { cg.op = '*'; cg.t = prod; }
      else { cg.op = '+'; cg.t = vals.reduce((p, v) => p + v, 0); }
    }
    return { cages, id };
  }

  function tuplesOf(n, cg) {
    const cells = cg.cells, k = cells.length, out = [], cur = [];
    const R = cells.map(i => (i / n) | 0), C = cells.map(i => i % n);
    const ok = () => {
      if (cg.op === '') return cur[0] === cg.t;
      if (cg.op === '+') return cur.reduce((a, b) => a + b, 0) === cg.t;
      if (cg.op === '*') return cur.reduce((a, b) => a * b, 1) === cg.t;
      const a = Math.max(cur[0], cur[1]), b = Math.min(cur[0], cur[1]);
      return cg.op === '-' ? a - b === cg.t : a === b * cg.t;
    };
    (function rec(p) {
      if (p === k) { if (ok()) out.push(cur.slice()); return; }
      for (let v = 1; v <= n; v++) {
        let clash = false;
        for (let q = 0; q < p; q++) if (cur[q] === v && (R[q] === R[p] || C[q] === C[p])) { clash = true; break; }
        if (clash) continue;
        cur[p] = v;
        if (cg.op === '+' && cur.slice(0, p + 1).reduce((a, b) => a + b, 0) > cg.t) continue;
        if (cg.op === '*' && cg.t % cur.slice(0, p + 1).reduce((a, b) => a * b, 1) !== 0) continue;
        rec(p + 1);
      }
    })(0);
    return out;
  }

  function count(n, cages, limit, nodeLimit) {
    const T = cages.map(cg => tuplesOf(n, cg));
    const rows = new Int32Array(n), cols = new Int32Array(n), done = new Uint8Array(cages.length);
    const RC = cages.map(cg => cg.cells.map(i => [(i / n) | 0, i % n]));
    let cnt = 0, nodes = 0;
    const fits = (k, t) => {
      const rc = RC[k];
      for (let p = 0; p < t.length; p++) { const b = 1 << t[p]; if ((rows[rc[p][0]] | cols[rc[p][1]]) & b) return false; }
      return true;
    };
    (function rec(left) {
      if (cnt >= limit || nodes > nodeLimit) return;
      nodes++;
      if (!left) { cnt++; return; }
      let best = -1, bl = null;
      for (let k = 0; k < cages.length; k++) {
        if (done[k]) continue;
        const list = T[k].filter(t => fits(k, t));
        if (!list.length) return;
        if (!bl || list.length < bl.length) { best = k; bl = list; if (list.length === 1) break; }
      }
      done[best] = 1;
      const rc = RC[best];
      for (const t of bl) {
        for (let p = 0; p < t.length; p++) { const b = 1 << t[p]; rows[rc[p][0]] |= b; cols[rc[p][1]] |= b; }
        rec(left - 1);
        for (let p = 0; p < t.length; p++) { const b = 1 << t[p]; rows[rc[p][0]] ^= b; cols[rc[p][1]] ^= b; }
        if (cnt >= limit || nodes > nodeLimit) break;
      }
      done[best] = 0;
    })(cages.length);
    return nodes > nodeLimit ? -1 : cnt;
  }

  function generate(level) {
    const { n, w } = CFG[level];
    let sol = Z.randomLatin(n), last = null;
    for (let t = 0; t < 800; t++) {
      if (t % 25 === 24) sol = Z.randomLatin(n);
      const c = makeCages(n, sol, w);
      last = { n, sol, cages: c.cages, id: c.id };
      if (count(n, c.cages, 2, 40000) === 1) return last;
    }
    return last;
  }

  /* ---------- Suggerimenti spiegati ---------- */
  const peersOf = n => i => Z.range(n * n).filter(j => j !== i && (((j / n) | 0) === ((i / n) | 0) || j % n === i % n));
  const label = cg => cg.t + SYM[cg.op];
  function cageCand(P, v) {
    const n = P.n, N = n * n, cand = new Int32Array(N), combos = [];
    P.cages.forEach((cg, k) => {
      const inCage = new Set(cg.cells);
      const ok = tuplesOf(n, cg).filter(t => cg.cells.every((i, p) => {
        if (v[i]) return v[i] === t[p];
        const r = (i / n) | 0, c = i % n;
        for (let x = 0; x < n; x++) {
          const a = r * n + x, b = x * n + c;
          if (!inCage.has(a) && v[a] === t[p]) return false;
          if (!inCage.has(b) && v[b] === t[p]) return false;
        }
        return true;
      }));
      combos[k] = [...new Set(ok.map(t => t.slice().sort((a, b) => a - b).join(', ')))];
      ok.forEach(t => cg.cells.forEach((i, p) => { if (!v[i]) cand[i] |= 1 << t[p]; }));
    });
    return { cand, combos };
  }
  function hint(P, st) {
    const n = P.n, peers = peersOf(n);
    return Z.latinHint(P, st, {
      n, peers, units: Z.lineUnits(n),
      levels: [v => ({ cand: Z.basicCand(v, n, peers) }), v => cageCand(P, v)],
      naked(i, d, lv, info) {
        if (lv === 0) {
          const present = [...new Set(peers(i).map(p => st.v[p]).filter(x => x))].sort();
          return `In ${Z.cellName(i, n)} la riga e la colonna contengono già ${Z.fmtList(present)}: l'unico numero possibile è il <b>${d}</b>.`;
        }
        const k = P.id[i], cg = P.cages[k];
        if (cg.op === '') return `La gabbia di ${Z.cellName(i, n)} ha una sola casella: il numero indicato, <b>${d}</b>, è direttamente la risposta.`;
        const cb = info.combos[k];
        const list = cb.length > 4 ? cb.slice(0, 4).map(x => '(' + x + ')').join(' oppure ') + ' …' : cb.map(x => '(' + x + ')').join(' oppure ');
        return `La gabbia «<b>${label(cg)}</b>» (${cg.cells.length} caselle), tenendo conto dei numeri già presenti nelle righe e colonne, può essere completata solo con ${list}. ` +
          `Combinando queste possibilità con la riga e la colonna di ${Z.cellName(i, n)}, lì può andare solo il <b>${d}</b>.`;
      },
      hidden(U, d, i, lv) {
        if (lv === 0) return `${U.where} il <b>${d}</b> manca ancora e può andare solo in ${Z.cellName(i, n)}: nelle altre caselle libere c'è già un ${d} nella stessa colonna o riga.`;
        return `${U.where} il <b>${d}</b> manca ancora. Nelle altre caselle libere le gabbie non lo permettono (nessuna combinazione valida della loro gabbia lo contiene in quella posizione): l'unico posto è ${Z.cellName(i, n)}.`;
      },
    });
  }

  Z.register({
    id: 'calcudoku',
    name: 'Calcudoku',
    hue: 270,
    tagline: 'Somme, prodotti e un pizzico di intuito.',
    rules: `<p>Inserisci in ogni riga e in ogni colonna i numeri da 1 a N, senza ripetizioni.</p>
      <p>Ogni <b>gabbia</b> (bordo spesso) mostra un risultato e un'operazione: i numeri al suo interno, combinati con quell'operazione, devono dare quel risultato. Per <b>−</b> e <b>÷</b> si parte dal numero più grande.</p>
      <p>Dentro una gabbia i numeri si possono ripetere, se non stanno sulla stessa riga o colonna.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M8 32h24v24M32 8v24h24" class="ic-l2"/><text x="20" y="25" class="ic-t ic-sm">6×</text><text x="44" y="49" class="ic-t ic-sm ic-a-t">7+</text></svg>`,
    generate,
    _check(P) { return count(P.n, P.cages, 2, Infinity) === 1 ? '' : 'NON unico'; },
    init: P => ({ v: new Array(P.n * P.n).fill(0), m: new Array(P.n * P.n).fill(0) }),
    solved: (P, s) => s.v.every((x, i) => x === P.sol[i]),
    hint,
    view(ctx) {
      const P = ctx.puzzle, n = P.n;
      const units = [];
      for (let k = 0; k < n; k++) { units.push(Z.range(n).map(c => k * n + c)); units.push(Z.range(n).map(r => r * n + k)); }
      const peers = i => Z.range(n * n).filter(j => j !== i && (((j / n) | 0) === ((i / n) | 0) || j % n === i % n));
      const givens = new Array(n * n).fill(0);
      return Z.NumGrid(ctx, {
        n, givens, units, peers, cls: 'lined cages',
        decorate(el, cells, grid) {
          grid.append(Z.outline(n, n, P.id));
          /* colorazione dolce delle gabbie: gabbie vicine hanno toni diversi */
          const col = new Array(P.cages.length).fill(-1);
          P.cages.forEach((cg, k) => {
            const used = new Set();
            for (const i of cg.cells) {
              const r = (i / n) | 0, c = i % n;
              for (const j of [c > 0 ? i - 1 : -1, c < n - 1 ? i + 1 : -1, r > 0 ? i - n : -1, r < n - 1 ? i + n : -1]) {
                if (j >= 0 && P.id[j] !== k && col[P.id[j]] >= 0) used.add(col[P.id[j]]);
              }
            }
            let c = 0;
            while (used.has(c)) c++;
            col[k] = c % 4;
            const top = Math.min(...cg.cells);
            cells[top].append(Z.h('span.cage-lbl', { text: cg.t + SYM[cg.op] }));
            cg.cells.forEach(i => cells[i].classList.add('cg-' + col[k]));
          });
        },
        extraConflicts(v) {
          const bad = new Set();
          for (const cg of P.cages) {
            const vals = cg.cells.map(i => v[i]);
            if (vals.some(x => !x)) continue;
            let ok;
            if (cg.op === '') ok = vals[0] === cg.t;
            else if (cg.op === '+') ok = vals.reduce((a, b) => a + b, 0) === cg.t;
            else if (cg.op === '*') ok = vals.reduce((a, b) => a * b, 1) === cg.t;
            else {
              const a = Math.max(...vals), b = Math.min(...vals);
              ok = cg.op === '-' ? a - b === cg.t : a === b * cg.t;
            }
            if (!ok) cg.cells.forEach(i => bad.add(i));
          }
          return bad;
        },
      });
    },
  });
})();
