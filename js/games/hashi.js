/* Ponti (Hashi) — isole generate, unicità verificata con un risolutore */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 12, choices: [{ v: 10, label: '10×10' }, { v: 12, label: '12×12' }, { v: 14, label: '14×14' }, { v: 16, label: '16×16' }, { v: 18, label: '18×18' }, { v: 20, label: '20×20' }] },
    { id: 'isl', label: 'Isole', def: 2, choices: [
      { v: 1, label: 'Poche' }, { v: 2, label: 'Normali' }, { v: 3, label: 'Tante' },
    ] },
  ];
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function build(W, H, target) {
    const isl = new Int16Array(W * H).fill(-1), br = new Uint8Array(W * H);
    const pts = [], sol = new Map();
    const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
    const add = (x, y) => { isl[y * W + x] = pts.length; pts.push([x, y]); };
    const near = (x, y) => DIRS.some(([dx, dy]) => inb(x + dx, y + dy) && isl[(y + dy) * W + x + dx] >= 0);
    add(Z.ri(1, W - 2), Z.ri(1, H - 2));
    for (let it = 0; it < 8000 && pts.length < target; it++) {
      const i = Z.ri(0, pts.length - 1), [x0, y0] = pts[i], [dx, dy] = Z.pick(DIRS);
      const dist = Math.random() < 0.8 ? Z.ri(2, 3) : Z.ri(2, Math.max(2, Math.floor((dx ? W : H) * 0.6)));
      let x = x0 + dx, y = y0 + dy, ok = true;
      const path = [];
      for (let d = 1; d < dist; d++) {
        if (!inb(x, y) || isl[y * W + x] >= 0 || br[y * W + x]) { ok = false; break; }
        path.push(y * W + x); x += dx; y += dy;
      }
      if (!ok || !inb(x, y) || isl[y * W + x] >= 0 || br[y * W + x] || near(x, y)) continue;
      add(x, y);
      for (const p of path) br[p] = dx ? 1 : 2;
      sol.set(i < pts.length - 1 ? i + ',' + (pts.length - 1) : '', Math.random() < 0.45 ? 2 : 1);
    }
    if (pts.length < target * 0.85) return null;

    /* Tutte le coppie in vista: i ponti possibili */
    const E = [];
    for (let a = 0; a < pts.length; a++) {
      const [x, y] = pts[a];
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        let xx = x + dx, yy = y + dy;
        while (inb(xx, yy) && isl[yy * W + xx] < 0) { xx += dx; yy += dy; }
        if (inb(xx, yy)) E.push([a, isl[yy * W + xx]]);
      }
    }
    const key = (a, b) => Math.min(a, b) + ',' + Math.max(a, b);
    /* Qualche anello in più, dove non si incrociano ponti esistenti */
    for (const [a, b] of Z.shuffle(E.slice())) {
      if (sol.has(key(a, b)) || Math.random() > 0.5) continue;
      const [xa, ya] = pts[a], [xb, yb] = pts[b];
      const dx = Math.sign(xb - xa), dy = Math.sign(yb - ya);
      let free = true;
      for (let x = xa + dx, y = ya + dy; x !== xb || y !== yb; x += dx, y += dy) if (br[y * W + x]) { free = false; break; }
      if (!free) continue;
      for (let x = xa + dx, y = ya + dy; x !== xb || y !== yb; x += dx, y += dy) br[y * W + x] = dx ? 1 : 2;
      sol.set(key(a, b), Math.random() < 0.4 ? 2 : 1);
    }
    const n = new Array(pts.length).fill(0);
    const S = E.map(([a, b]) => { const v = sol.get(key(a, b)) || 0; n[a] += v; n[b] += v; return v; });
    return { W, H, pts, n, E, sol: S };
  }

  function crossings(P) {
    const { pts, E } = P;
    const X = E.map(() => []);
    for (let i = 0; i < E.length; i++) for (let j = i + 1; j < E.length; j++) {
      const [a, b] = E[i], [c, d] = E[j];
      const h1 = pts[a][1] === pts[b][1], h2 = pts[c][1] === pts[d][1];
      if (h1 === h2) continue;
      const [hA, hB, vA, vB] = h1 ? [a, b, c, d] : [c, d, a, b];
      const hy = pts[hA][1], hx1 = Math.min(pts[hA][0], pts[hB][0]), hx2 = Math.max(pts[hA][0], pts[hB][0]);
      const vx = pts[vA][0], vy1 = Math.min(pts[vA][1], pts[vB][1]), vy2 = Math.max(pts[vA][1], pts[vB][1]);
      if (vx > hx1 && vx < hx2 && hy > vy1 && hy < vy2) { X[i].push(j); X[j].push(i); }
    }
    return X;
  }

  function connected(P, x) {
    const m = P.pts.length, par = Z.range(m);
    const f = a => (par[a] === a ? a : (par[a] = f(par[a])));
    let comps = m;
    P.E.forEach(([a, b], i) => { if (x[i] > 0) { const ra = f(a), rb = f(b); if (ra !== rb) { par[ra] = rb; comps--; } } });
    return comps === 1;
  }

  function count(P, limit, nodeLimit) {
    const { pts, n, E } = P, X = crossings(P), m = E.length;
    /* ordina le isole in BFS così i vincoli si chiudono presto */
    const adj = pts.map(() => []);
    E.forEach(([a, b], i) => { adj[a].push(i); adj[b].push(i); });
    const seenI = new Uint8Array(pts.length), seenE = new Uint8Array(m), order = [];
    const q = [0]; seenI[0] = 1;
    while (q.length) {
      const a = q.shift();
      for (const e of adj[a]) {
        if (!seenE[e]) { seenE[e] = 1; order.push(e); }
        const o = E[e][0] === a ? E[e][1] : E[e][0];
        if (!seenI[o]) { seenI[o] = 1; q.push(o); }
      }
    }
    for (let e = 0; e < m; e++) if (!seenE[e]) order.push(e);
    const cap = E.map(([a, b]) => Math.min(2, n[a], n[b]));
    const x = new Int8Array(m).fill(-1), sum = new Int16Array(pts.length), rem = new Int16Array(pts.length);
    E.forEach(([a, b], i) => { rem[a] += cap[i]; rem[b] += cap[i]; });
    let cnt = 0, nodes = 0;
    const rec = k => {
      if (cnt >= limit || nodes > nodeLimit) return;
      nodes++;
      if (k === m) { if (connected(P, x)) cnt++; return; }
      const e = order[k], [a, b] = E[e], c = cap[e];
      rem[a] -= c; rem[b] -= c;
      for (let v = 0; v <= c; v++) {
        if (v > 0 && X[e].some(j => x[j] > 0)) break;
        if (sum[a] + v > n[a] || sum[b] + v > n[b]) break;
        if (sum[a] + v + rem[a] < n[a] || sum[b] + v + rem[b] < n[b]) continue;
        x[e] = v; sum[a] += v; sum[b] += v;
        rec(k + 1);
        sum[a] -= v; sum[b] -= v; x[e] = -1;
        if (cnt >= limit || nodes > nodeLimit) break;
      }
      rem[a] += c; rem[b] += c;
    };
    rec(0);
    return nodes > nodeLimit ? -1 : cnt;
  }

  /* ---------- Risolutore «umano» ----------
     Per ogni collegamento tiene quanti ponti ci sono di sicuro (lo) e quanti ce ne possono stare al massimo (hi).
     Livello 1: contare i ponti che servono a un'isola contro quelli che le direzioni libere possono accogliere;
     livello 2: la rete deve restare unica (un ponte che chiuderebbe un gruppo staccato non si può fare;
     l'unico collegamento tra due parti della rete è obbligato).
     Se risolve tutto, la soluzione è anche unica. */
  function makeSolver(P) {
    const { E, n, pts } = P, X = crossings(P), m = E.length, I = pts.length;
    const inc = pts.map(() => []);
    E.forEach(([a, b], e) => { inc[a].push(e); inc[b].push(e); });
    const other = (e, i) => (E[e][0] === i ? E[e][1] : E[e][0]);
    const isl = i => `l'isola con ${Z.il(n[i])}`;
    const many = v => (v === 1 ? 'un ponte' : v + ' ponti');
    function state(b) {
      const S = { lo: Array.from(b), hi: E.map(([a, c]) => Math.min(2, n[a], n[c])), log: [] };
      S.sum = i => inc[i].reduce((t, e) => t + S.lo[e], 0);
      return S;
    }
    /* limiti evidenti: incroci con ponti già fatti, isole già (quasi) complete */
    function tighten(S) {
      let ch = true;
      while (ch) {
        ch = false;
        for (let e = 0; e < m; e++) {
          let h = S.hi[e];
          if (X[e].some(j => S.lo[j] > 0)) h = S.lo[e];
          for (const i of E[e]) h = Math.min(h, S.lo[e] + n[i] - S.sum(i));
          if (h < S.hi[e]) { S.hi[e] = Math.max(h, S.lo[e]); ch = true; }
        }
      }
    }
    /* livello 1: ponti obbligati contando */
    function counting(S) {
      let best = null;
      for (let i = 0; i < I; i++) {
        const need = n[i] - S.sum(i);
        if (need <= 0) continue;
        const open = inc[i].filter(e => S.hi[e] > S.lo[e]);
        const cap = open.reduce((t, e) => t + S.hi[e] - S.lo[e], 0);
        for (const e of open) {
          const forced = need - (cap - (S.hi[e] - S.lo[e]));
          if (forced > 0 && (!best || open.length < best.open.length)) best = { i, e, forced, need, open, cap };
        }
      }
      return best;
    }
    /* livello 2: la rete */
    function compOf(lo, from) {
      const seen = new Set([from]), q = [from];
      while (q.length) { const x = q.pop(); for (const e of inc[x]) if (lo[e] > 0) { const o = other(e, x); if (!seen.has(o)) { seen.add(o); q.push(o); } } }
      return seen;
    }
    function network(S) {
      /* un ponte in più che chiuderebbe un gruppo completo staccato dagli altri */
      for (let e = 0; e < m; e++) {
        if (S.hi[e] <= S.lo[e]) continue;
        const lo = S.lo.slice();
        lo[e]++;
        const C = compOf(lo, E[e][0]);
        if (C.size === I) continue;
        if (![...C].every(i => inc[i].reduce((t, f) => t + lo[f], 0) === n[i])) continue;
        const [a, b] = E[e];
        S.hi[e] = S.lo[e];
        return { kind: 'cut', e, txt: `${S.lo[e] ? 'Un secondo ponte' : 'Un ponte'} tra ${isl(a)} e ${isl(b)} completerebbe ${C.size === 2 ? 'tutte e due' : 'un gruppo di ' + C.size + ' isole'}, che resterebbe${C.size === 2 ? 'ro' : ''} staccat${C.size === 2 ? 'e' : 'o'} dalle altre: quindi lì ${S.lo[e] ? 'il ponte resta singolo' : 'non può esserci un ponte'}.`, src: [a, b] };
      }
      /* l'unico collegamento possibile tra due parti: il ponte serve per forza */
      for (let e = 0; e < m; e++) {
        if (S.lo[e] > 0 || S.hi[e] === 0) continue;
        const hi = S.hi.slice();
        hi[e] = 0;
        const C = compOf(hi, E[e][0]);
        if (C.size < I && !C.has(E[e][1])) return { kind: 'link', e, size: Math.min(C.size, I - C.size) };
      }
      return null;
    }
    const done = S => pts.every((_, i) => S.sum(i) === n[i]) && compOf(S.lo, 0).size === I;
    /* un passo: eventuali limiti trovati (log), poi un ponte sicuro */
    function next(b, L) {
      const S = state(b);
      for (let k = 0; k < 4 * m + 10; k++) {
        tighten(S);
        if (done(S)) return null;
        const c = counting(S);
        if (c) return Object.assign({ S, lv: 1 }, c);
        if (L < 2) return null;
        const r = network(S);
        if (!r) return null;
        if (r.kind === 'link') return { S, lv: 2, link: r, e: r.e, forced: 1 };
        S.log.push(r);
      }
      return null;
    }
    return {
      next,
      explainCount(c, i, o) {
        return c.open.length === 1
          ? `${isl(i)[0].toUpperCase() + isl(i).slice(1)} ha ancora bisogno di ${many(c.need)}, ma può collegarsi solo all'isola ${dirName(P, i, o)}: le altre direzioni sono chiuse (isole già complete, ponti che si incrocerebbero o nessuna isola). ${c.need === 1 ? 'Il ponte va' : 'I ponti vanno'} lì.`
          : `${isl(i)[0].toUpperCase() + isl(i).slice(1)} ha ancora bisogno di ${many(c.need)} e ha ${c.open.length} direzioni libere, che insieme ne possono accogliere al massimo ${c.cap}. Anche riempiendo al massimo le altre ne mancherebbe${c.forced === 1 ? '' : 'ro'} ${c.forced}: quindi verso l'isola ${dirName(P, i, o)} ${c.forced === 1 ? 'serve almeno un ponte' : 'servono due ponti'}.`;
      },
      solve(L) {
        const S = state(new Array(m).fill(0));
        let hard = 1;
        for (let k = 0; k < 8 * m + 10; k++) {
          tighten(S);
          if (done(S)) return { ok: true, hard };
          const c = counting(S);
          if (c) { S.lo[c.e] += c.forced; continue; }
          if (L < 2) break;
          const r = network(S);
          if (!r) break;
          hard = 2;
          if (r.kind === 'link') S.lo[r.e] = 1;
        }
        return { ok: false, hard };
      },
    };
  }
  const solvers = new WeakMap();
  const solverOf = P => { let s = solvers.get(P); if (!s) { s = makeSolver(P); solvers.set(P, s); } return s; };

  function generate(opt) {
    const W = opt.size, H = opt.size;
    let target = Math.round(W * H * [0.3, 0.22, 0.3, 0.36][opt.isl]), last = null;
    /* se non se ne trovano, qualche isola in meno */
    for (let round = 0; round < 12; round++) {
      const t0 = Z.now();
      for (let t = 0; t < 600 && Z.now() - t0 < 1200; t++) {
        const P = build(W, H, target);
        if (!P) continue;
        last = P;
        /* si tengono solo rompicapo che si risolvono ragionando (contare i ponti e tenere unita la rete):
           così la soluzione è anche unica, e non serve mai tirare a indovinare */
        if (makeSolver(P).solve(2).ok) return P;
      }
      target = Math.round(target * 0.92);
    }
    return last;
  }

  /* ---------- Suggerimento spiegato ---------- */
  function dirName(P, i, o) {
    const [x, y] = P.pts[i], [xo, yo] = P.pts[o];
    return xo > x ? 'a destra' : xo < x ? 'a sinistra' : yo > y ? 'in basso' : 'in alto';
  }
  function hint(P, st) {
    const s = Z.clone(st), X = crossings(P), { E, n } = P;
    const over = s.b.map((v, i) => (v > P.sol[i] ? i : -1)).filter(i => i >= 0);
    if (over.length) {
      const e = Z.pick(over), [a, b] = E[e];
      const tot = i => E.reduce((t, [x, y], j) => t + (x === i || y === i ? s.b[j] : 0), 0);
      const full = [a, b].find(i => tot(i) > n[i]);
      const cross = X[e].find(j => P.sol[j] > 0);
      const cut = P.sol[e] === 0;
      s.b[e] = P.sol[e];
      let tip, why;
      if (full != null) {
        tip = Z.say(`Guarda l'isola con ${Z.il(n[full])} che si illumina: quanti ponti ha adesso?`, `Conta con calma i ponti dell'isola con ${Z.il(n[full])}: sono quelli che il numero chiede?`) +
          " Un'isola non può avere più ponti del suo numero: se sono troppi, uno va ridotto.";
        why = `L'isola con ${Z.il(n[full])} ha ${tot(full)} ponti, più del suo numero: il ponte tra queste due isole è di troppo. `;
      } else if (cross != null) {
        const [c, d] = E[cross];
        tip = Z.say('Guarda i ponti vicino alle isole che si illuminano: ce ne sono due che si incrociano?', 'Segui con lo sguardo il ponte tra le isole che si illuminano: attraversa un altro ponte?') +
          " I ponti non possono mai incrociarsi: uno dei due deve lasciare spazio all'altro.";
        why = `Questo ponte attraversa il collegamento tra le isole con ${Z.il(n[c])} e il <b>${n[d]}</b>, che serve per completare i loro numeri. Due ponti non possono incrociarsi, quindi qui non può passare. `;
      } else {
        tip = Z.say('Guarda le due isole che si illuminano: il ponte tra loro è davvero necessario?', 'Per le isole che si illuminano, prova a contare dove possono ancora andare i ponti che mancano.') +
          ' Pensa a quanti ponti restano da mettere a ogni isola vicina e a quali isole possono ancora raggiungere.';
        why = `Tra le isole con ${Z.il(n[a])} e il <b>${n[b]}</b> ${cut ? 'non serve nessun ponte' : 'basta meno di così'}: con quello che c'è, le isole vicine non riuscirebbero più a completare i loro ponti, oppure un gruppo resterebbe staccato dal resto. `;
      }
      return {
        state: s, focus: [a, b], area: [a, b],
        tag: 'wrong', tip,
        why: why + (cut ? "L'ho tolto." : "L'ho ridotto.") + (over.length > 1 ? (over.length === 2 ? ' C\'è ancora un altro ponte da ricontrollare.' : ` Ci sono ancora altri ${over.length - 1} ponti da ricontrollare.`) : ''),
      };
    }
    /* il prossimo ponte sicuro secondo il risolutore «umano» (controllato con la soluzione) */
    const r = solverOf(P).next(s.b, 2);
    if (r && s.b[r.e] + r.forced <= P.sol[r.e]) {
      const e = r.e, [a, b] = E[e];
      s.b[e] += r.forced;
      if (r.link) {
        return {
          state: s, focus: [a, b], area: [a, b], tag: 'connect',
          tip: 'Pensa alla rete: alla fine tutte le isole devono essere collegate. C’è un gruppo di isole che può raggiungere le altre in un solo modo?',
          why: `Tra l'isola con ${Z.il(n[a])} e quella con ${Z.il(n[b])} passa l'unico collegamento possibile tra ${r.link.size === 1 ? 'un’isola' : 'un gruppo di ' + r.link.size + ' isole'} e il resto della rete: le altre strade sono chiuse. Quindi qui serve almeno un ponte.`,
        };
      }
      const i = r.i, o = E[e][0] === i ? E[e][1] : E[e][0];
      const rel = r.S.log.filter(x => E[x.e].includes(i) || r.open.some(f => E[f].includes(E[x.e][0]) && E[f].includes(E[x.e][1])));
      const tag = rel.length ? 'connect' : r.open.length === 1 ? 'only' : 'count';
      const why = (rel.length ? [...new Set(rel.map(x => x.txt))].slice(-2).join(' ') + ' ' : '') + solverOf(P).explainCount(r, i, o);
      const tip = rel.length
        ? 'Pensa alla rete: alla fine tutte le isole devono essere collegate. Un ponte che completerebbe un gruppo di isole staccato dagli altri non si può fare: questo cambia i conti di qualche isola?'
        : r.open.length === 1
          ? Z.say(`Guarda l'isola con ${Z.il(n[i])}: in quante direzioni può ancora mandare ponti?`, `L'isola con ${Z.il(n[i])} ha ancora bisogno di ponti. Verso quali isole può davvero andare?`) +
            ' Un’isola già completa, un ponte che si incrocerebbe o il bordo chiudono una direzione.'
          : `Guarda l'isola con ${Z.il(n[i])}: le servono ancora ${r.need} ponti. Quanti ne possono accogliere, al massimo, le direzioni ancora libere? Se anche riempiendole tutte ne mancano, qualche ponte è obbligato.`;
      return { state: s, focus: [i, o], area: rel.length ? [...new Set([i, ...rel.flatMap(x => x.src)])] : [i], why, tag, tip };
    }
    /* rompicapo di prima (salvati con le versioni vecchie) che la logica non risolve */
    const miss = s.b.map((v, i) => (v < P.sol[i] ? i : -1)).filter(i => i >= 0);
    if (!miss.length) return null;
    const e = Z.pick(miss);
    s.b[e] = P.sol[e];
    for (const j of X[e]) s.b[j] = 0;
    return {
      state: s, focus: [E[e][0], E[e][1]], area: [],
      tip: 'Contando i ponti di ogni isola non c\'è niente di obbligato. Pensa alla rete: alla fine tutte le isole devono essere collegate. Quali ponti chiuderebbero un gruppo di isole separato dal resto?',
      tag: 'connect', why: "Contando i ponti di ogni isola non c'è una mossa obbligata. Serve un ragionamento sulla <b>connessione</b>: alcune scelte chiuderebbero un gruppo di isole separato dal resto, che non potrebbe più collegarsi. Questo ponte fa parte della soluzione.",
    };
  }

  Z.register({
    options: OPTIONS,
    id: 'hashi',
    name: 'Ponti',
    hue: 200,
    tagline: 'Unisci le isole con ponti di legno.',
    rules: Z.rules({
      goal: `Unisci tutte le <b>isole</b> (i cerchi con il numero) con dei <b>ponti</b>.`,
      rules: [
        `Il numero di un'isola dice <b>quanti ponti</b> partono da lì, contando tutti i lati.`,
        `I ponti sono <b>dritti</b>, in orizzontale o in verticale, e vanno da un'isola alla prima isola che incontrano.`,
        `Tra due isole ci possono essere <b>uno o due ponti</b>, non di più.`,
        `I ponti <b>non si incrociano</b> e non passano sopra le isole.`,
        `Alla fine deve essere tutto <b>un'unica rete</b>: da ogni isola si arriva a tutte le altre camminando sui ponti.`,
      ],
      play: [
        `Tocca un'isola e poi un'isola vicina, oppure trascina il dito da un'isola verso un'altra: fai un ponte.`,
        `Rifallo per avere un <b>ponte doppio</b>; una terza volta il ponte sparisce. Puoi anche toccare direttamente un ponte.`,
      ],
      start: `Comincia dalle isole con meno vicini. Un'isola «4» con due soli vicini ha due ponti doppi; un'isola «6» con tre vicini ha tre ponti doppi. Un'isola «1» vicina solo a un'altra «1» non va unita a lei, altrimenti quelle due resterebbero isolate dal resto.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><path d="M18 20h28M18 24h28M18 22v26" class="ic-l2"/><circle cx="16" cy="22" r="9" class="ic-s ic-st"/><circle cx="48" cy="22" r="9" class="ic-s ic-st"/><circle cx="16" cy="48" r="9" class="ic-a"/><text x="16" y="26" class="ic-t">3</text><text x="48" y="26" class="ic-t">2</text></svg>`,
    generate,
    _count: count,
    /* risolto dalla sola logica = soluzione unica; altrimenti si conta con la ricerca */
    _check(P) { return makeSolver(P).solve(2).ok || count(P, 2, 400000) === 1 ? '' : 'NON unico'; },
    init: P => ({ b: new Array(P.E.length).fill(0) }),
    solved(P, s) {
      const sum = new Array(P.pts.length).fill(0);
      P.E.forEach(([a, b], i) => { sum[a] += s.b[i]; sum[b] += s.b[i]; });
      if (sum.some((v, i) => v !== P.n[i])) return false;
      const X = crossings(P);
      if (s.b.some((v, i) => v > 0 && X[i].some(j => s.b[j] > 0))) return false;
      return connected(P, s.b);
    },
    hint,
    view(ctx) {
      const P = ctx.puzzle, { W, H, pts, E } = P, X = crossings(P);
      let cur = null, sel = -1;
      const svg = Z.s('svg', { class: 'hashi', viewBox: `0 0 ${W} ${H}` });
      const gDots = Z.s('g', { class: 'h-dots' }, svg);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) Z.s('circle', { cx: x + 0.5, cy: y + 0.5, r: 0.045 }, gDots);
      const gBr = Z.s('g', { class: 'h-br' }, svg);
      const gHit = Z.s('g', { class: 'h-hit' }, svg);
      const gIs = Z.s('g', { class: 'h-is' }, svg);
      const brEls = E.map(([a, b], i) => {
        const [xa, ya] = pts[a], [xb, yb] = pts[b];
        const hz = ya === yb;
        const g = Z.s('g', null, gBr);
        const off = 0.11;
        const l1 = Z.s('line', hz ? { x1: xa + 0.9, x2: xb + 0.1, y1: ya + 0.5 - off, y2: yb + 0.5 - off } : { x1: xa + 0.5 - off, x2: xb + 0.5 - off, y1: ya + 0.9, y2: yb + 0.1 }, g);
        const l2 = Z.s('line', hz ? { x1: xa + 0.9, x2: xb + 0.1, y1: ya + 0.5 + off, y2: yb + 0.5 + off } : { x1: xa + 0.5 + off, x2: xb + 0.5 + off, y1: ya + 0.9, y2: yb + 0.1 }, g);
        const l0 = Z.s('line', hz ? { x1: xa + 0.9, x2: xb + 0.1, y1: ya + 0.5, y2: yb + 0.5 } : { x1: xa + 0.5, x2: xb + 0.5, y1: ya + 0.9, y2: yb + 0.1 }, g);
        const hit = Z.s('line', { x1: xa + 0.5, y1: ya + 0.5, x2: xb + 0.5, y2: yb + 0.5, 'data-e': i }, gHit);
        hit.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); cycle(i); });
        return { g, l0, l1, l2 };
      });
      const isEls = pts.map(([x, y], i) => {
        const g = Z.s('g', { class: 'isl', 'data-i': i }, gIs);
        Z.s('circle', { cx: x + 0.5, cy: y + 0.5 + 0.06, r: 0.41, class: 'isl-sh' }, g);
        Z.s('circle', { cx: x + 0.5, cy: y + 0.5, r: 0.41, class: 'isl-bg' }, g);
        const t = Z.s('text', { x: x + 0.5, y: y + 0.52, class: 'isl-t' }, g);
        t.textContent = P.n[i];
        return g;
      });
      const neighbor = (i, dx, dy) => E.findIndex(([a, b]) => {
        const o = a === i ? b : b === i ? a : -1;
        if (o < 0) return false;
        const vx = Math.sign(pts[o][0] - pts[i][0]), vy = Math.sign(pts[o][1] - pts[i][1]);
        return vx === dx && vy === dy;
      });
      const edgeBetween = (i, j) => E.findIndex(([a, b]) => (a === i && b === j) || (a === j && b === i));
      function cycle(e) {
        if (!cur) return;
        const s = Z.clone(cur);
        const nv = (s.b[e] + 1) % 3;
        if (nv > 0 && X[e].some(j => s.b[j] > 0)) { Z.flashEl(brEls[X[e].find(j => s.b[j] > 0)].g); return; }
        s.b[e] = nv;
        sel = -1;
        ctx.commit(s);
      }
      let down = null;
      svg.addEventListener('pointerdown', ev => {
        const t = ev.target.closest && ev.target.closest('.isl');
        if (!t) { sel = -1; paint(); return; }
        ev.preventDefault();
        down = { i: +t.dataset.i, p: Z.svgPoint(svg, ev), id: ev.pointerId };
        try { svg.setPointerCapture(ev.pointerId); } catch (err) { /* ok */ }
      });
      svg.addEventListener('pointerup', ev => {
        if (!down || ev.pointerId !== down.id) return;
        const p = Z.svgPoint(svg, ev), i = down.i;
        const dx = p.x - down.p.x, dy = p.y - down.p.y;
        down = null;
        if (Math.hypot(dx, dy) > 0.45) {
          const e = Math.abs(dx) > Math.abs(dy) ? neighbor(i, Math.sign(dx), 0) : neighbor(i, 0, Math.sign(dy));
          if (e >= 0) cycle(e);
          return;
        }
        if (sel >= 0 && sel !== i) {
          const e = edgeBetween(sel, i);
          if (e >= 0) { cycle(e); return; }
        }
        sel = sel === i ? -1 : i;
        paint();
      });
      svg.addEventListener('pointercancel', () => { down = null; });

      function paint() {
        if (!cur) return;
        const sum = new Array(pts.length).fill(0);
        E.forEach(([a, b], i) => {
          const v = cur.b[i];
          sum[a] += v; sum[b] += v;
          const el = brEls[i];
          el.l0.style.display = v === 1 ? '' : 'none';
          el.l1.style.display = v === 2 ? '' : 'none';
          el.l2.style.display = v === 2 ? '' : 'none';
        });
        isEls.forEach((g, i) => {
          g.classList.toggle('ok', sum[i] === P.n[i]);
          g.classList.toggle('over', sum[i] > P.n[i]);
          g.classList.toggle('sel', i === sel);
          g.classList.toggle('cand', sel >= 0 && i !== sel && edgeBetween(sel, i) >= 0);
        });
      }
      /* modalità «Frecce»: il riquadro salta da un'isola all'altra; «Ponte» e una freccia fanno il ponte */
      const nearest = (i, d) => {
        const [dx, dy] = Z.DIRS[d], [x, y] = pts[i];
        let best = i, bs = 1e9;
        pts.forEach(([px, py], j) => {
          const a = (px - x) * dx + (py - y) * dy, b = Math.abs((px - x) * dy) + Math.abs((py - y) * dx);
          if (j === i || a <= 0) return;
          const sc = a + 2 * b;
          if (sc < bs) { bs = sc; best = j; }
        });
        return best;
      };
      return {
        el: svg, aspect: W / H,
        render(s) { cur = s; paint(); },
        cursor: () => Z.gridCursor(ctx, {
          el: i => isEls[i], step: nearest,
          tip: 'Le frecce passano da un\'isola all\'altra.',
          keys: [{ label: 'Ponte', icon: Z.ICONS.bridge, dir: true, tip: 'Scegli con una freccia verso quale isola fare il ponte (di nuovo: doppio, poi lo togli).',
            act(i, d) { const e = neighbor(i, ...Z.DIRS[d]); if (e >= 0) cycle(e); else Z.flashEl(isEls[i]); } }],
        }),
        flash(list) { (list || []).forEach(i => Z.flashEl(isEls[i])); },
      };
    },
  });
})();
