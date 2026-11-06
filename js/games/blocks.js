/* Porte colorate — fai uscire ogni blocco dalla porta del suo colore */
(function () {
  'use strict';
  const Z = window.Zen;
  const CFG = {
    fill: [0, 0.6, 0.7, 0.78, 0.82],
    cands: [0, 6, 14, 22, 32],
    lock: [0, 0, 0.22, 0.35, 0.45],
  };
  const PALETTE = [
    { name: 'rosso', c: 'hsl(355 72% 62%)' },
    { name: 'blu', c: 'hsl(212 72% 58%)' },
    { name: 'giallo', c: 'hsl(44 92% 56%)' },
    { name: 'verde', c: 'hsl(140 48% 48%)' },
    { name: 'viola', c: 'hsl(272 52% 64%)' },
    { name: 'arancione', c: 'hsl(24 88% 58%)' },
  ];
  const BASE = [
    [[0, 0], [1, 0]],
    [[0, 0], [1, 0], [2, 0]],
    [[0, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [0, 1], [1, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 2]],
    [[0, 0], [1, 0], [2, 0], [1, 1]],
    [[1, 0], [2, 0], [0, 1], [1, 1]],
    [[0, 0]],
  ];
  const WEIGHTS = [3, 3, 3, 2, 2, 2, 1, 0.6];
  const SIDES = ['top', 'right', 'bottom', 'left'];
  const SIDE_NAME = { top: 'in alto', right: 'a destra', bottom: 'in basso', left: 'a sinistra' };

  const normShape = cells => {
    const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
    return cells.map(([x, y]) => [x - mx, y - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  };
  const rotate = cells => normShape(cells.map(([x, y]) => [y, -x]));
  function randomShape() {
    let r = Math.random() * WEIGHTS.reduce((a, b) => a + b, 0), k = 0;
    while (r > WEIGHTS[k]) { r -= WEIGHTS[k]; k++; }
    let s = normShape(BASE[k]);
    for (let t = Z.ri(0, 3); t > 0; t--) s = rotate(s);
    return s;
  }

  /* ---------- Geometria ---------- */
  function fits(P, shape, x, y, occ, self) {
    for (const [dx, dy] of shape) {
      const cx = x + dx, cy = y + dy;
      if (cx < 0 || cy < 0 || cx >= P.W || cy >= P.H) return false;
      const o = occ[cy * P.W + cx];
      if (o >= 0 && o !== self) return false;
    }
    return true;
  }
  const lockOk = (lock, side) => !lock || (lock === 'h' ? side === 'left' || side === 'right' : side === 'top' || side === 'bottom');
  /* Il blocco in (x, y) può uscire da questa porta? (deve toccarne il lato ed esserne interamente dentro) */
  function atDoor(P, shape, x, y, door) {
    const xs = shape.map(c => c[0] + x), ys = shape.map(c => c[1] + y);
    const inSpan = v => v >= door.at && v < door.at + door.len;
    if (door.side === 'left') return Math.min(...xs) === 0 && ys.every(inSpan);
    if (door.side === 'right') return Math.max(...xs) === P.W - 1 && ys.every(inSpan);
    if (door.side === 'top') return Math.min(...ys) === 0 && xs.every(inSpan);
    return Math.max(...ys) === P.H - 1 && xs.every(inSpan);
  }
  /* Posizioni raggiungibili, con la distanza in mosse */
  function reach(P, shape, x0, y0, occ, self, lock) {
    const key = (x, y) => (y + 8) * 64 + (x + 8);
    const seen = new Map([[key(x0, y0), 0]]), q = [[x0, y0]], out = [[x0, y0, 0]];
    const dirs = lock === 'h' ? [[1, 0], [-1, 0]] : lock === 'v' ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (q.length) {
      const [x, y] = q.shift(), d = seen.get(key(x, y));
      for (const [dx, dy] of dirs) {
        const nx = x + dx, ny = y + dy, k = key(nx, ny);
        if (seen.has(k) || !fits(P, shape, nx, ny, occ, self)) continue;
        seen.set(k, d + 1); q.push([nx, ny]); out.push([nx, ny, d + 1]);
      }
    }
    return out;
  }
  function occupancy(P, pos, removed) {
    const occ = new Int8Array(P.W * P.H).fill(-1);
    P.blocks.forEach((b, i) => {
      if (removed && removed[i]) return;
      for (const [dx, dy] of b.shape) occ[(pos[i][1] + dy) * P.W + pos[i][0] + dx] = i;
    });
    return occ;
  }
  /* Percorso più corto verso una porta del suo colore, o null */
  function exitPath(P, i, pos, removed, occ) {
    const b = P.blocks[i];
    occ = occ || occupancy(P, pos, removed);
    const doors = P.doors.filter(d => d.color === b.color && lockOk(b.lock, d.side));
    if (!doors.length) return null;
    let best = null;
    for (const [x, y, d] of reach(P, b.shape, pos[i][0], pos[i][1], occ, i, b.lock)) {
      const door = doors.find(dr => atDoor(P, b.shape, x, y, dr));
      if (door && (!best || d < best.d)) best = { x, y, d, door };
    }
    return best;
  }

  /* ---------- Generazione (al contrario: i blocchi entrano dalle porte) ---------- */
  function makeDoors(W, H, nColors, per) {
    for (let t = 0; t < 200; t++) {
      const doors = [], used = { top: [], right: [], bottom: [], left: [] };
      let ok = true;
      for (let q = 0; q < nColors * per && ok; q++) {
        const c = q % nColors;
        let placed = false;
        for (let k = 0; k < 40 && !placed; k++) {
          const side = Z.pick(SIDES), span = side === 'top' || side === 'bottom' ? W : H;
          const len = Z.ri(2, 3), at = Z.ri(0, span - len);
          if (used[side].some(([a, l]) => at < a + l + 1 && a < at + len + 1)) continue;
          used[side].push([at, len]);
          doors.push({ side, at, len, color: c });
          placed = true;
        }
        if (!placed) ok = false;
      }
      if (ok) return doors;
    }
    return null;
  }

  function build(cfg) {
    const { W, H } = cfg;
    const colors = Z.shuffle(Z.range(PALETTE.length)).slice(0, cfg.colors);
    /* griglie grandi: più porte per colore, così si riempiono anche in profondità */
    const doors = makeDoors(W, H, cfg.colors, W >= 13 ? 3 : W >= 10 ? 2 : 1);
    if (!doors) return null;
    doors.forEach(d => { d.color = colors[d.color]; });
    const P = { W, H, doors, blocks: [] };
    const pos = [];
    let filled = 0;
    for (let att = 0; att < Math.max(400, W * H * 4) && filled < cfg.fill * W * H; att++) {
      const door = Z.pick(doors);
      const shape = randomShape();
      const horiz = door.side === 'left' || door.side === 'right';
      const lock = Math.random() < cfg.lock ? (horiz ? 'h' : 'v') : null;
      const occ = occupancy(P, pos);
      const self = P.blocks.length;
      /* posizioni d'ingresso: blocco allineato alla porta */
      const entries = [];
      for (let y = -3; y < H; y++) for (let x = -3; x < W; x++) {
        if (fits(P, shape, x, y, occ, self) && atDoor(P, shape, x, y, door)) entries.push([x, y]);
      }
      if (!entries.length) continue;
      const [ex, ey] = Z.pick(entries);
      const all = reach(P, shape, ex, ey, occ, self, lock);
      /* preferisci posizioni lontane dalla porta: incastri più profondi */
      all.sort((a, b) => b[2] - a[2]);
      const pickFrom = all.slice(0, Math.max(1, Math.ceil(all.length * 0.35)));
      const [fx, fy] = Z.pick(pickFrom);
      P.blocks.push({ shape, color: door.color, lock });
      pos.push([fx, fy]);
      filled += shape.length;
    }
    if (filled < cfg.fill * W * H * 0.85) return null;
    /* ogni colore presente almeno una volta */
    if (doors.some(d => !P.blocks.some(b => b.color === d.color))) return null;
    P.start = pos;
    return P;
  }

  /* Difficoltà: quante "ondate" servono togliendo ogni volta i blocchi già liberi */
  function rate(P) {
    const removed = P.blocks.map(() => false);
    let rounds = 0, freeAtStart = 0;
    for (;;) {
      const free = P.blocks.map((_, i) => i).filter(i => !removed[i] && exitPath(P, i, P.start, removed));
      if (!free.length) break;
      if (rounds === 0) freeAtStart = free.length;
      free.forEach(i => { removed[i] = true; });
      rounds++;
    }
    return { rounds, freeAtStart, stuck: removed.some(r => !r) };
  }

  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 8, choices: [{ v: 8, label: '8×8' }, { v: 9, label: '9×9' }, { v: 10, label: '10×10' }, { v: 11, label: '11×11' }, { v: 12, label: '12×12' }, { v: 13, label: '13×13' }, { v: 14, label: '14×14' }] },
    { id: 'col', label: 'Colori', def: 5, choices: [3, 4, 5, 6].map(v => ({ v, label: String(v) })) },
    { id: 'crowd', label: 'Affollamento', def: 3, choices: [
      { v: 1, label: 'Basso' }, { v: 2, label: 'Medio' }, { v: 3, label: 'Alto' }, { v: 4, label: 'Massimo' },
    ] },
    { id: 'lock', label: 'Blocchi a senso unico', def: 3, choices: [
      { v: 1, label: 'Nessuno' }, { v: 2, label: 'Pochi' }, { v: 3, label: 'Alcuni' }, { v: 4, label: 'Molti' },
    ] },
  ];

  function generate(opt) {
    const cfg = { W: opt.size, H: opt.size, colors: opt.col, fill: CFG.fill[opt.crowd], cands: CFG.cands[opt.crowd], lock: CFG.lock[opt.lock] };
    let best = null;
    const t0 = Z.now();
    for (let t = 0; (t < 400 || (!best && Z.now() - t0 < 6000)) && (!best || best.n < cfg.cands); t++) {
      if (best && Z.now() - t0 > 1200) break; /* griglie grandi: basta il migliore trovato finora */
      const P = build(cfg);
      if (!P) continue;
      const r = rate(P);
      const score = r.rounds * 3 - r.freeAtStart * 2 + (r.stuck ? 4 : 0) + Math.random();
      if (!best || score > best.score) best = { score, P, n: (best ? best.n : 0) + 1 };
      else best.n++;
    }
    return best && best.P;
  }

  /* ---------- Suggerimento spiegato ---------- */
  const colName = c => PALETTE[c].name;
  function hint(P, st) {
    const s = Z.clone(st), left = P.blocks.map((_, i) => i).filter(i => !s.removed[i]);
    if (!left.length) return null;
    /* 1) un blocco con la strada libera */
    const free = left.filter(i => exitPath(P, i, s.pos, s.removed));
    if (free.length) {
      const i = free[0], ex = exitPath(P, i, s.pos, s.removed);
      s.removed[i] = true;
      return {
        state: s, focus: [i], tag: 'free',
        why: `Il blocco <b>${colName(P.blocks[i].color)}</b> ha la strada libera fino alla porta ${colName(ex.door.color)} ${SIDE_NAME[ex.door.side]}` +
          (ex.d ? ` (bastano ${ex.d} ${ex.d === 1 ? 'passo' : 'passi'})` : '') + ': l\'ho fatto uscire. Cerca sempre prima i blocchi già liberi: ogni uscita fa spazio agli altri.',
      };
    }
    /* 2) spostare un blocco per liberarne un altro */
    for (const a of Z.shuffle(left.slice())) {
      const b = P.blocks[a];
      const occ = occupancy(P, s.pos, s.removed);
      const spots = reach(P, b.shape, s.pos[a][0], s.pos[a][1], occ, a, b.lock).filter(p => p[2] > 0);
      for (const [x, y] of spots) {
        const pos2 = s.pos.map(p => p.slice());
        pos2[a] = [x, y];
        const occ2 = occupancy(P, pos2, s.removed);
        const other = left.find(j => j !== a && exitPath(P, j, pos2, s.removed, occ2));
        if (other != null) {
          s.pos = pos2;
          return {
            state: s, focus: [a, other], tag: 'move',
            why: `Nessun blocco può uscire subito. Sposta il blocco <b>${colName(b.color)}</b> come ho fatto io: così si libera il passaggio per il blocco <b>${colName(P.blocks[other].color)}</b>, che ora può raggiungere la sua porta.`,
          };
        }
      }
    }
    /* 3) tornare alla disposizione iniziale, da cui esiste sempre un ordine di uscita */
    s.pos = P.start.map(p => p.slice());
    return {
      state: s, focus: left,
      tag: 'reset', why: 'Così i blocchi si bloccano a vicenda. Li ho rimessi dove erano all\'inizio: da quella disposizione esiste sempre un ordine in cui escono tutti. Prova a partire dal blocco che ha la strada più corta verso la sua porta.',
    };
  }

  Z.register({
    options: OPTIONS,
    id: 'blocks',
    name: 'Porte colorate',
    hue: 352,
    tagline: 'Ogni blocco ha la sua porta.',
    rules: `<p>Trascina i blocchi per farli uscire dal campo. Ogni blocco esce <b>solo dalla porta del suo colore</b>, e solo se ci passa <b>per intero</b>: la porta deve essere larga almeno quanto il blocco.</p>
      <p>I blocchi scorrono finché non toccano un muro o un altro blocco. Quelli con le <b>frecce</b> si muovono solo nella direzione indicata.</p>
      <p>Svuota il campo per completare il rompicapo. Esiste sempre un ordine giusto.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M8 24v16" stroke="hsl(212 72% 58%)" stroke-width="6" stroke-linecap="round"/><path d="M40 8h12" stroke="hsl(355 72% 62%)" stroke-width="6" stroke-linecap="round"/><rect x="16" y="20" width="14" height="22" rx="4" fill="hsl(212 72% 58%)"/><rect x="34" y="16" width="16" height="14" rx="4" fill="hsl(355 72% 62%)"/><rect x="32" y="34" width="16" height="14" rx="4" class="ic-a"/></svg>`,
    generate,
    _check(P) { return rate(P).stuck ? 'bloccato' : ''; },
    init: P => ({ pos: P.start.map(p => p.slice()), removed: P.blocks.map(() => false) }),
    solved: (P, s) => s.removed.every(Boolean),
    hint,
    view(ctx) {
      const P = ctx.puzzle, { W, H } = P, m = 0.55;
      let cur = null, drag = null;
      const svg = Z.s('svg', { class: 'blk', viewBox: `${-m} ${-m} ${W + 2 * m} ${H + 2 * m}` });
      Z.s('rect', { x: -0.22, y: -0.22, width: W + 0.44, height: H + 0.44, rx: 0.45, class: 'blk-wall' }, svg);
      Z.s('rect', { x: 0, y: 0, width: W, height: H, rx: 0.25, class: 'blk-floor' }, svg);
      const gDots = Z.s('g', { class: 'blk-dots' }, svg);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) Z.s('circle', { cx: x + 0.5, cy: y + 0.5, r: 0.05 }, gDots);
      /* porte */
      for (const d of P.doors) {
        const col = PALETTE[d.color].c;
        let r;
        if (d.side === 'left') r = { x: -0.42, y: d.at + 0.08, width: 0.34, height: d.len - 0.16 };
        if (d.side === 'right') r = { x: W + 0.08, y: d.at + 0.08, width: 0.34, height: d.len - 0.16 };
        if (d.side === 'top') r = { x: d.at + 0.08, y: -0.42, width: d.len - 0.16, height: 0.34 };
        if (d.side === 'bottom') r = { x: d.at + 0.08, y: H + 0.08, width: d.len - 0.16, height: 0.34 };
        Z.s('rect', { ...r, rx: 0.15, fill: col, class: 'blk-door' }, svg);
        const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
        const rot = { left: 180, right: 0, top: -90, bottom: 90 }[d.side];
        Z.s('path', { d: 'M-0.07 -0.1 L0.06 0 L-0.07 0.1', transform: `translate(${cx} ${cy}) rotate(${rot})`, class: 'blk-door-arrow' }, svg);
      }
      /* blocchi */
      const gBlocks = Z.s('g', null, svg);
      const groups = P.blocks.map((b, i) => {
        const g = Z.s('g', { class: 'blk-b', 'data-i': i }, gBlocks);
        const inner = Z.s('g', { class: 'blk-in' }, g);
        const col = PALETTE[b.color].c, set = new Set(b.shape.map(c => c.join(',')));
        Z.s('g', { class: 'blk-sh' }, inner);
        for (const [x, y] of b.shape) {
          Z.s('rect', { x: x + 0.06, y: y + 0.1, width: 0.88, height: 0.88, rx: 0.2, class: 'blk-shadow' }, inner);
        }
        for (const [x, y] of b.shape) {
          Z.s('rect', { x: x + 0.06, y: y + 0.06, width: 0.88, height: 0.88, rx: 0.2, fill: col }, inner);
          if (set.has(x + 1 + ',' + y)) Z.s('rect', { x: x + 0.8, y: y + 0.06, width: 0.4, height: 0.88, fill: col }, inner);
          if (set.has(x + ',' + (y + 1))) Z.s('rect', { x: x + 0.06, y: y + 0.8, width: 0.88, height: 0.4, fill: col }, inner);
        }
        for (const [x, y] of b.shape) Z.s('rect', { x: x + 0.18, y: y + 0.16, width: 0.3, height: 0.1, rx: 0.05, class: 'blk-shine' }, inner);
        if (b.lock) {
          const [x, y] = b.shape[0];
          const a = Z.s('g', { transform: `translate(${x + 0.5} ${y + 0.55}) rotate(${b.lock === 'v' ? 90 : 0})`, class: 'blk-lock' }, inner);
          Z.s('path', { d: 'M-0.26 0 H0.26 M-0.14 -0.1 L-0.26 0 L-0.14 0.1 M0.14 -0.1 L0.26 0 L0.14 0.1' }, a);
        }
        return g;
      });
      const place = (i, x, y) => { groups[i].style.transform = `translate(${x}px, ${y}px)`; };

      const pt = e => Z.svgPoint(svg, e);
      svg.addEventListener('pointerdown', e => {
        const t = e.target.closest && e.target.closest('.blk-b');
        if (!t || !cur) return;
        const i = +t.dataset.i;
        if (cur.removed[i]) return;
        e.preventDefault();
        const p = pt(e);
        drag = { i, id: e.pointerId, px: p.x, py: p.y, sx: cur.pos[i][0], sy: cur.pos[i][1] };
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        groups[i].classList.add('drag');
        ctx.begin();
      });
      svg.addEventListener('pointermove', e => {
        if (!drag || e.pointerId !== drag.id) return;
        const p = pt(e), i = drag.i, b = P.blocks[i];
        let tx = drag.sx + Math.round(p.x - drag.px), ty = drag.sy + Math.round(p.y - drag.py);
        if (b.lock === 'h') ty = drag.sy;
        if (b.lock === 'v') tx = drag.sx;
        const occ = occupancy(P, cur.pos, cur.removed);
        let [x, y] = cur.pos[i];
        for (let k = 0; k < 24 && (x !== tx || y !== ty); k++) {
          const sx = Math.sign(tx - x), sy = Math.sign(ty - y);
          const tryX = sx && fits(P, b.shape, x + sx, y, occ, i), tryY = sy && fits(P, b.shape, x, y + sy, occ, i);
          const preferX = Math.abs(tx - x) >= Math.abs(ty - y);
          if (preferX && tryX) x += sx;
          else if (tryY) y += sy;
          else if (tryX) x += sx;
          else {
            /* spinge contro un bordo: è una porta del suo colore? */
            const out = P.doors.find(d => d.color === b.color && lockOk(b.lock, d.side) && atDoor(P, b.shape, x, y, d) &&
              ((d.side === 'left' && sx < 0) || (d.side === 'right' && sx > 0) || (d.side === 'top' && sy < 0) || (d.side === 'bottom' && sy > 0)));
            if (out) { exit(i, x, y, out); return; }
            break;
          }
        }
        if (x !== cur.pos[i][0] || y !== cur.pos[i][1]) {
          const s = Z.clone(cur);
          s.pos[i] = [x, y];
          ctx.preview(s);
        }
      });
      function exit(i, x, y, door) {
        const s = Z.clone(cur);
        s.pos[i] = [x, y];
        s.removed[i] = true;
        groups[i].classList.remove('drag');
        const dx = door.side === 'left' ? -3 : door.side === 'right' ? 3 : 0, dy = door.side === 'top' ? -3 : door.side === 'bottom' ? 3 : 0;
        groups[i].classList.add('leaving');
        place(i, x + dx, y + dy);
        drag = null;
        setTimeout(() => { ctx.preview(s); ctx.end(); }, 280);
      }
      const end = () => {
        if (!drag) return;
        groups[drag.i].classList.remove('drag');
        drag = null;
        ctx.end();
      };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);

      /* modalità «Frecce»: il riquadro passa da un blocco all'altro; «Sposta» e una freccia lo fanno scorrere */
      const center = i => {
        const b = P.blocks[i], [x, y] = cur.pos[i];
        return [x + b.shape.reduce((t, c) => t + c[0], 0) / b.shape.length, y + b.shape.reduce((t, c) => t + c[1], 0) / b.shape.length];
      };
      const left = () => P.blocks.map((b, i) => i).filter(i => !cur.removed[i]);
      const nearestBlock = (i, d) => {
        const [dx, dy] = Z.DIRS[d], [x, y] = center(i);
        let best = i, bs = 1e9;
        for (const j of left()) {
          const [px, py] = center(j), a = (px - x) * dx + (py - y) * dy, b = Math.abs((px - x) * dy) + Math.abs((py - y) * dx);
          if (j === i || a <= 0.01) continue;
          if (a + 2 * b < bs) { bs = a + 2 * b; best = j; }
        }
        return best;
      };
      const closest = i => {
        if (!cur || !cur.removed[i]) return i;
        const [x, y] = center(i);
        let best = i, bd = 1e9;
        for (const j of left()) { const [px, py] = center(j), dd = Math.hypot(px - x, py - y); if (dd < bd) { bd = dd; best = j; } }
        return best;
      };
      function slide(i, d) {
        if (!cur || cur.removed[i]) return;
        const [dx, dy] = Z.DIRS[d], b = P.blocks[i];
        if ((b.lock === 'h' && dy) || (b.lock === 'v' && dx)) { Z.flashEl(groups[i].querySelector('.blk-in')); return; }
        const occ = occupancy(P, cur.pos, cur.removed);
        let [x, y] = cur.pos[i];
        while (fits(P, b.shape, x + dx, y + dy, occ, i)) { x += dx; y += dy; }
        const side = { l: 'left', r: 'right', u: 'top', d: 'bottom' }[d];
        const out = P.doors.find(o => o.side === side && o.color === b.color && lockOk(b.lock, o.side) && atDoor(P, b.shape, x, y, o));
        if (out) { ctx.begin(); exit(i, x, y, out); return; }
        if (x === cur.pos[i][0] && y === cur.pos[i][1]) { Z.flashEl(groups[i].querySelector('.blk-in')); return; }
        const s = Z.clone(cur);
        s.pos[i] = [x, y];
        ctx.commit(s);
      }
      return {
        el: svg, aspect: (W + 2 * m) / (H + 2 * m),
        cursor: () => Z.gridCursor(ctx, {
          el: i => groups[i].querySelector('.blk-in'), step: nearestBlock, fix: closest,
          tip: 'Le frecce passano da un blocco all\'altro.',
          keys: [{ label: 'Sposta', icon: Z.ICONS.move, dir: true, tip: 'Scegli con una freccia dove far scorrere il blocco.', act: slide }],
        }),
        render(s) {
          cur = s;
          groups.forEach((g, i) => {
            if (s.removed[i]) { if (!g.classList.contains('leaving')) g.classList.add('gone'); return; }
            g.classList.remove('gone', 'leaving');
            place(i, s.pos[i][0], s.pos[i][1]);
          });
        },
        flash(list) { (list || []).forEach(i => Z.flashEl(groups[i] && groups[i].querySelector('.blk-in'))); },
      };
    },
  });
})();
