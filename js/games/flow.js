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

  function generate(opt) {
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

  const complete = (P, s, c) => {
    const p = s.p[c];
    if (p.length < 2) return false;
    const [a, b] = P.ends[c];
    return (p[0] === a && p[p.length - 1] === b) || (p[0] === b && p[p.length - 1] === a);
  };

  /* ---------- Suggerimento spiegato ---------- */
  const NAMES = ['rosso', 'arancione', 'giallo', 'verde', 'turchese', 'blu', 'viola', 'rosa', 'marrone', 'verde lime', 'blu notte', 'grigio'];
  function hint(P, st) {
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
    if (forced === c) why += 'Uno dei suoi pallini aveva una sola casella libera accanto: da lì il percorso è obbligato e si può seguire passo passo. ';
    else if (border > path.length / 2) why += 'Corre lungo il bordo: i percorsi che seguono i bordi lasciano spazio agli altri colori nel centro. ';
    else why += 'Ricorda che ogni casella va riempita: un percorso che isola una casella o un piccolo angolo è sempre sbagliato. ';
    if (wasThere) why += "Il tuo percorso per questo colore era diverso: l'ho sostituito. ";
    if (cut) why += 'Ho accorciato i percorsi che passavano di qui.';
    return { state: s, focus: [c], why };
  }

  Z.register({
    options: OPTIONS,
    id: 'flow',
    name: 'Collega i colori',
    hue: 15,
    tagline: 'Fili colorati che non si incrociano mai.',
    rules: `<p>Collega ogni coppia di pallini dello <b>stesso colore</b> con un percorso fatto di caselle adiacenti (niente diagonali).</p>
      <p>I percorsi <b>non si incrociano</b> e, alla fine, devono <b>riempire tutta la griglia</b>.</p>
      <p>Trascina da un pallino per disegnare. Riparti da un punto di un percorso per correggerlo.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M18 18h28v14H18v14h28" class="ic-path"/><circle cx="18" cy="18" r="6" class="ic-a"/><circle cx="46" cy="46" r="6" class="ic-a"/></svg>`,
    generate,
    init: P => ({ p: P.ends.map(() => []) }),
    solved(P, s) {
      if (!P.ends.every((_, c) => complete(P, s, c))) return false;
      const seen = new Set();
      s.p.forEach(p => p.forEach(i => seen.add(i)));
      return seen.size === P.n * P.n;
    },
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
      return {
        el: svg, aspect: 1,
        render(s) { cur = s; paint(); },
        flash(list) { (list || []).forEach(c => Z.flashEl(endEls[c])); },
      };
    },
  });
})();
