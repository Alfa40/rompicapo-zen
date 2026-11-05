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

  function generate(opt) {
    const n = opt.size, N = n * n;
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
      return { n, src, tiles, sol: Array.from(m) };
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
    for (const i of Z.shuffle(wrongs.slice())) {
      const v = valid(i, false);
      if (v.length === 1 && v[0] === P.sol[i]) {
        setTo(i);
        const x = i % n, y = (i / n) | 0, corner = (x === 0 || x === n - 1) && (y === 0 || y === n - 1);
        return { state: s, focus: [i], why: `Questo pezzo è ${corner ? 'in un angolo' : 'sul bordo'}: in qualsiasi altra rotazione un tubo punterebbe fuori dalla griglia e l'acqua uscirebbe. C'è un solo verso possibile.` };
      }
    }
    for (const i of Z.shuffle(wrongs.slice())) {
      const v = valid(i, true);
      if (v.length === 1 && v[0] === P.sol[i]) {
        setTo(i);
        return { state: s, focus: [i], why: "Guarda i bordi e i pezzi vicini già sistemati: dove un vicino ha un tubo rivolto verso questo pezzo, qui serve un tubo che lo incontri; dove non ce l'ha, qui non ci deve essere. Una sola rotazione rispetta tutto." };
      }
    }
    const f = flow(P, s);
    const nearWet = wrongs.filter(i => { const x = i % n, y = (i / n) | 0; return D.some(([dx, dy]) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < n && yy < n && f.wet[yy * n + xx]; }); });
    const i = Z.pick(nearWet.length ? nearWet : wrongs);
    setTo(i);
    return { state: s, focus: [i], why: "Non c'è un pezzo obbligato dai soli vicini. Ricorda: la rete non può avere anelli chiusi e ogni bocciolo è la fine di un ramo. Questa rotazione porta l'acqua un passo più avanti senza chiudere anelli." };
  }

  Z.register({
    options: OPTIONS,
    id: 'pipes',
    name: 'Tubi',
    hue: 185,
    tagline: 'Porta l\'acqua della fontana a ogni fiore.',
    rules: `<p>Tocca i pezzi per <b>ruotarli</b> (tasto destro per ruotare all'indietro).</p>
      <p>Collega tutti i tubi alla <b>fontana</b> centrale in un'unica rete, in modo che l'acqua raggiunga ogni bocciolo e <b>nessun tubo resti aperto</b>.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M8 26h18a6 6 0 0 1 6 6v24" class="ic-pipe"/><path d="M32 8v10" class="ic-pipe ic-pipe2"/><circle cx="32" cy="22" r="6" class="ic-a"/></svg>`,
    generate,
    init: P => ({ r: new Array(P.n * P.n).fill(0) }),
    solved(P, s) {
      const f = flow(P, s);
      return f.open === 0 && f.wet.every(v => v);
    },
    hint,
    view(ctx) {
      const P = ctx.puzzle, n = P.n;
      let cur = null;
      const svg = Z.s('svg', { class: 'pipes', viewBox: `0 0 ${n} ${n}` });
      const tiles = [];
      for (let i = 0; i < n * n; i++) {
        const x = i % n, y = (i / n) | 0, m = P.tiles[i];
        const outer = Z.s('g', { transform: `translate(${x + 0.5} ${y + 0.5})`, class: 'pp-tile', 'data-i': i }, svg);
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
      const turn = (i, k) => { if (!cur) return; const s = Z.clone(cur); s.r[i] += k; ctx.commit(s); };
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
