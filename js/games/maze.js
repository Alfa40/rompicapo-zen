/* Labirinto — dall'entrata all'uscita, senza passare nei muri */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 12, choices: [{ v: 8, label: '8×8' }, { v: 12, label: '12×12' }, { v: 16, label: '16×16' }, { v: 22, label: '22×22' }, { v: 30, label: '30×30' }] },
    { id: 'kind', label: 'Strade', def: 2, choices: [
      { v: 1, label: 'Lunghe', help: 'Corridoi lunghi e pochi bivi.' },
      { v: 2, label: 'Miste', help: 'Un po\' di corridoi lunghi e un po\' di bivi.' },
      { v: 3, label: 'Tanti bivi', help: 'Tanti incroci e vicoli ciechi corti.' },
    ] },
  ];

  /* muri: R[i] = muro a destra della casella i, B[i] = muro sotto */
  const open = (P, a, b) => {
    const n = P.n;
    if (b === a + 1 && b % n) return !P.R[a];
    if (b === a - 1 && a % n) return !P.R[b];
    if (b === a + n) return !P.B[a];
    if (b === a - n) return !P.B[b];
    return false;
  };
  const nbrs = (P, a) => [a - P.n, a + 1, a + P.n, a - 1].filter(b => b >= 0 && b < P.n * P.n && open(P, a, b));

  /* labirinto perfetto (una sola strada tra due caselle): «albero che cresce» */
  function generate(opt) {
    const n = opt.size, N = n * n;
    const R = new Array(N).fill(1), B = new Array(N).fill(1);
    const seen = new Uint8Array(N);
    const act = [Z.ri(0, N - 1)];
    seen[act[0]] = 1;
    const pNew = [0, 0.95, 0.6, 0.15][opt.kind];
    while (act.length) {
      const k = Math.random() < pNew ? act.length - 1 : Z.ri(0, act.length - 1);
      const a = act[k], x = a % n, y = (a / n) | 0;
      const nb = [];
      if (x > 0 && !seen[a - 1]) nb.push(a - 1);
      if (x < n - 1 && !seen[a + 1]) nb.push(a + 1);
      if (y > 0 && !seen[a - n]) nb.push(a - n);
      if (y < n - 1 && !seen[a + n]) nb.push(a + n);
      if (!nb.length) { act.splice(k, 1); continue; }
      const b = Z.pick(nb);
      if (b === a + 1) R[a] = 0; else if (b === a - 1) R[b] = 0; else if (b === a + n) B[a] = 0; else B[b] = 0;
      seen[b] = 1;
      act.push(b);
    }
    return { n, R, B, start: 0, end: N - 1 };
  }

  /* la strada giusta dall'entrata all'uscita */
  function solve(P) {
    const prev = new Int32Array(P.n * P.n).fill(-1);
    prev[P.start] = P.start;
    const q = [P.start];
    while (q.length) {
      const a = q.shift();
      if (a === P.end) break;
      for (const b of nbrs(P, a)) if (prev[b] < 0) { prev[b] = a; q.push(b); }
    }
    const path = [P.end];
    while (path[0] !== P.start) path.unshift(prev[path[0]]);
    return path;
  }

  function hint(P, st) {
    const sol = solve(P), path = st.p;
    let k = 0;
    while (k < path.length && k < sol.length && path[k] === sol[k]) k++;
    const s = Z.clone(st);
    if (k < path.length) {
      s.p = path.slice(0, k);
      const back = path.length - k;
      return {
        state: s, focus: [sol[k - 1]], area: [], tag: 'wrong',
        tip: Z.say('Prova a seguire con gli occhi la strada che stai facendo: arriva davvero all\'uscita?', 'Fermati un momento e guarda avanti: questa strada porta all\'uscita o finisce contro un muro?'),
        why: `Questa strada più avanti finisce in un vicolo cieco, quindi non porta all'uscita. Sono tornato indietro di ${back} ${back === 1 ? 'passo' : 'passi'}, fino all'ultimo bivio giusto: da lì prova un'altra direzione.`,
      };
    }
    if (k >= sol.length) return null;
    /* si avanza fino al prossimo bivio (almeno qualche passo) */
    let j = k, forks = 0;
    while (j < sol.length && (j - k < 3 || nbrs(P, sol[j - 1]).length < 3)) {
      if (nbrs(P, sol[j]).length > 2) forks++;
      j++;
    }
    s.p = sol.slice(0, Math.min(sol.length, j));
    const left = sol.length - s.p.length;
    const why = forks || nbrs(P, sol[k - 1] ?? sol[0]).length > 2
      ? 'Al bivio la strada giusta è questa: le altre, seguendole fino in fondo, finiscono in vicoli ciechi. Un trucco: si può anche partire dall\'uscita e camminare al contrario, perché i vicoli ciechi si vedono meglio. '
      : 'Qui non ci sono scelte: il corridoio porta avanti da solo. ';
    const tip = forks || nbrs(P, sol[k - 1] ?? sol[0]).length > 2
      ? Z.say('Al prossimo bivio, prima di scegliere, segui ogni strada con gli occhi fino in fondo: quelle che finiscono contro un muro si scartano.', 'Un trucco per i bivi: guarda il labirinto partendo dall\'uscita e cammina al contrario, i vicoli ciechi si riconoscono meglio.')
      : 'Qui il corridoio non ha scelte: puoi andare avanti tranquillo fino al prossimo bivio.';
    return { state: s, focus: s.p.slice(k), area: [], tip, tag: forks || nbrs(P, sol[k - 1] ?? sol[0]).length > 2 ? 'fork' : 'corridor', why: why + (left ? `Mancano ${left} caselle all'uscita.` : 'Sei arrivato all\'uscita!') };
  }

  Z.register({
    options: OPTIONS,
    id: 'maze',
    name: 'Labirinto',
    hue: 120,
    tagline: 'Trova la strada per uscire.',
    rules: Z.rules({
      goal: `Vai dall'<b>entrata</b>, in alto a sinistra, all'<b>uscita</b>, in basso a destra.`,
      rules: [
        `Ti muovi lungo i corridoi, una casella alla volta, senza attraversare i <b>muri</b>.`,
        `La strada giusta è <b>una sola</b>: tutte le altre finiscono in vicoli ciechi.`,
      ],
      play: [
        `<b>Trascina il dito</b> lungo i corridoi per disegnare la strada.`,
        `Oppure usa le <b>freccette</b> sotto la griglia (o quelle della tastiera).`,
        `Con «Scorrere col dito» scorri in un punto qualsiasi dello schermo verso l'alto, il basso, a destra o a sinistra: il pallino va in quella direzione.`,
        `Torna indietro sulla strada per cancellarla, o tocca un punto della strada per ripartire da lì.`,
      ],
      start: `Se ti trovi in un vicolo cieco, torna indietro fino all'ultimo bivio e prova l'altra via. Può aiutare anche guardare la strada partendo dall'uscita.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M16 16h32v32H24M16 16v24M24 24h16v16H32v-8" class="ic-l2"/></svg>`,
    generate,
    _check(P) {
      /* perfetto: N-1 passaggi e tutto collegato */
      const N = P.n * P.n;
      let edges = 0;
      for (let i = 0; i < N; i++) edges += (!P.R[i] && (i + 1) % P.n ? 1 : 0) + (!P.B[i] && i + P.n < N ? 1 : 0);
      return edges === N - 1 && solve(P).length > 1 ? '' : 'labirinto non perfetto';
    },
    init: P => ({ p: [P.start] }),
    progress(P, s) { const sol = solve(P); let k = 0; while (k < s.p.length && s.p[k] === sol[k]) k++; return { ok: k, bad: s.p.length - k }; },
    solved: (P, s) => s.p[s.p.length - 1] === P.end,
    hint,
    view(ctx) {
      const P = ctx.puzzle, n = P.n;
      let cur = null, drag = null;
      const el = Z.h('div.mz');
      const svg = Z.s('svg', { viewBox: `-0.6 -0.6 ${n + 1.2} ${n + 1.2}`, class: 'mz-svg' });
      Z.s('rect', { x: 0, y: 0, width: n, height: n, rx: 0.3, class: 'mz-bg' }, svg);
      Z.s('circle', { cx: 0.5, cy: 0.5, r: 0.32, class: 'mz-start' }, svg);
      Z.s('circle', { cx: n - 0.5, cy: n - 0.5, r: 0.32, class: 'mz-end' }, svg);
      const line = Z.s('polyline', { class: 'mz-path' }, svg);
      const head = Z.s('circle', { r: 0.26, class: 'mz-head' }, svg);
      let d = '';
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const i = y * n + x;
        if (x < n - 1 && P.R[i]) d += `M${x + 1} ${y}v1`;
        if (y < n - 1 && P.B[i]) d += `M${x} ${y + 1}h1`;
      }
      /* bordo con l'apertura dell'entrata (a sinistra) e dell'uscita (a destra) */
      d += `M0 1V${n}H${n}M${n} ${n - 1}V0H0`;
      Z.s('path', { d, class: 'mz-wall', 'vector-effect': 'non-scaling-stroke' }, svg);
      const flashG = Z.s('g', null, svg);
      el.append(svg);

      const at = i => [i % n + 0.5, ((i / n) | 0) + 0.5];
      const cellAt = e => {
        const p = Z.svgPoint(svg, e);
        const x = Math.floor(p.x), y = Math.floor(p.y);
        return x < 0 || y < 0 || x >= n || y >= n ? -1 : y * n + x;
      };
      /* un passo verso la casella c: avanti se è vicina e aperta, indietro se è la precedente */
      const stepTo = (s, c) => {
        const p = s.p, last = p[p.length - 1];
        if (c === last) return false;
        if (p.length > 1 && c === p[p.length - 2]) { p.pop(); return true; }
        if (open(P, last, c) && !p.includes(c)) { p.push(c); return true; }
        return false;
      };
      /* il dito può saltare caselle se si muove in fretta: si segue la riga dritta */
      const walk = (s, c) => {
        let moved = false;
        for (let g = 0; g < 2 * n; g++) {
          const last = s.p[s.p.length - 1];
          if (last === c) break;
          const lx = last % n, ly = (last / n) | 0, cx = c % n, cy = (c / n) | 0;
          const nx = Math.abs(cx - lx) >= Math.abs(cy - ly) ? last + Math.sign(cx - lx) : last + n * Math.sign(cy - ly);
          if (!stepTo(s, nx)) break;
          moved = true;
        }
        return moved;
      };
      /* modo di comando: 'tasti' (freccette + trascinare lungo i corridoi) o 'touch' (scorrere il dito) */
      let mode = Z.store.get('maze-mode', 'tasti') === 'touch' ? 'touch' : 'tasti';
      let sw = null;
      svg.addEventListener('pointerdown', e => {
        if (!cur) return;
        e.preventDefault();
        if (mode === 'touch') return; /* in questo modo ci pensa il tocco su tutto lo schermo */
        const c = cellAt(e);
        if (c < 0) return;
        const s = Z.clone(cur);
        const k = s.p.indexOf(c);
        ctx.begin();
        if (k >= 0) s.p = s.p.slice(0, k + 1); else if (!walk(s, c)) { ctx.end(); return; }
        drag = e.pointerId;
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignorato */ }
        ctx.preview(s);
      });
      const onMove = e => {
        if (sw && sw.id === e.pointerId && cur) {
          /* scorrendo il dito: un passo ogni casella intera, nella direzione dominante */
          const cell = svg.getBoundingClientRect().width / (n + 1.2), thr = Math.max(28, cell * 1.0);
          let dx = e.clientX - sw.x, dy = e.clientY - sw.y;
          for (let g = 0; g < n && Math.max(Math.abs(dx), Math.abs(dy)) >= thr; g++) {
            const horiz = Math.abs(dx) >= Math.abs(dy);
            const last = cur.p[cur.p.length - 1], x = last % n + (horiz ? Math.sign(dx) : 0), y = ((last / n) | 0) + (horiz ? 0 : Math.sign(dy));
            if (horiz) { sw.x += Math.sign(dx) * thr; dx = e.clientX - sw.x; } else { sw.y += Math.sign(dy) * thr; dy = e.clientY - sw.y; }
            if (x < 0 || y < 0 || x >= n || y >= n) continue;
            const s = Z.clone(cur);
            if (stepTo(s, y * n + x)) ctx.preview(s);
          }
          return;
        }
        if (drag !== e.pointerId || !cur) return;
        const c = cellAt(e);
        if (c < 0) return;
        const s = Z.clone(cur);
        if (walk(s, c)) ctx.preview(s);
      };
      const up = e => {
        if (sw && sw.id === e.pointerId) { sw = null; ctx.end(); return; }
        if (drag !== e.pointerId) return;
        drag = null; ctx.end();
      };
      svg.addEventListener('pointermove', onMove);
      svg.addEventListener('pointerup', up);
      svg.addEventListener('pointercancel', up);
      /* scorrere il dito: vale su tutto lo schermo, tranne su tasti, campi di testo e finestre aperte */
      const SKIP = 'button, a, input, select, textarea, label, [role=dialog], [role=button], .sheet';
      const gDown = e => {
        if (!el.isConnected) { off(); return; }
        if (mode !== 'touch' || !cur || sw || (e.target.closest && e.target.closest(SKIP))) return;
        if (document.querySelector('[role=dialog]')) return;
        sw = { id: e.pointerId, x: e.clientX, y: e.clientY };
        ctx.begin();
      };
      const gMove = e => { if (sw && sw.id === e.pointerId) { if (e.cancelable) e.preventDefault(); onMove(e); } };
      const off = () => {
        for (const [t, f] of [['pointerdown', gDown], ['pointermove', gMove], ['pointerup', up], ['pointercancel', up]]) document.removeEventListener(t, f);
        document.documentElement.classList.remove('mz-swipe');
      };
      document.addEventListener('pointerdown', gDown);
      document.addEventListener('pointermove', gMove, { passive: false });
      document.addEventListener('pointerup', up);
      document.addEventListener('pointercancel', up);

      /* freccette: un passo nella direzione scelta (indietro sulla strada = la cancella) */
      const go = (dx, dy) => {
        if (!cur) return;
        const last = cur.p[cur.p.length - 1], x = last % n + dx, y = ((last / n) | 0) + dy;
        if (x < 0 || y < 0 || x >= n || y >= n) return;
        const s = Z.clone(cur);
        if (stepTo(s, y * n + x)) ctx.commit(s);
      };
      const DIRS = [['Up', 'Su', 0, -1, 'M12 19V6M6 12l6-6 6 6'], ['Left', 'Sinistra', -1, 0, 'M19 12H6M12 6l-6 6 6 6'],
        ['Down', 'Giù', 0, 1, 'M12 5v13M6 12l6 6 6-6'], ['Right', 'Destra', 1, 0, 'M5 12h13M12 6l6 6-6 6']];
      const pad = Z.h('div.mz-pad');
      for (const [nm, label, dx, dy, path] of DIRS) {
        pad.append(Z.h(`button.key.tool.mz-k.mz-${nm.toLowerCase()}`, { type: 'button', 'aria-label': label,
          html: `<svg viewBox="0 0 24 24"><path d="${path}"/></svg>`, on: { click: () => go(dx, dy) } }));
      }
      const sel = Z.h('div.mz-mode');
      const setMode = m => {
        mode = m; Z.store.set('maze-mode', m);
        pad.style.display = m === 'touch' ? 'none' : '';
        document.documentElement.classList.toggle('mz-swipe', m === 'touch');
        for (const b of sel.children) b.setAttribute('aria-pressed', String(b.dataset.m === m));
      };
      for (const [m, t] of [['tasti', 'Tasti'], ['touch', 'Scorrere col dito']]) {
        const b = Z.h('button.tool.mz-m', { type: 'button', on: { click: () => setMode(m) } });
        b.textContent = t; b.dataset.m = m;
        sel.append(b);
      }
      ctx.controls.append(sel, pad);
      setMode(mode);
      const onKey = e => {
        if (!el.isConnected) { document.removeEventListener('keydown', onKey); off(); return; }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const D = DIRS.find(d => e.key === 'Arrow' + d[0]);
        if (!D) return;
        e.preventDefault();
        go(D[2], D[3]);
      };
      document.addEventListener('keydown', onKey);

      return {
        el, aspect: 1,
        render(s) {
          cur = s;
          line.setAttribute('points', s.p.map(i => at(i).join(',')).join(' '));
          const [hx, hy] = at(s.p[s.p.length - 1]);
          head.setAttribute('cx', hx); head.setAttribute('cy', hy);
        },
        flash(list) {
          flashG.innerHTML = '';
          for (const i of list || []) { const [x, y] = at(i); Z.s('rect', { x: x - 0.5, y: y - 0.5, width: 1, height: 1, class: 'mz-fl' }, flashG); }
          setTimeout(() => { flashG.innerHTML = ''; }, 1500);
        },
      };
    },
  });
})();
