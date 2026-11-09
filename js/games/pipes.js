/* Tubi — ruota i pezzi per portare l'acqua a ogni fiore */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 9, choices: [{ v: 9, label: '9×9' }, { v: 10, label: '10×10' }, { v: 12, label: '12×12' }, { v: 15, label: '15×15' }, { v: 20, label: '20×20' }, { v: 25, label: '25×25' }, { v: 30, label: '30×30' }, { v: 40, label: '40×40' }] },
  ];
  /* bit: 1 su, 2 destra, 4 giù, 8 sinistra */
  const D = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
  const rot = (m, r) => { r = ((r % 4) + 4) % 4; for (let k = 0; k < r; k++) m = ((m << 1) | (m >> 3)) & 15; return m; };

  /* ---------- Risolutore «umano» ----------
     Per ogni pezzo tiene i versi ancora possibili. Livello 1: bordi (un tubo non punta mai fuori) e vicini
     (se un vicino ha di sicuro un tubo verso questo pezzo, qui ne serve uno che lo incontri; se di sicuro non ce l'ha,
     qui non ci deve essere). Livello 2: la rete (un verso che chiuderebbe un anello, o un pezzo di rete staccato
     da tutto il resto, è sbagliato). Se ogni pezzo resta con un solo verso, la soluzione è anche unica.
     Restituisce per ogni pezzo il verso giusto, l'ordine in cui si capisce e il ragionamento usato.
     Con fix = true (generatore), dove il ragionamento si ferma fissa un pezzo nel verso giusto (P.fixed) e riparte. */
  function logic(P, fix) {
    const n = P.n, N = n * n, fixed = new Set(P.fixed || []);
    const dom = Z.range(N).map(i => (fixed.has(i) ? [P.sol[i]] : [...new Set([0, 1, 2, 3].map(r => rot(P.tiles[i], r)))]));
    const nb = Z.range(N).map(i => D.map(([dx, dy]) => { const x = i % n + dx, y = ((i / n) | 0) + dy; return x >= 0 && y >= 0 && x < n && y < n ? y * n + x : -1; }));
    const when = new Int32Array(N).fill(-1), how = new Array(N).fill(null);
    let tick = 0, hard = 1;
    const must = (j, o) => dom[j].every(m => m & o), never = (j, o) => dom[j].every(m => !(m & o));
    const cut = (i, keep, tag, extra) => {
      const nd = dom[i].filter(keep);
      if (nd.length === dom[i].length || !nd.length) return false;
      dom[i] = nd;
      if (nd.length === 1 && when[i] < 0) { when[i] = tick++; how[i] = Object.assign({ tag }, extra); }
      return true;
    };
    function basic() {
      let ch = false;
      for (let i = 0; i < N; i++) for (let d = 0; d < 4; d++) {
        const b = D[d][2], o = D[d][3], j = nb[i][d];
        if (j < 0) { if (cut(i, m => !(m & b), 'edge')) ch = true; continue; }
        if (must(j, o) && cut(i, m => m & b, 'near')) ch = true;
        else if (never(j, o) && cut(i, m => !(m & b), 'near')) ch = true;
      }
      return ch;
    }
    /* collegamenti sicuri (tubo da tutte e due le parti) raggruppati in pezzi di rete */
    function network() {
      const par = Z.range(N), f = a => (par[a] === a ? a : (par[a] = f(par[a])));
      for (let i = 0; i < N; i++) for (const d of [1, 2]) {
        const j = nb[i][d];
        if (j >= 0 && must(i, D[d][2]) && must(j, D[d][3])) par[f(i)] = f(j);
      }
      const size = new Int32Array(N), loose = new Int32Array(N);
      for (let i = 0; i < N; i++) { size[f(i)]++; if (dom[i].length > 1) loose[f(i)]++; }
      for (let i = 0; i < N; i++) {
        if (dom[i].length < 2) continue;
        for (const m of dom[i]) {
          const roots = [], ri = f(i);
          let open = false, cyc = false;
          for (let d = 0; d < 4; d++) {
            if (!(m & D[d][2])) continue;
            const j = nb[i][d];
            if (j < 0) continue;
            if (!must(j, D[d][3])) { open = true; continue; }
            if (must(i, D[d][2])) continue; /* già collegati */
            const r = f(j);
            if (r === ri || roots.includes(r)) cyc = true;
            roots.push(r);
          }
          let closed = false;
          if (!cyc && !open) {
            const all = [...new Set([ri, ...roots])];
            const tot = all.reduce((t, r) => t + size[r], 0), lz = all.reduce((t, r) => t + loose[r], 0) - 1;
            closed = lz === 0 && tot < N;
          }
          if ((cyc || closed) && cut(i, x => x !== m, 'flow', { cyc })) { hard = 2; return true; }
        }
      }
      return false;
    }
    for (let k = 0; k < 8 * N; k++) {
      if (basic()) continue;
      if (network()) continue;
      if (!fix) break;
      /* fermo: si fissa un pezzo ancora incerto, preferendo quelli in mezzo ad altri incerti */
      const open = Z.range(N).filter(i => dom[i].length > 1);
      if (!open.length) break;
      const score = i => nb[i].filter(j => j >= 0 && dom[j].length > 1).length + Math.random();
      const i = open.reduce((a, b) => (score(b) > score(a) ? b : a));
      dom[i] = [P.sol[i]];
      fixed.add(i);
    }
    const ok = dom.every(x => x.length === 1);
    return { ok, hard, when, how, mask: dom.map(x => x[0]), fixed: [...fixed].sort((a, b) => a - b) };
  }
  const logics = new WeakMap();
  const logicOf = P => { let r = logics.get(P); if (!r) { r = logic(P); logics.set(P, r); } return r; };

  /* Si tengono solo reti che si risolvono ragionando (bordi, vicini, niente anelli né pezzi di rete staccati):
     così la soluzione è unica e il Suggerimento ha sempre un perché. */
  function generate(opt) {
    const n = opt.size, N = n * n, t0 = Z.now();
    let last = null;
    for (;;) {
      const m = new Uint8Array(N), inT = new Uint8Array(N);
      const src = ((n / 2) | 0) * n + ((n / 2) | 0);
      inT[src] = 1;
      const fr = [];
      const addF = i => {
        const x = i % n, y = (i / n) | 0;
        for (const [dx, dy, b, o] of D) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < n && yy < n && !inT[yy * n + xx]) fr.push([i, yy * n + xx, b, o]);
        }
      };
      addF(src);
      while (fr.length) {
        const k = Math.floor(Math.random() * fr.length);
        const e = fr[k];
        fr[k] = fr[fr.length - 1]; fr.pop();
        const [i, j, b, o] = e;
        if (inT[j]) continue;
        if (Z.popcount(m[i]) >= 3 && Math.random() < 0.85 && fr.some(f => f[1] === j && f[0] !== i)) continue;
        m[i] |= b; m[j] |= o; inT[j] = 1;
        addF(j);
      }
      if (inT.some(v => !v)) continue;
      const tiles = Array.from(m).map(v => rot(v, Z.ri(0, 3)));
      const off = tiles.filter((t, i) => t !== m[i]).length;
      if (off < N * 0.6) continue;
      const P = { n, src, tiles, sol: Array.from(m) };
      const L = logic(P, true);
      if (!L.ok) continue;
      /* pochi pezzi fissati: si prova qualche rete e si tiene quella che ne chiede meno */
      if (L.fixed.length) { P.fixed = L.fixed; L.fixed.forEach(i => { P.tiles[i] = P.sol[i]; }); }
      if (!last || L.fixed.length < last.fixed.length) last = Object.assign(P, { fixed: L.fixed });
      if (!last.fixed.length || Z.now() - t0 > 300) return last;
    }
  }

  function flow(P, s) {
    const n = P.n, N = n * n, mask = i => rot(P.tiles[i], s.r[i]);
    const wet = new Uint8Array(N);
    let open = 0;
    const q = [P.src];
    wet[P.src] = 1;
    while (q.length) {
      const i = q.pop(), x = i % n, y = (i / n) | 0, mi = mask(i);
      for (const [dx, dy, b, o] of D) {
        if (!(mi & b)) continue;
        const xx = x + dx, yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= n || yy >= n) { open++; continue; }
        const j = yy * n + xx;
        if (!(mask(j) & o)) { open++; continue; }
        if (!wet[j]) { wet[j] = 1; q.push(j); }
      }
    }
    return { wet, open };
  }

  /* ---------- Suggerimento spiegato ---------- */
  function hint(P, st) {
    const n = P.n, N = n * n, s = Z.clone(st);
    const cur = i => rot(P.tiles[i], s.r[i]);
    const ok = i => cur(i) === P.sol[i];
    const valid = (i, useNb) => {
      const x = i % n, y = (i / n) | 0, out = new Set();
      for (let r = 0; r < 4; r++) {
        const m = rot(P.tiles[i], r);
        let good = true;
        for (const [dx, dy, b, o] of D) {
          const xx = x + dx, yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= n || yy >= n) { if (m & b) good = false; continue; }
          const j = yy * n + xx;
          if (useNb && ok(j) && !!(m & b) !== !!(cur(j) & o)) good = false;
        }
        if (good) out.add(m);
      }
      return [...out];
    };
    const setTo = i => { for (let k = 1; k <= 4; k++) if (rot(P.tiles[i], s.r[i] + k) === P.sol[i]) { s.r[i] += k; break; } };
    const wrongs = Z.range(N).filter(i => !ok(i));
    if (!wrongs.length) return null;
    /* il pezzo sbagliato che il ragionamento sistema per primo */
    const L = logicOf(P);
    const first = L.ok ? wrongs.filter(i => L.when[i] >= 0).sort((a, b) => L.when[a] - L.when[b])[0] : undefined;
    if (first != null) {
      const i = first, h = L.how[i];
      setTo(i);
      const x = i % n, y = (i / n) | 0, corner = (x === 0 || x === n - 1) && (y === 0 || y === n - 1);
      if (h.tag === 'edge') return { state: s, focus: [i], area: [i], tag: 'edge', tip: `Guarda il pezzo che si illumina: è ${corner ? 'in un angolo' : 'sul bordo'}. Un tubo non può guardare fuori dalla griglia: come lo giri?`, why: `Questo pezzo è ${corner ? 'in un angolo' : 'sul bordo'}. Girato in un altro modo, un tubo guarderebbe fuori dalla griglia e l’acqua scapperebbe via! C’è un modo solo per girarlo.` };
      const around = Z.range(N).filter(j => Math.abs(j % n - x) + Math.abs(((j / n) | 0) - y) === 1);
      if (h.tag === 'near') return { state: s, focus: [i], area: [i, ...around], tag: 'near', tip: Z.say('Guarda il pezzo che si illumina e i pezzi vicini. Da che parte arrivano i loro tubi?', 'I tubi devono darsi la mano: se un vicino ha un tubo che arriva qui, anche questo pezzo deve avere un tubo da quella parte.'), why: 'I tubi devono darsi la mano. Dove un pezzo vicino manda un tubo verso questo, qui ci vuole un tubo che lo incontra. Dove il vicino non lo manda, qui non ci deve essere. C’è un modo solo per girarlo così.' };
      return { state: s, focus: [i], area: [i, ...around], tag: 'flow', tip: 'L’acqua deve arrivare dappertutto, senza fare giri in tondo. Girato male, questo pezzo farebbe un giro chiuso, o lascerebbe dei tubi senza acqua?', why: h.cyc
        ? 'Girato nell’altro modo, questo pezzo farebbe un giro in tondo con dei tubi già sistemati. Ma i tubi non fanno mai giri chiusi! Resta un modo solo.'
        : 'Girato nell’altro modo, questo pezzo chiuderebbe un gruppetto di tubi tutto da solo, dove l’acqua della fontana non arriva. Resta un modo solo.' };
    }
    /* reti di prima (salvate con le versioni vecchie) che la logica non risolve */
    const f = flow(P, s);
    const nearWet = wrongs.filter(i => { const x = i % n, y = (i / n) | 0; return D.some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < n && yy < n && f.wet[yy * n + xx]; }); });
    const i = Z.pick(nearWet.length ? nearWet : wrongs);
    setTo(i);
    return { state: s, focus: [i], area: [], tag: 'flow', tip: 'Qui è difficile, con calma. Segui l’acqua dalla fontana: dove può andare il prossimo tubo senza fare giri in tondo?', why: 'Qui è difficile: non c’è una mossa facile. Ti aiuto io: girato così, questo pezzo porta l’acqua un passo più avanti.' };
  }

  Z.register({
    options: OPTIONS,
    id: 'pipes',
    name: 'Tubi',
    hue: 185,
    tagline: 'Porta l\'acqua della fontana a ogni fiore.',
    rules: Z.rules({
      goal: `Porta l'acqua della <b>fontana</b>, al centro, a tutti i <b>fiori</b> ruotando i pezzi di tubo.`,
      rules: [
        `I pezzi restano al loro posto: si possono solo <b>ruotare</b>.`,
        `Due tubi sono collegati quando le loro aperture si toccano. Alla fine tutti i pezzi devono formare <b>un'unica rete</b> collegata alla fontana.`,
        `<b>Nessun tubo resta aperto</b>: ogni apertura deve toccare un altro tubo, non il vuoto né il bordo.`,
        `I fiori sono i pezzi con una sola apertura: sono le punte della rete. La rete non forma mai anelli chiusi.`,
        `I pezzi dove arriva l'acqua si colorano e i fiori sbocciano.`,
        `Nelle griglie grandi alcuni pezzi hanno il <b>bordo colorato</b>: sono già nel verso giusto e non si girano.`,
        `C'è sempre una sola soluzione, e ci si arriva ragionando.`,
      ],
      play: [
        `Tocca un pezzo per girarlo di un quarto di giro. Con il mouse, il tasto destro lo gira all'indietro.`,
      ],
      start: `Comincia dai bordi e dagli angoli: un tubo non può mai puntare fuori dalla griglia. Un tubo dritto sul bordo può stare solo parallelo al bordo; una curva nell'angolo ha una sola posizione possibile.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M8 26h18a6 6 0 0 1 6 6v24" class="ic-pipe"/><path d="M32 8v10" class="ic-pipe ic-pipe2"/><circle cx="32" cy="22" r="6" class="ic-a"/></svg>`,
    generate,
    _logic: logic,
    init: P => ({ r: new Array(P.n * P.n).fill(0) }),
    progress(P, s) { let ok = 0; s.r.forEach((r, i) => { if (rot(P.tiles[i], r) === P.sol[i]) ok++; }); return { ok, bad: s.r.length - ok }; },
    solved(P, s) {
      const f = flow(P, s);
      return f.open === 0 && f.wet.every(v => v);
    },
    hint,
    view(ctx) {
      const P = ctx.puzzle, n = P.n;
      let cur = null;
      const svg = Z.s('svg', { class: 'pipes', viewBox: `0 0 ${n} ${n}` });
      const tiles = [], fixed = new Set(P.fixed || []);
      for (let i = 0; i < n * n; i++) {
        const x = i % n, y = (i / n) | 0, m = P.tiles[i];
        /* pezzi fissati dal generatore: già nel verso giusto, non si girano */
        const outer = Z.s('g', { transform: `translate(${x + 0.5} ${y + 0.5})`, class: 'pp-tile' + (fixed.has(i) ? ' pp-fixed' : ''), 'data-i': i }, svg);
        Z.s('rect', { x: -0.46, y: -0.46, width: 0.92, height: 0.92, rx: 0.2, class: 'pp-bg' }, outer);
        const inner = Z.s('g', { class: 'pp-rot' }, outer);
        let d = '';
        if (m & 1) d += 'M0 0V-0.5';
        if (m & 2) d += 'M0 0H0.5';
        if (m & 4) d += 'M0 0V0.5';
        if (m & 8) d += 'M0 0H-0.5';
        Z.s('path', { d, class: 'pp-pipe-o' }, inner);
        Z.s('path', { d, class: 'pp-pipe' }, inner);
        let deco = null;
        if (i === P.src) {
          Z.s('circle', { r: 0.26, class: 'pp-src' }, outer);
          Z.s('circle', { r: 0.12, class: 'pp-src-in' }, outer);
        } else if (Z.popcount(m) === 1) {
          deco = Z.s('g', { class: 'pp-bud' }, outer);
          for (let k = 0; k < 5; k++) Z.s('ellipse', { cx: 0, cy: -0.13, rx: 0.08, ry: 0.13, transform: `rotate(${k * 72})`, class: 'pp-petal' }, deco);
          Z.s('circle', { r: 0.08, class: 'pp-heart' }, deco);
        } else Z.s('circle', { r: 0.09, class: 'pp-joint' }, outer);
        tiles.push({ outer, inner, deco });
        outer.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (!cur) return;
          if (fixed.has(i)) { Z.flashEl(outer); return; }
          const s = Z.clone(cur);
          s.r[i] += e.button === 2 ? -1 : 1;
          ctx.commit(s);
        });
      }
      svg.addEventListener('contextmenu', e => e.preventDefault());
      function paint() {
        const f = flow(P, cur);
        tiles.forEach((t, i) => {
          t.inner.style.transform = `rotate(${cur.r[i] * 90}deg)`;
          t.outer.classList.toggle('wet', !!f.wet[i]);
        });
      }
      const turn = (i, k) => { if (!cur || fixed.has(i)) return; const s = Z.clone(cur); s.r[i] += k; ctx.commit(s); };
      return {
        el: svg, aspect: 1,
        render(s) { cur = s; paint(); },
        flash(list) { (list || []).forEach(i => Z.flashEl(tiles[i].outer)); },
        cursor: () => Z.gridCursor(ctx, {
          w: n, h: n, el: i => tiles[i].outer,
          tip: 'Sposta il riquadro con le frecce e gira il pezzo.',
          keys: [
            { label: 'Gira', icon: Z.ICONS.rotate, act: i => turn(i, 1) },
            { label: 'Indietro', icon: Z.ICONS.rotateBack, act: i => turn(i, -1) },
          ],
        }),
      };
    },
  });
})();
