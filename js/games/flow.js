/* Collega i colori (Numberlink) — percorsi che coprono tutta la griglia */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 10, choices: [{ v: 9, label: '9×9' }, { v: 10, label: '10×10' }, { v: 11, label: '11×11' }, { v: 12, label: '12×12' }, { v: 13, label: '13×13' }, { v: 14, label: '14×14' }, { v: 15, label: '15×15' }, { v: 16, label: '16×16' }] },
    { id: 'col', label: 'Colori', def: 2, choices: [
      { v: 1, label: 'Tanti', help: 'Percorsi brevi.' },
      { v: 2, label: 'Normali' },
      { v: 3, label: 'Pochi', help: 'Percorsi lunghi e tortuosi.' },
    ] },
  ];
  const colorRange = (n, c) => {
    const r = c === 1 ? [n, n + 1] : c === 3 ? (n > 12 ? [Math.round(n * 0.7), n - 2] : [Math.round(n * 0.6), Math.round(n * 0.7)]) : [Math.round(n * 0.78), n - (n >= 12 ? 1 : 0)];
    return [Math.min(r[0], COLORS.length), Math.min(r[1], COLORS.length)];
  };
  const COLORS = [
    'hsl(355 75% 62%)', 'hsl(28 90% 58%)', 'hsl(48 92% 55%)', 'hsl(135 50% 50%)', 'hsl(185 65% 45%)',
    'hsl(215 75% 60%)', 'hsl(270 55% 64%)', 'hsl(325 65% 66%)', 'hsl(20 40% 48%)', 'hsl(85 60% 48%)',
    'hsl(240 40% 45%)', 'hsl(0 0% 60%)', 'hsl(160 55% 38%)', 'hsl(300 45% 48%)', 'hsl(40 55% 40%)', 'hsl(200 35% 70%)',
  ];

  function neighbors(n) {
    return Z.range(n * n).map(i => {
      const x = i % n, y = (i / n) | 0, r = [];
      if (x > 0) r.push(i - 1); if (x < n - 1) r.push(i + 1); if (y > 0) r.push(i - n); if (y < n - 1) r.push(i + n);
      return r;
    });
  }

  /* Griglie grandi: ogni casella parte come percorso a sé, poi si uniscono gli estremi vicini,
     sempre partendo dal percorso più corto, finché restano i colori voluti */
  function generateBig(n, cmin, cmax) {
    const N = n * n, NB = neighbors(n);
    const adj = (a, b) => NB[a].includes(b);
    for (let att = 0; att < 400; att++) {
      const want = Z.ri(cmin, cmax);
      let paths = Z.range(N).map(i => [i]);
      const owner = new Int32Array(N), alive = new Set(Z.range(N));
      for (let i = 0; i < N; i++) owner[i] = i;
      const isEnd = (P, c) => P[0] === c || P[P.length - 1] === c;
      while (alive.size > want) {
        /* percorsi in ordine di lunghezza, a parità a caso */
        const order = Z.shuffle([...alive]).sort((x, y) => paths[x].length - paths[y].length);
        let done = false;
        for (const ai of order) {
          const A = paths[ai];
          const opts = [];
          for (const ea of A.length === 1 ? [0] : [0, 1]) {
            const a = ea ? A[A.length - 1] : A[0];
            for (const b of NB[a]) {
              const bi = owner[b];
              if (bi === ai || !isEnd(paths[bi], b)) continue;
              opts.push([ea, b, bi]);
            }
          }
          if (!opts.length) continue;
          opts.sort((x, y) => paths[x[2]].length - paths[y[2]].length + (Math.random() - 0.5) * 6);
          const [ea, b, bi] = opts[0], B = paths[bi];
          const A2 = ea ? A : A.slice().reverse();
          const B2 = B[0] === b ? B : B.slice().reverse();
          const M = A2.concat(B2);
          paths[ai] = M; alive.delete(bi); paths[bi] = null;
          for (const c of B) owner[c] = ai;
          done = true;
          break;
        }
        if (!done) break;
      }
      const list = [...alive].map(i => paths[i]);
      if (list.length < cmin || list.length > cmax || list.some(p => p.length < 3)) continue;
      if (list.some(p => adj(p[0], p[p.length - 1]))) continue;
      Z.shuffle(list);
      return { n, ends: list.map(p => [p[0], p[p.length - 1]]), sol: list };
    }
    return null;
  }

  /* Si tengono solo griglie che si risolvono ragionando (e quindi con una sola soluzione).
     Le griglie a caso di solito hanno più soluzioni: si ritoccano. Un filo cede la sua parte finale al filo vicino
     (i colori restano quanti sono) e si tiene il ritocco se i collegamenti ancora incerti non aumentano.
     Se proprio non basta, un filo dove il ragionamento si ferma si divide in due colori. */
  let fallbackUsed = 0;
  function generate(opt) {
    const n = opt.size, [, cmax] = colorRange(n, opt.col), NB = neighbors(n), t0 = Z.now();
    const limit = Math.min(COLORS.length, cmax + 2);
    const adj = (a, b) => NB[a].includes(b);
    const okPath = p => p.length >= 3 && !adj(p[0], p[p.length - 1]);
    const undecided = (P, lv) => { const L = logic(P, lv); return { L, u: L.ok ? 0 : L.S.e.reduce((s, v) => s + (v ? 0 : 1), 0) }; };
    const owner = P => { const o = new Int16Array(n * n); P.sol.forEach((p, c) => p.forEach(i => { o[i] = c; })); return o; };
    /* ritocco: A finisce accanto a una casella b del filo B; A prende b e il resto di B da quella parte */
    function mutate(P) {
      const o = owner(P), sol = P.sol;
      for (let t = 0; t < 30; t++) {
        const ai = Z.ri(0, sol.length - 1), A0 = sol[ai], ea = Math.random() < 0.5;
        const A = ea ? A0 : A0.slice().reverse(), a = A[A.length - 1];
        const bs = NB[a].filter(b => o[b] !== ai);
        if (!bs.length) continue;
        const b = Z.pick(bs), bi = o[b], B = sol[bi], q = B.indexOf(b);
        const keepFirst = Math.random() < 0.5;
        const take = keepFirst ? B.slice(q) : B.slice(0, q + 1).reverse(), rest = keepFirst ? B.slice(0, q) : B.slice(q + 1);
        const A2 = A.concat(take);
        if (!okPath(A2) || !okPath(rest)) continue;
        const S2 = sol.slice();
        S2[ai] = A2; S2[bi] = rest;
        return { n, sol: S2, ends: S2.map(p => [p[0], p[p.length - 1]]) };
      }
      return null;
    }
    let last = null;
    const budget = opt._ms || 5000, SL = opt._lv || 2;
    const big = n > 10, mutMs = big ? 400 : 2500;
    while (Z.now() - t0 < budget) {
      let P = genPaths(opt);
      if (!P) continue;
      last = last || P;
      const tm = Z.now();
      let cur = undecided(P, SL);
      for (let k = 0; k < 4000 && Z.now() - tm < mutMs; k++) {
        if (opt._log && k % 50 === 0) console.log('passo', k, 'incerti', cur.u, 'ms', Z.now() - t0);
        if (cur.u === 0 || k % 25 === 24) {
          const L3 = logic(P, 3);
          if (L3.ok) { P.ends = P.sol.map(p => [p[0], p[p.length - 1]]); return P; }
          if (cur.u === 0) break;
        }
        const Q = mutate(P);
        if (!Q) continue;
        const r = undecided(Q, SL);
        if (r.u <= cur.u) { P = Q; cur = r; }
      }
      /* griglie piccole: dividere un filo dove il ragionamento si ferma */
      for (let k = 0; !big && k < 6 && P.sol.length < limit; k++) {
        const L = logic(P, 3);
        if (L.ok) { P.ends = P.sol.map(p => [p[0], p[p.length - 1]]); return P; }
        const und = new Uint8Array(n * n);
        L.ED.forEach(([a, b], e) => { if (!L.S.e[e]) { und[a] = 1; und[b] = 1; } });
        let best = null;
        P.sol.forEach((p, c) => {
          const at = p.map((x, q) => q).filter(q => und[p[q]] && q >= 3 && p.length - q >= 3);
          if (at.length && (!best || at.length > best.at.length)) best = { c, at };
        });
        if (!best) break;
        const p = P.sol[best.c], q = best.at[(best.at.length / 2) | 0];
        if (!okPath(p.slice(0, q)) || !okPath(p.slice(q))) break;
        P.sol.splice(best.c, 1, p.slice(0, q), p.slice(q));
        P.ends = P.sol.map(x => [x[0], x[x.length - 1]]);
      }
      if (logic(P, 3).ok) return P;
      /* tratti di filo già disegnati dove il ragionamento si ferma: a ogni giro qualcuno, lontani tra loro */
      P.links = [];
      const own = owner(P), sp = new Set(), dist = (a, b) => Math.abs(a % n - b % n) + Math.abs(((a / n) | 0) - ((b / n) | 0));
      P.sol.forEach(p => { for (let q = 0; q + 1 < p.length; q++) sp.add(Math.min(p[q], p[q + 1]) * n * n + Math.max(p[q], p[q + 1])); });
      let L = logic(P, 3);
      for (let k = 0; k < n * n && !L.ok; k++) {
        const und = new Int16Array(n * n);
        let tot = 0;
        L.ED.forEach(([a, b], e) => { if (!L.S.e[e]) { und[a]++; und[b]++; tot++; } });
        const cand = [];
        L.ED.forEach(([a, b], e) => { if (!L.S.e[e] && sp.has(a * n * n + b)) cand.push({ a, b, sc: und[a] + und[b] + Math.random() }); });
        if (!cand.length) break;
        cand.sort((x, y) => y.sc - x.sc);
        const pick = [];
        for (const c of cand) {
          if (pick.length >= Math.max(1, Math.round(tot / 60))) break;
          if (pick.every(q => dist(q.a, c.a) > 4)) pick.push(c);
        }
        for (const c of pick) P.links.push([c.a, c.b, own[c.a]]);
        L = logic(P, 3);
      }
      if (!L.ok) continue;
      /* si tolgono i tratti che non servono (finché c'è tempo) */
      for (const l of Z.shuffle(P.links.slice())) {
        if (Z.now() - t0 > budget * 0.8) break;
        const keep = P.links;
        P.links = keep.filter(x => x !== l);
        if (!logic(P, 3).ok) P.links = keep;
      }
      if (opt._log) console.log('tratti', P.links.length, 'ms', Z.now() - t0);
      return P;
    }
    fallbackUsed++;
    return last;
  }
  function genPaths(opt) {
    const n = opt.size, [cmin, cmax] = colorRange(n, opt.col), N = n * n, NB = neighbors(n);
    if (n > 10) return generateBig(n, cmin, cmax);
    const adj = (a, b) => NB[a].includes(b);
    for (let att = 0; att < 5000; att++) {
      const own = new Int16Array(N).fill(-1);
      const paths = [];
      const freeDeg = i => NB[i].reduce((a, j) => a + (own[j] < 0 ? 1 : 0), 0);
      let left = N;
      while (left > 0) {
        let best = [], bd = 9;
        for (let i = 0; i < N; i++) if (own[i] < 0) {
          const d = freeDeg(i);
          if (d < bd) { bd = d; best = [i]; } else if (d === bd) best.push(i);
        }
        const s = Z.pick(best), id = paths.length, p = [s];
        own[s] = id; left--;
        const avg = N / ((cmin + cmax) / 2);
        const target = n <= 10 ? Z.ri(3, Math.max(4, Math.round((N / cmin) * 1.4))) : Z.ri(Math.round(avg * 0.6), Math.round(avg * 1.6));
        while (p.length < target) {
          const head = p[p.length - 1];
          const opts = NB[head].filter(j => own[j] < 0 && NB[j].every(k => k === head || own[k] !== id));
          if (!opts.length) break;
          let nx;
          if (Math.random() < 0.7) {
            let md = 9, c = [];
            for (const j of opts) { const d = freeDeg(j); if (d < md) { md = d; c = [j]; } else if (d === md) c.push(j); }
            nx = Z.pick(c);
          } else nx = Z.pick(opts);
          p.push(nx); own[nx] = id; left--;
        }
        paths.push(p);
      }
      const tryMerge = filt => {
        const idx = Z.shuffle(Z.range(paths.length));
        for (const ai of idx) {
          const A = paths[ai];
          if (!filt(A)) continue;
          for (const bi of Z.shuffle(Z.range(paths.length))) {
            if (bi === ai) continue;
            const B = paths[bi];
            for (const ea of [0, 1]) for (const eb of [0, 1]) {
              const a = ea ? A[A.length - 1] : A[0], b = eb ? B[B.length - 1] : B[0];
              if (!adj(a, b)) continue;
              const A2 = ea ? A.slice() : A.slice().reverse();
              const B2 = eb ? B.slice().reverse() : B.slice();
              const merged = A2.concat(B2);
              paths.splice(Math.max(ai, bi), 1);
              paths.splice(Math.min(ai, bi), 1);
              paths.push(merged);
              return true;
            }
          }
        }
        return false;
      };
      /* un percorso di 2 caselle rimasto isolato diventa una deviazione a U di un percorso vicino */
      const detour = () => {
        for (let si = 0; si < paths.length; si++) {
          const S = paths[si];
          if (S.length !== 2) continue;
          for (let pi = 0; pi < paths.length; pi++) {
            if (pi === si) continue;
            const T = paths[pi];
            for (let k = 0; k + 1 < T.length; k++) for (const [c1, c2] of [[S[0], S[1]], [S[1], S[0]]]) {
              if (!adj(T[k], c1) || !adj(T[k + 1], c2)) continue;
              T.splice(k + 1, 0, c1, c2);
              paths.splice(si, 1);
              return true;
            }
          }
        }
        return false;
      };
      while (paths.some(p => p.length < 3) && (tryMerge(p => p.length < 3) || detour()));
      if (paths.some(p => p.length < 3)) continue;
      while (paths.length > cmax && tryMerge(() => true));
      if (paths.length < cmin || paths.length > cmax) continue;
      /* niente coppie di estremi troppo vicini (troppo facili) */
      if (paths.some(p => adj(p[0], p[p.length - 1]))) continue;
      Z.shuffle(paths);
      return { n, ends: paths.map(p => [p[0], p[p.length - 1]]), sol: paths };
    }
    return null;
  }

  /* ---------- Risolutore «umano» ----------
     Tiene per ogni collegamento tra due caselle vicine se il filo passa (1), non passa (-1) o non si sa (0),
     e per ogni casella i colori ancora possibili. Ragionamenti:
     livello 1: un pallino ha un solo filo, ogni altra casella due (se restano solo quelle strade, il filo passa di lì;
                se è già pieno, non passa altrove); un filo non torna su se stesso; due colori diversi non si uniscono;
     livello 2: un colore che non può arrivare a una casella (da tutti e due i suoi pallini) non ci passa;
     livello 3: «immagina»: se una scelta porta subito a un problema, è sbagliata.
     Se tutto si decide, la soluzione è anche unica. Restituisce l'ordine in cui si capisce ogni collegamento. */
  function logic(P, L = 3) {
    const n = P.n, N = n * n, K = P.ends.length, NB = neighbors(n);
    const ED = [], CE = Z.range(N).map(() => []);
    for (let i = 0; i < N; i++) for (const j of [i % n < n - 1 ? i + 1 : -1, i + n < N ? i + n : -1]) {
      if (j < 0) continue;
      CE[i].push(ED.length); CE[j].push(ED.length); ED.push([i, j]);
    }
    const M = ED.length, ALL = (1 << K) - 1;
    const endOf = new Int16Array(N).fill(-1);
    P.ends.forEach(([a, b], c) => { endOf[a] = c; endOf[b] = c; });
    const need = i => (endOf[i] >= 0 ? 1 : 2);
    const oth = (e, i) => (ED[e][0] === i ? ED[e][1] : ED[e][0]);
    const S0 = { e: new Int8Array(M), col: new Int32Array(N).fill(ALL), when: new Int32Array(M).fill(-1), why: new Array(M).fill(null) };
    for (let i = 0; i < N; i++) if (endOf[i] >= 0) S0.col[i] = 1 << endOf[i];
    /* tratti di filo già disegnati dal generatore (griglie grandi): da a a b passa il filo c */
    for (const [a, b, c] of P.links || []) {
      const e = CE[a].find(x => oth(x, a) === b);
      S0.e[e] = 1; S0.col[a] &= 1 << c; S0.col[b] &= 1 << c;
    }
    let tick = 0;
    const cut2 = new Uint8Array(N);
    const clone = S => ({ e: S.e.slice(), col: S.col.slice(), when: S.when, why: S.why, ghost: true });
    const setE = (S, e, v, why) => {
      if (S.e[e]) return S.e[e] === v ? 0 : -1;
      S.e[e] = v;
      if (!S.ghost) { if (v === 1) S.when[e] = tick++; S.why[e] = why; }
      return 1;
    };
    /* gruppi di caselle già unite da fili sicuri */
    function groups(S) {
      const par = Z.range(N), f = a => (par[a] === a ? a : (par[a] = f(par[a])));
      for (let e = 0; e < M; e++) if (S.e[e] === 1) par[f(ED[e][0])] = f(ED[e][1]);
      return f;
    }
    /* livello 1: fino a quando non cambia più niente; false = contraddizione */
    function basic(S) {
      for (let guard = 0; guard < 10 * M; guard++) {
        let ch = false;
        for (let i = 0; i < N; i++) {
          let on = 0, un = 0;
          for (const e of CE[i]) { if (S.e[e] === 1) on++; else if (!S.e[e]) un++; }
          const nd = need(i);
          if (on > nd || on + un < nd) return false;
          if (!un) continue;
          if (on === nd) { for (const e of CE[i]) if (!S.e[e]) setE(S, e, -1, { k: 'full' }); ch = true; }
          else if (on + un === nd) { for (const e of CE[i]) if (!S.e[e]) setE(S, e, 1, { i, k: endOf[i] >= 0 ? 'forced' : on ? 'head' : 'fill' }); ch = true; }
        }
        for (let e = 0; e < M; e++) {
          const [a, b] = ED[e];
          if (S.e[e] === 1) {
            const m = S.col[a] & S.col[b];
            if (!m) return false;
            if (m !== S.col[a] || m !== S.col[b]) { S.col[a] = S.col[b] = m; ch = true; }
          } else if (!S.e[e] && !(S.col[a] & S.col[b])) { setE(S, e, -1, { k: 'color' }); ch = true; }
        }
        /* un filo che si richiude su se stesso, o che unisce i due pallini di colori diversi */
        const f = groups(S);
        for (let e = 0; e < M; e++) if (!S.e[e] && f(ED[e][0]) === f(ED[e][1])) { setE(S, e, -1, { k: 'cycle' }); ch = true; }
        if (!ch) return true;
      }
      return true;
    }
    /* livello 2: ogni colore deve poter arrivare a una casella da tutti e due i suoi pallini */
    function reach(S) {
      let ch = false;
      for (let c = 0; c < K; c++) {
        const bit = 1 << c, [A, B] = P.ends[c];
        const full = i => CE[i].filter(e => S.e[e] === 1).length >= need(i);
        const bfs = (s, t) => {
          const seen = new Uint8Array(N), q = [s];
          seen[s] = 1;
          while (q.length) {
            const x = q.pop();
            if (x === t && x !== s) continue;
            const fx = full(x);
            for (const e of CE[x]) {
              if (S.e[e] === -1 || (fx && S.e[e] !== 1)) continue;
              const y = oth(e, x);
              if (seen[y] || !(S.col[y] & bit)) continue;
              seen[y] = 1; q.push(y);
            }
          }
          return seen;
        };
        const ra = bfs(A, B), rb = bfs(B, A);
        if (!ra[B]) return -1;
        for (let i = 0; i < N; i++) if ((S.col[i] & bit) && !(ra[i] && rb[i])) {
          S.col[i] &= ~bit;
          if (!S.ghost) cut2[i] = 1;
          if (!S.col[i]) return -1;
          ch = true;
        }
      }
      return ch ? 1 : 0;
    }
    function settle(S, lv) {
      for (let k = 0; k < 200; k++) {
        if (!basic(S)) return false;
        if (lv < 2) return true;
        const r = reach(S);
        if (r < 0) return false;
        if (!r) return true;
        if (!S.ghost) used2 = true;
      }
      return true;
    }
    let used2 = false;
    if (L >= 9) {
      /* conteggio delle soluzioni (solo per i controlli): ricerca con le stesse deduzioni */
      let cnt = 0, nodes = 0;
      const rec = T => {
        if (cnt >= 2 || ++nodes > 20000) return;
        if (!settle(T, 2)) return;
        const e = T.e.findIndex(v => !v);
        if (e < 0) { cnt++; return; }
        for (const v of [1, -1]) { const U = clone(T); U.e[e] = v; rec(U); }
      };
      rec(clone(S0));
      return { count: nodes > 20000 ? -1 : cnt };
    }
    const S = S0;
    let hard = 1, ok = settle(S, Math.min(L, 2));
    /* «immagina»: prima con le sole conseguenze semplici, poi anche con i colori che non arrivano;
       si riparte da dove si era rimasti, così non si riprovano sempre gli stessi collegamenti */
    let from = 0;
    for (let round = 0; ok && L >= 3 && round < 4 * M; round++) {
      if (S.e.every(v => v)) break;
      let moved = false;
      for (const depth of [1, 2]) {
        for (let q = 0; q < M && !moved; q++) {
          const e = (from + q) % M;
          if (S.e[e]) continue;
          for (const v of [1, -1]) {
            const T = clone(S);
            T.e[e] = v;
            if (settle(T, depth)) continue;
            setE(S, e, -v, { i: ED[e][0], k: 'imagine', e, v });
            hard = 3; moved = true; from = e;
            break;
          }
        }
        if (moved) break;
      }
      if (!moved || !settle(S, 2)) break;
    }
    const done = ok && S.e.every(v => v);
    if (used2 && hard < 2) hard = 2;
    return { ok: done, hard, S, ED, CE, cut2 };
  }

  const complete = (P, s, c) => {
    const p = s.p[c];
    if (p.length < 2) return false;
    const [a, b] = P.ends[c];
    return (p[0] === a && p[p.length - 1] === b) || (p[0] === b && p[p.length - 1] === a);
  };

  /* ---------- Suggerimento spiegato ---------- */
  const NAMES = ['rosso', 'arancione', 'giallo', 'verde', 'turchese', 'blu', 'viola', 'rosa', 'marrone', 'verde lime', 'blu notte', 'grigio', 'verde scuro', 'magenta', 'ocra', 'azzurro'];
  const logics = new WeakMap();
  const logicOf = P => { let r = logics.get(P); if (!r) { r = logic(P, 3); logics.set(P, r); } return r; };
  function hint(P, st) {
    const n = P.n, s = Z.clone(st);
    const cell = i => Z.cellName(i, n);
    /* il filo del giocatore va bene se segue la soluzione partendo da uno dei due pallini */
    const dirOf = c => { const q = s.p[c], sol = P.sol[c]; return !q.length ? 0 : q[0] === sol[0] ? 1 : q[0] === sol[sol.length - 1] ? -1 : 0; };
    const solFrom = (c, d) => (d === -1 ? P.sol[c].slice().reverse() : P.sol[c]);
    const goodLen = c => {
      const q = s.p[c], d = dirOf(c);
      if (!q.length || !d) return 0;
      const w = solFrom(c, d);
      let k = 0;
      while (k < q.length && q[k] === w[k]) k++;
      return k;
    };
    const bad = P.ends.map((_, c) => c).filter(c => s.p[c].length && goodLen(c) < s.p[c].length);
    if (bad.length) {
      const c = bad[0], k = goodLen(c);
      s.p[c].length = k;
      return {
        state: s, focus: [c], area: [c], tag: 'wrong',
        tip: `Segui con il dito il filo <b>${NAMES[c]}</b>. Lascia passare tutti gli altri colori?`,
        why: `Il filo <b>${NAMES[c]}</b> ha preso la strada sbagliata: più avanti una casella resterebbe vuota, o un colore non arriverebbe al suo pallino. ` +
          (k > 1 ? 'L’ho accorciato fino al pezzo giusto: nessun problema!' : 'L’ho tolto io: nessun problema, si riparte!'),
      };
    }
    const L = logicOf(P);
    if (!L.ok) return oldHint(P, st);
    const key = (a, b) => Math.min(a, b) * n * n + Math.max(a, b), eid = new Map();
    L.ED.forEach(([a, b], e) => eid.set(key(a, b), e));
    const T = e => L.S.when[e];
    /* per ogni colore non finito: il prossimo tratto, e quando lo si capisce ragionando */
    let best = null;
    P.ends.forEach((_, c) => {
      if (complete(P, s, c)) return;
      const d0 = dirOf(c);
      for (const d of d0 ? [d0] : [1, -1]) {
        const w = solFrom(c, d), k = Math.max(1, s.p[c].length);
        const e = eid.get(key(w[k - 1], w[k]));
        if (!best || T(e) < best.t) best = { c, d, k, t: T(e), e };
      }
    });
    if (!best) return null;
    const { c, d, k } = best, w = solFrom(c, d);
    let m = k + 1;
    while (m < w.length && T(eid.get(key(w[m - 1], w[m]))) <= best.t) m++;
    const added = w.slice(k, m);
    s.p.forEach((q, j) => { if (j !== c) { const at = q.findIndex(x => added.includes(x)); if (at >= 0) q.length = at; } });
    s.p[c] = w.slice(0, m);
    const why0 = L.S.why[best.e] || { k: 'forced', i: w[k - 1] };
    const i = why0.i == null ? w[k - 1] : why0.i;
    const offs = L.CE[i].filter(e => L.S.e[e] === -1).map(e => (L.S.why[e] || {}).k);
    const near = L.CE[i].some(e => L.cut2[L.ED[e][0]] || L.cut2[L.ED[e][1]]);
    const tag = why0.k === 'imagine' || offs.includes('imagine') ? 'imagine'
      : offs.includes('color') && near ? 'reach' : why0.k === 'fill' ? 'fill' : 'forced';
    const name = `<b>${NAMES[c]}</b>`;
    const more = m - k > 1 ? ` Poi il filo va avanti da solo per ${m - k - 1 === 1 ? 'un’altra casella' : 'altre ' + (m - k - 1) + ' caselle'}: c’è una strada sola.` : '';
    const isEnd = P.ends.some(([a, b]) => a === i || b === i);
    const WHY = {
      forced: isEnd
        ? `Il pallino in ${cell(i)} ha una strada sola: tutto intorno ci sono il bordo, altri pallini o altri fili. Il filo deve andare lì!`
        : `Il filo è arrivato in ${cell(i)} e da lì ha una sola casella libera dove andare. Allora va lì!`,
      fill: `Ogni casella deve avere un filo. La casella in ${cell(i)} ha solo due vicini liberi: il filo entra da uno ed esce dall’altro.`,
      reach: `Vicino alla casella in ${cell(i)} gli altri colori non possono arrivare: sono troppo lontani, o la strada è chiusa. Resta solo il ${name}!`,
      imagine: `Facciamo finta che il filo vada da un’altra parte vicino alla casella in ${cell(i)}. Una casella resterebbe vuota, o un colore non arriverebbe più al suo pallino. Non va bene! Quindi il ${name} passa di qui.`,
    };
    const TIP = {
      forced: `Guarda il filo ${name}. Da dove si trova, quante strade libere ha?`,
      fill: 'Ogni casella deve avere un filo. Cerca una casella vuota con solo due vicini liberi: da dove entra il filo, e da dove esce?',
      reach: `Guarda vicino alla casella in ${cell(i)}. Quali colori riescono ad arrivare fin lì?`,
      imagine: `Facciamo finta: dove può andare il ${name} vicino alla casella in ${cell(i)}? Una strada lascerebbe una casella vuota?`,
    };
    return { state: s, focus: [c], area: [c], tag, tip: TIP[tag], why: WHY[tag] + more };
  }
  /* griglie salvate con le versioni vecchie: si mostra un intero percorso */
  function oldHint(P, st) {
    const n = P.n, NB = neighbors(n), s = Z.clone(st);
    const correct = c => complete(P, s, c) && s.p[c].length === P.sol[c].length && s.p[c].every(i => P.sol[c].includes(i));
    const wrong = P.ends.map((_, c) => c).filter(c => !correct(c));
    if (!wrong.length) return null;
    const own = new Int16Array(n * n).fill(-1);
    s.p.forEach((q, c) => q.forEach(i => { own[i] = c; }));
    P.ends.forEach(([a, b], c) => { own[a] = c; own[b] = c; });
    let forced = -1;
    for (const c of wrong) {
      if (s.p[c].length > 1) continue;
      for (const e of P.ends[c]) if (NB[e].filter(j => own[j] < 0).length === 1) forced = c;
    }
    const inc = wrong.filter(c => !complete(P, s, c));
    const c = forced >= 0 ? forced : Z.pick(inc.length ? inc : wrong);
    const path = P.sol[c].slice(), set = new Set(path);
    let cut = false;
    s.p.forEach((q, k) => {
      if (k === c) return;
      const at = q.findIndex(i => set.has(i));
      if (at >= 0) { q.length = at; cut = true; }
    });
    const wasThere = st.p[c].length > 1;
    s.p[c] = path;
    const border = path.filter(i => i % n === 0 || i % n === n - 1 || i < n || i >= n * n - n).length;
    let why = `Ecco il percorso del <b>${NAMES[c]}</b>. `;
    const tag = forced === c ? 'forced' : border > path.length / 2 ? 'border' : 'fill';
    if (forced === c) why += 'Uno dei suoi pallini aveva una sola casella libera accanto: da lì il percorso è obbligato e si può seguire passo passo. ';
    else if (border > path.length / 2) why += 'Corre lungo il bordo: i percorsi che seguono i bordi lasciano spazio agli altri colori nel centro. ';
    else why += 'Ricorda che ogni casella va riempita: un percorso che isola una casella o un piccolo angolo è sempre sbagliato. ';
    if (wasThere) why += "Il tuo percorso per questo colore era diverso: l'ho sostituito. ";
    if (cut) why += 'Ho accorciato i percorsi che passavano di qui.';
    const tip = tag === 'forced' ? Z.say(`Guarda i pallini del <b>${NAMES[c]}</b>: uno dei due ha una sola casella libera accanto.`, `Il <b>${NAMES[c]}</b> ha poca scelta: segui il pallino che ha una sola strada libera.`) + ' Quando un percorso ha una sola strada, puoi seguirlo passo passo.'
      : tag === 'border' ? `Prova con il <b>${NAMES[c]}</b>: può correre lungo il bordo. I percorsi sul bordo lasciano spazio agli altri colori nel centro.`
      : `Pensa al <b>${NAMES[c]}</b>: ricorda che ogni casella va riempita. Quale strada non lascia caselle o angoli isolati?`;
    return { state: s, focus: [c], area: [c], why, tag, tip };
  }

  Z.register({
    options: OPTIONS,
    id: 'flow',
    name: 'Collega i colori',
    hue: 15,
    tagline: 'Fili colorati che non si incrociano mai.',
    rules: Z.rules({
      goal: `Collega ogni coppia di pallini dello <b>stesso colore</b> con un filo.`,
      rules: [
        `Il filo passa da una casella a quella <b>accanto</b>: sopra, sotto, a destra o a sinistra, mai in diagonale.`,
        `In ogni casella passa <b>un solo filo</b>: i fili non si incrociano.`,
        `Alla fine i fili devono <b>riempire tutta la griglia</b>: nessuna casella resta vuota.`,
        `Nelle griglie grandi alcuni <b>tratti di filo</b> sono già disegnati, tratteggiati: il filo di quel colore deve passare proprio di lì.`,
        `C'è sempre una sola soluzione, e ci si arriva ragionando.`,
      ],
      play: [
        `Trascina il dito da un pallino per disegnare il filo; arriva all'altro pallino dello stesso colore.`,
        `Tocca un punto di un filo già fatto per ripartire da lì. Se passi sopra un altro filo, quello si accorcia.`,
      ],
      start: `Comincia dai pallini sui bordi e negli angoli: hanno poche strade possibili. Se due pallini dello stesso colore sono vicini, uniscili subito. I fili lunghi spesso corrono lungo il bordo.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M18 18h28v14H18v14h28" class="ic-path"/><circle cx="18" cy="18" r="6" class="ic-a"/><circle cx="46" cy="46" r="6" class="ic-a"/></svg>`,
    generate,
    init: P => ({ p: P.ends.map(() => []) }),
    solved(P, s) {
      if (!P.ends.every((_, c) => complete(P, s, c))) return false;
      const seen = new Set();
      s.p.forEach(p => p.forEach(i => seen.add(i)));
      /* i tratti già disegnati vanno rispettati */
      const uses = ([a, b, c]) => { const q = s.p[c], k = q.indexOf(a); return k >= 0 && (q[k + 1] === b || q[k - 1] === b); };
      return seen.size === P.n * P.n && (P.links || []).every(uses);
    },
    _logic: logic,
    _fallbacks: () => fallbackUsed,
    _gen: o => genPaths(o),
    hint,
    view(ctx) {
      const P = ctx.puzzle, n = P.n, NB = neighbors(n);
      const endColor = new Int16Array(n * n).fill(-1);
      P.ends.forEach(([a, b], c) => { endColor[a] = c; endColor[b] = c; });
      let cur = null, drawing = -1;
      const svg = Z.s('svg', { class: 'flow', viewBox: `0 0 ${n} ${n}` });
      Z.s('rect', { x: 0, y: 0, width: n, height: n, rx: 0.3, class: 'fl-bg' }, svg);
      const gCells = Z.s('g', null, svg);
      const cellEls = Z.range(n * n).map(i => Z.s('rect', { x: i % n + 0.04, y: ((i / n) | 0) + 0.04, width: 0.92, height: 0.92, rx: 0.18, class: 'fl-cell' }, gCells));
      /* tratti di filo già disegnati (griglie grandi) */
      const gLinks = Z.s('g', { class: 'fl-links' }, svg);
      for (const [a, b, c] of P.links || []) {
        Z.s('line', { x1: a % n + 0.5, y1: ((a / n) | 0) + 0.5, x2: b % n + 0.5, y2: ((b / n) | 0) + 0.5, stroke: COLORS[c], class: 'fl-link' }, gLinks);
      }
      const gPaths = Z.s('g', null, svg);
      const pathEls = P.ends.map((_, c) => Z.s('polyline', { class: 'fl-path', stroke: COLORS[c] }, gPaths));
      const gEnds = Z.s('g', null, svg);
      const endEls = P.ends.map(([a, b], c) => {
        const g = Z.s('g', { class: 'fl-end' }, gEnds);
        for (const i of [a, b]) {
          Z.s('circle', { cx: i % n + 0.5, cy: ((i / n) | 0) + 0.56, r: 0.34, class: 'fl-dot-sh' }, g);
          Z.s('circle', { cx: i % n + 0.5, cy: ((i / n) | 0) + 0.5, r: 0.34, fill: COLORS[c], class: 'fl-dot' }, g);
          Z.s('circle', { cx: i % n + 0.4, cy: ((i / n) | 0) + 0.4, r: 0.09, class: 'fl-shine' }, g);
        }
        return g;
      });
      const cellAt = e => {
        const p = Z.svgPoint(svg, e);
        const x = Math.floor(p.x), y = Math.floor(p.y);
        return x >= 0 && y >= 0 && x < n && y < n ? y * n + x : -1;
      };
      const owner = (s, i) => s.p.findIndex(q => q.includes(i));

      svg.addEventListener('pointerdown', e => {
        const i = cellAt(e);
        if (i < 0 || !cur) return;
        e.preventDefault();
        const s = Z.clone(cur);
        if (endColor[i] >= 0) { drawing = endColor[i]; s.p[drawing] = [i]; }
        else {
          const c = owner(s, i);
          if (c < 0) return;
          drawing = c;
          s.p[c].length = s.p[c].indexOf(i) + 1;
        }
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        ctx.begin();
        ctx.preview(s);
      });
      const step = i => {
        const path = cur.p[drawing], head = path[path.length - 1];
        if (i === head) return;
        const pos = path.indexOf(i);
        const s = Z.clone(cur), pp = s.p[drawing];
        if (pos >= 0) { pp.length = pos + 1; ctx.preview(s); return; }
        if (!NB[head].includes(i)) return;
        if (complete(P, cur, drawing)) return;
        if (endColor[i] >= 0 && endColor[i] !== drawing) return;
        s.p.forEach((q, k) => { if (k !== drawing) { const at = q.indexOf(i); if (at >= 0) q.length = at; } });
        pp.push(i);
        ctx.preview(s);
      };
      svg.addEventListener('pointermove', e => {
        if (drawing < 0) return;
        const i = cellAt(e);
        if (i < 0) return;
        const path = cur.p[drawing], head = path[path.length - 1];
        /* movimenti veloci: attraversa le caselle in linea retta */
        const hx = head % n, hy = (head / n) | 0, x = i % n, y = (i / n) | 0;
        if ((hx === x || hy === y) && Math.abs(hx - x) + Math.abs(hy - y) > 1 && path.indexOf(i) < 0) {
          const dx = Math.sign(x - hx), dy = Math.sign(y - hy);
          for (let k = 1; k <= Math.abs(x - hx) + Math.abs(y - hy); k++) step((hy + dy * k) * n + hx + dx * k);
        } else step(i);
      });
      const end = () => { if (drawing >= 0) { drawing = -1; ctx.end(); paint(); } };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);

      function paint() {
        const own = new Int16Array(n * n).fill(-1);
        cur.p.forEach((q, c) => {
          q.forEach(i => { own[i] = c; });
          pathEls[c].setAttribute('points', q.map(i => `${i % n + 0.5},${((i / n) | 0) + 0.5}`).join(' '));
          pathEls[c].classList.toggle('done', complete(P, cur, c));
          endEls[c].classList.toggle('done', complete(P, cur, c));
          endEls[c].classList.toggle('active', c === drawing);
        });
        cellEls.forEach((r, i) => {
          if (own[i] >= 0) { r.style.fill = COLORS[own[i]]; r.classList.add('on'); }
          else { r.style.fill = ''; r.classList.remove('on'); }
        });
      }
      /* modalità «Frecce»: «Disegna» parte da un pallino (o da un punto di un percorso) e le frecce allungano il percorso */
      let penC = -1;
      function penStep(j, from) {
        if (!cur) return false;
        const s = Z.clone(cur);
        if (from < 0) {
          if (endColor[j] >= 0) { penC = endColor[j]; s.p[penC] = [j]; }
          else { const c = owner(s, j); if (c < 0) return false; penC = c; s.p[c].length = s.p[c].indexOf(j) + 1; }
          ctx.commit(s);
          return true;
        }
        const pp = s.p[penC], head = pp[pp.length - 1], pos = pp.indexOf(j);
        if (pos >= 0) { pp.length = pos + 1; ctx.commit(s); return true; }
        if (head !== from || !NB[head].includes(j) || complete(P, cur, penC)) return false;
        if (endColor[j] >= 0 && endColor[j] !== penC) return false;
        s.p.forEach((q, k) => { if (k !== penC) { const at = q.indexOf(j); if (at >= 0) q.length = at; } });
        pp.push(j);
        ctx.commit(s);
        return complete(P, cur, penC) ? 'stop' : true;
      }
      return {
        el: svg, aspect: 1,
        render(s) { cur = s; paint(); },
        flash(list) { (list || []).forEach(c => Z.flashEl(endEls[c])); },
        cursor: () => Z.gridCursor(ctx, {
          w: n, h: n, el: i => cellEls[i], start: P.ends[0][0],
          tip: 'Porta il riquadro su un pallino e tocca «Disegna».',
          keys: [{ label: (i, on) => (on ? 'Smetti' : 'Disegna'), icon: Z.ICONS.pen, pen: true,
            tip: 'Le frecce allungano il percorso; tornando indietro lo accorci.', act: penStep }],
        }),
      };
    },
  });
})();
