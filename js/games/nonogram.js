/* Nonogramma — immagini simmetriche generate, risolvibili riga per riga (unicità garantita) */
(function () {
  'use strict';
  const Z = window.Zen;
  const SIZES = { easy: [12, 12], normal: [15, 15], hard: [18, 18] };

  function clueOf(line) {
    const r = []; let c = 0;
    for (const x of line) { if (x === 1) c++; else if (c) { r.push(c); c = 0; } }
    if (c) r.push(c);
    return r;
  }

  /* Deduzione su una singola linea: -1 ignoto, 1 pieno, 0 vuoto. null = contraddizione */
  function solveLine(line, clue) {
    const n = line.length, k = clue.length, K = k + 1;
    const memo = new Int8Array((n + 1) * K).fill(-1);
    const fits = (i, j) => {
      const L = clue[j];
      if (i + L > n) return false;
      for (let t = i; t < i + L; t++) if (line[t] === 0) return false;
      return !(i + L < n && line[i + L] === 1);
    };
    const f = (i, j) => {
      if (i >= n) return j === k;
      const key = i * K + j;
      if (memo[key] >= 0) return memo[key] === 1;
      let r = false;
      if (line[i] !== 1 && f(i + 1, j)) r = true;
      if (!r && j < k && fits(i, j) && f(Math.min(n, i + clue[j] + 1), j + 1)) r = true;
      memo[key] = r ? 1 : 0;
      return r;
    };
    if (!f(0, 0)) return null;
    const canF = new Uint8Array(n), canE = new Uint8Array(n), seen = new Uint8Array((n + 1) * K);
    const mark = (i, j) => {
      if (i >= n) return;
      const key = i * K + j;
      if (seen[key]) return;
      seen[key] = 1;
      if (line[i] !== 1 && f(i + 1, j)) { canE[i] = 1; mark(i + 1, j); }
      if (j < k && fits(i, j)) {
        const nx = Math.min(n, i + clue[j] + 1);
        if (f(nx, j + 1)) {
          for (let t = i; t < i + clue[j]; t++) canF[t] = 1;
          if (i + clue[j] < n) canE[i + clue[j]] = 1;
          mark(nx, j + 1);
        }
      }
    };
    mark(0, 0);
    const out = line.slice();
    for (let i = 0; i < n; i++) {
      if (canF[i] && !canE[i]) out[i] = 1;
      else if (!canF[i] && canE[i]) out[i] = 0;
      else if (!canF[i] && !canE[i]) return null;
    }
    return out;
  }

  function lineSolve(w, h, rows, cols) {
    const g = new Array(w * h).fill(-1);
    const dr = new Uint8Array(h).fill(1), dc = new Uint8Array(w).fill(1);
    let changed = true, rounds = 0;
    while (changed) {
      changed = false; rounds++;
      for (let y = 0; y < h; y++) {
        if (!dr[y]) continue;
        dr[y] = 0;
        const line = g.slice(y * w, y * w + w);
        const r = solveLine(line, rows[y]);
        if (!r) return null;
        for (let x = 0; x < w; x++) if (r[x] !== line[x]) { g[y * w + x] = r[x]; dc[x] = 1; changed = true; }
      }
      for (let x = 0; x < w; x++) {
        if (!dc[x]) continue;
        dc[x] = 0;
        const line = [];
        for (let y = 0; y < h; y++) line.push(g[y * w + x]);
        const r = solveLine(line, cols[x]);
        if (!r) return null;
        for (let y = 0; y < h; y++) if (r[y] !== line[y]) { g[y * w + x] = r[y]; dr[y] = 1; changed = true; }
      }
    }
    if (g.includes(-1)) return null;
    g.rounds = rounds;
    return g;
  }

  function genImage(w, h, p, sym, smooth) {
    let g = Z.range(w * h).map(() => (Math.random() < p ? 1 : 0));
    for (let it = 0; it < smooth; it++) {
      const ng = g.slice();
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        let c = 0;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h) c += g[yy * w + xx];
        }
        ng[y * w + x] = c >= 5 ? 1 : 0;
      }
      g = ng;
    }
    if (sym) for (let y = 0; y < h; y++) for (let x = 0; x < (w >> 1); x++) g[y * w + (w - 1 - x)] = g[y * w + x];
    return g;
  }

  function generate(level) {
    const [w, h] = SIZES[level];
    const want = level === 'easy' ? 12 : level === 'normal' ? 24 : 40;
    const t0 = Z.now();
    let best = null, found = 0;
    for (let t = 0; t < 6000 && found < want; t++) {
      if (best && Z.now() - t0 > (level === 'hard' ? 1600 : 900)) break;
      const img = genImage(w, h, 0.48 + Math.random() * 0.14, Math.random() < 0.6, 1);
      const noise = level === 'hard' ? 0.13 : 0.1;
      for (let i = 0; i < img.length; i++) if (Math.random() < noise) img[i] ^= 1;
      const fill = img.reduce((a, b) => a + b, 0) / (w * h);
      if (fill < 0.4 || fill > 0.66) continue;
      const rows = Z.range(h).map(y => clueOf(img.slice(y * w, y * w + w)));
      const cols = Z.range(w).map(x => clueOf(Z.range(h).map(y => img[y * w + x])));
      if (rows.some(r => !r.length) || cols.some(c => !c.length)) continue;
      const r = lineSolve(w, h, rows, cols);
      if (!r) continue;
      found++;
      const score = r.rounds + Math.random() * 0.5;
      if (!best || score > best.score) best = { score, P: { w, h, rows, cols, sol: img } };
    }
    return best && best.P;
  }

  function lineDone(st, P, isRow, k) {
    const { w, h } = P;
    const line = isRow ? Z.range(w).map(x => (st.c[k * w + x] === 1 ? 1 : 0)) : Z.range(h).map(y => (st.c[y * w + k] === 1 ? 1 : 0));
    const a = clueOf(line), b = isRow ? P.rows[k] : P.cols[k];
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }

  /* ---------- Suggerimento spiegato: deduzione su una linea ---------- */
  function hint(P, st) {
    const { w, h } = P, N = w * h, s = Z.clone(st);
    const wrong = [];
    for (let i = 0; i < N; i++) {
      if (s.c[i] === 1 && !P.sol[i]) wrong.push(i);
      if (s.c[i] === 2 && P.sol[i]) wrong.push(i);
    }
    if (wrong.length) {
      const i = Z.pick(wrong), was = s.c[i];
      s.c[i] = 0;
      return {
        state: s, focus: [i],
        why: `La casella in ${Z.cellName(i, w)} ${was === 1 ? 'è stata colorata, ma deve restare vuota' : 'è segnata come vuota, ma va colorata'}: così gli indizi non potrebbero essere rispettati. L'ho liberata.` +
          (wrong.length > 1 ? ` Ci sono altre ${wrong.length - 1} caselle da rivedere.` : ''),
      };
    }
    const k = s.c.map(v => (v === 1 ? 1 : v === 2 ? 0 : -1));
    const lines = [];
    for (let y = 0; y < h; y++) lines.push({ row: true, idx: y, cells: Z.range(w).map(x => y * w + x), clue: P.rows[y] });
    for (let x = 0; x < w; x++) lines.push({ row: false, idx: x, cells: Z.range(h).map(y => y * w + x), clue: P.cols[x] });
    const found = [];
    for (const L of lines) {
      const line = L.cells.map(i => k[i]);
      const r = solveLine(line, L.clue);
      if (!r) continue;
      const fill = [], empty = [];
      L.cells.forEach((i, t) => { if (line[t] === -1 && r[t] !== -1) (r[t] === 1 ? fill : empty).push(i); });
      if (fill.length || empty.length) found.push({ L, fill, empty, known: line.filter(x => x !== -1).length, gain: fill.length * 2 + empty.length });
    }
    if (found.length) {
      /* preferisci le linee che danno caselle piene, poi quelle con più informazioni */
      found.sort((p, q) => (q.fill.length > 0) - (p.fill.length > 0) || q.gain - p.gain);
      const f = found[Math.floor(Math.random() * Math.min(3, found.length))];
      f.fill.forEach(i => { s.c[i] = 1; });
      f.empty.forEach(i => { s.c[i] = 2; });
      const L = f.L, name = L.row ? `Riga ${L.idx + 1}` : `Colonna ${L.idx + 1}`;
      const len = L.cells.length, total = L.clue.reduce((a, b) => a + b, 0) + L.clue.length - 1;
      let why = `<b>${name}</b> (indizi ${L.clue.join(' ')}): `;
      if (f.known === 0 && f.fill.length) {
        why += `i blocchi occupano almeno ${total} caselle su ${len}, quindi restano solo ${len - total} caselle di gioco. ` +
          `Spingendo tutti i blocchi a sinistra e poi tutti a destra, alcune caselle risultano piene in entrambi i casi: sono sicuramente colorate.`;
      } else {
        why += `considerando le caselle già decise, ho provato ogni modo possibile di disporre i blocchi. `;
        if (f.fill.length && f.empty.length) why += `${f.fill.length === 1 ? 'Una casella risulta' : f.fill.length + ' caselle risultano'} sempre piene e ${f.empty.length === 1 ? 'una' : f.empty.length} sempre vuote, in ogni disposizione.`;
        else if (f.fill.length) why += `${f.fill.length === 1 ? 'Una casella risulta' : f.fill.length + ' caselle risultano'} piene in ogni disposizione: vanno colorate.`;
        else why += `${f.empty.length === 1 ? 'Una casella non viene' : f.empty.length + ' caselle non vengono'} mai raggiunte da nessun blocco: sono sicuramente vuote (le ho segnate con ✕).`;
      }
      return { state: s, focus: f.fill.concat(f.empty), why };
    }
    const miss = Z.range(N).filter(i => P.sol[i] && s.c[i] !== 1);
    if (!miss.length) return null;
    const i = Z.pick(miss);
    s.c[i] = 1;
    return { state: s, focus: [i], why: `Ecco una casella della soluzione, in ${Z.cellName(i, w)}.` };
  }

  Z.register({
    id: 'nonogram',
    name: 'Nonogramma',
    hue: 330,
    tagline: 'Numeri ai bordi, un disegno nascosto.',
    rules: `<p>I numeri accanto a ogni <b>riga</b> e sopra ogni <b>colonna</b> indicano, in ordine, le lunghezze dei gruppi di caselle piene. Tra due gruppi c'è sempre almeno una casella vuota.</p>
      <p>Usa <b>Riempi</b> per colorare e <b>Segna</b> (o il tasto destro) per mettere una ✕ dove sei sicuro che sia vuoto. Trascina per colorare più caselle.</p>
      <p>Alla fine apparirà un disegno. Ogni rompicapo si risolve con la sola logica, riga per riga.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M20 22h8v4h8v-4h8v12h-4v4h-4v4h-8v-4h-4v-4h-4z" class="ic-a"/></svg>`,
    generate,
    _test: { lineSolve },
    init: P => ({ c: new Array(P.w * P.h).fill(0) }),
    solved: (P, s) => s.c.every((v, i) => (v === 1) === (P.sol[i] === 1)),
    hint,
    view(ctx) {
      const P = ctx.puzzle, { w, h } = P;
      const rc = Math.max(...P.rows.map(r => r.length)), cc = Math.max(...P.cols.map(c => c.length));
      const kr = rc * 0.62 + 0.5, kc = cc * 0.72 + 0.4;
      let mode = 1, cur = null;
      const el = Z.h('div.nono');
      el.style.gridTemplateColumns = `${kr}fr repeat(${w}, 1fr)`;
      el.style.gridTemplateRows = `${kc}fr repeat(${h}, 1fr)`;
      el.style.setProperty('--u', `calc(100cqw / ${w + kr})`);
      el.append(Z.h('div.nono-corner'));
      const colClues = [], rowClues = [], cells = [];
      for (let x = 0; x < w; x++) {
        const d = Z.h('div.nono-cc', null, ...P.cols[x].map(v => Z.h('span', { text: v })));
        if (x % 5 === 4 && x < w - 1) d.classList.add('r5');
        colClues.push(d); el.append(d);
      }
      for (let y = 0; y < h; y++) {
        const d = Z.h('div.nono-rc', null, ...P.rows[y].map(v => Z.h('span', { text: v })));
        if (y % 5 === 4 && y < h - 1) d.classList.add('b5');
        rowClues.push(d); el.append(d);
        for (let x = 0; x < w; x++) {
          const i = y * w + x;
          const c = Z.h('div.nono-c', { 'data-i': i });
          if (x % 5 === 4 && x < w - 1) c.classList.add('r5');
          if (y % 5 === 4 && y < h - 1) c.classList.add('b5');
          if (x === w - 1) c.classList.add('last-x');
          if (y === h - 1) c.classList.add('last-y');
          c.style.setProperty('--px', x / (w - 1 || 1));
          c.style.setProperty('--py', y / (h - 1 || 1));
          cells.push(c);
          el.append(c);
        }
      }

      /* Modalità */
      const bFill = Z.h('button.chip', { type: 'button', html: Z.ICONS.fill + '<span>Riempi</span>', on: { click: () => { mode = 1; paintMode(); } } });
      const bCross = Z.h('button.chip', { type: 'button', html: Z.ICONS.cross + '<span>Segna</span>', on: { click: () => { mode = 2; paintMode(); } } });
      const paintMode = () => { bFill.classList.toggle('active', mode === 1); bCross.classList.toggle('active', mode === 2); };
      ctx.controls.append(Z.h('div.chips', null, bFill, bCross));
      paintMode();

      /* Pittura a trascinamento */
      let drag = null;
      const cellFromEvent = e => {
        const t = document.elementFromPoint(e.clientX, e.clientY);
        return t && t.classList && t.classList.contains('nono-c') && el.contains(t) ? +t.dataset.i : -1;
      };
      const apply = i => {
        if (cur.c[i] !== drag.from) return;
        const s = Z.clone(cur);
        s.c[i] = drag.to;
        ctx.preview(s);
      };
      el.addEventListener('contextmenu', e => e.preventDefault());
      el.addEventListener('pointerdown', e => {
        const i = cellFromEvent(e);
        if (i < 0 || !cur) return;
        e.preventDefault();
        const tool = e.button === 2 ? 2 : mode;
        const from = cur.c[i];
        drag = { start: i, from, to: from === tool ? 0 : tool, axis: null, id: e.pointerId };
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        ctx.begin();
        apply(i);
      });
      el.addEventListener('pointermove', e => {
        if (!drag || e.pointerId !== drag.id) return;
        let i = cellFromEvent(e);
        if (i < 0) return;
        const sx = drag.start % w, sy = (drag.start / w) | 0, x = i % w, y = (i / w) | 0;
        if (!drag.axis && i !== drag.start) drag.axis = Math.abs(x - sx) >= Math.abs(y - sy) ? 'x' : 'y';
        if (drag.axis === 'x') i = sy * w + x;
        else if (drag.axis === 'y') i = y * w + sx;
        /* riempi anche le caselle saltate dai movimenti veloci */
        const a = drag.axis === 'x' ? Math.min(sx, x) : Math.min(sy, y), b = drag.axis === 'x' ? Math.max(sx, x) : Math.max(sy, y);
        for (let k = a; k <= b; k++) apply(drag.axis === 'x' ? sy * w + k : k * w + sx);
      });
      const end = () => { if (drag) { drag = null; ctx.end(); } };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);

      return {
        el,
        aspect: (w + kr) / (h + kc),
        render(s) {
          cur = s;
          for (let i = 0; i < w * h; i++) {
            cells[i].classList.toggle('f', s.c[i] === 1);
            cells[i].classList.toggle('x', s.c[i] === 2);
          }
          for (let y = 0; y < h; y++) rowClues[y].classList.toggle('done', lineDone(s, P, true, y));
          for (let x = 0; x < w; x++) colClues[x].classList.toggle('done', lineDone(s, P, false, x));
        },
        flash(list) { (list || []).forEach(i => Z.flashEl(cells[i])); },
      };
    },
  });
})();
