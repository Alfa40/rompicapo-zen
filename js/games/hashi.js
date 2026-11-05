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

  function generate(opt) {
    const W = opt.size, H = opt.size;
    let target = Math.round(W * H * [0.3, 0.22, 0.3, 0.36][opt.isl]), last = null;
    /* solo rompicapo con soluzione unica verificata; se non se ne trovano, qualche isola in meno */
    for (let round = 0; round < 12; round++) {
      const t0 = Z.now();
      for (let t = 0; t < 600 && Z.now() - t0 < 1200; t++) {
        const P = build(W, H, target);
        if (!P) continue;
        last = P;
        if (count(P, 2, 150000) === 1) return P;
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
      const e = Z.pick(over);
      s.b[e] = P.sol[e];
      return {
        state: s, focus: [E[e][0], E[e][1]],
        why: 'Il ponte tra queste due isole è di troppo: con lui il rompicapo non potrebbe più essere completato. ' + (P.sol[e] ? "L'ho ridotto." : "L'ho tolto.") +
          (over.length > 1 ? ` Ci sono altri ${over.length - 1} ponti da rivedere.` : ''),
      };
    }
    const sum = new Array(P.pts.length).fill(0);
    E.forEach(([a, b], i) => { sum[a] += s.b[i]; sum[b] += s.b[i]; });
    const inc = P.pts.map(() => []);
    E.forEach(([a, b], i) => { inc[a].push(i); inc[b].push(i); });
    const room = (e, from) => {
      const o = E[e][0] === from ? E[e][1] : E[e][0];
      if (X[e].some(j => s.b[j] > 0)) return 0;
      return Math.max(0, Math.min(2 - s.b[e], n[o] - sum[o]));
    };
    const cands = [];
    P.pts.forEach((_, i) => {
      const need = n[i] - sum[i];
      if (need <= 0) return;
      const open = inc[i].filter(e => room(e, i) > 0);
      const cap = open.reduce((t, e) => t + room(e, i), 0);
      for (const e of open) {
        const forced = need - (cap - room(e, i));
        if (forced > 0 && s.b[e] + forced <= P.sol[e]) cands.push({ i, e, forced, need, open, cap });
      }
    });
    if (cands.length) {
      cands.sort((p, q) => p.open.length - q.open.length);
      const c = cands[0], { i, e } = c;
      const o = E[e][0] === i ? E[e][1] : E[e][0];
      s.b[e] += c.forced;
      let why;
      if (c.open.length === 1) {
        why = `L'isola con il <b>${n[i]}</b> ha ancora bisogno di ${c.need === 1 ? 'un ponte' : c.need + ' ponti'}, ma può collegarsi solo all'isola ${dirName(P, i, o)}: ` +
          `le altre direzioni sono bloccate (isole già complete, ponti che si incrocerebbero o nessuna isola). ${c.need === 1 ? 'Il ponte va' : 'I ponti vanno'} lì.`;
      } else {
        why = `L'isola con il <b>${n[i]}</b> ha ancora bisogno di ${c.need} ponti e ha ${c.open.length} direzioni disponibili, che insieme ne possono accogliere al massimo ${c.cap}. ` +
          `Anche riempiendo al massimo le altre direzioni ne mancherebbe${c.forced === 1 ? '' : 'ro'} ${c.forced}: quindi verso l'isola ${dirName(P, i, o)} ${c.forced === 1 ? 'serve almeno un ponte' : 'servono due ponti'}.`;
      }
      return { state: s, focus: [i, o], why };
    }
    const miss = s.b.map((v, i) => (v < P.sol[i] ? i : -1)).filter(i => i >= 0);
    if (!miss.length) return null;
    const e = Z.pick(miss);
    s.b[e] = P.sol[e];
    for (const j of X[e]) s.b[j] = 0;
    return {
      state: s, focus: [E[e][0], E[e][1]],
      why: "Contando i ponti di ogni isola non c'è una mossa obbligata. Serve un ragionamento sulla <b>connessione</b>: alcune scelte chiuderebbero un gruppo di isole separato dal resto, che non potrebbe più collegarsi. Questo ponte fa parte della soluzione.",
    };
  }

  Z.register({
    options: OPTIONS,
    id: 'hashi',
    name: 'Ponti',
    hue: 200,
    tagline: 'Unisci le isole con ponti di legno.',
    rules: `<p>Collega tutte le isole con dei ponti. Il numero su ogni isola dice <b>quanti ponti</b> partono da lì.</p>
      <p>I ponti sono dritti, orizzontali o verticali, <b>non si incrociano</b> e tra due isole ce ne possono essere al massimo <b>due</b>. Alla fine tutte le isole devono essere collegate in un'unica rete.</p>
      <p>Tocca un'isola e poi una vicina, oppure trascina da un'isola verso un'altra. Ripeti per fare un ponte doppio, una terza volta per toglierlo.</p>`,
    icon: `<svg viewBox="0 0 64 64"><path d="M18 20h28M18 24h28M18 22v26" class="ic-l2"/><circle cx="16" cy="22" r="9" class="ic-s ic-st"/><circle cx="48" cy="22" r="9" class="ic-s ic-st"/><circle cx="16" cy="48" r="9" class="ic-a"/><text x="16" y="26" class="ic-t">3</text><text x="48" y="26" class="ic-t">2</text></svg>`,
    generate,
    _count: count,
    _check(P) { return count(P, 2, 400000) === 1 ? '' : 'NON unico'; },
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
