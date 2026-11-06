/* Stelle (Star Battle) — regioni generate e ritoccate fino a soluzione unica */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 10, choices: [{ v: 7, label: '7×7' }, { v: 8, label: '8×8' }, { v: 9, label: '9×9' }, { v: 10, label: '10×10' }, { v: 11, label: '11×11' }] },
    { id: 'k', label: 'Stelle', def: 2, choices: [
      { v: 1, label: '1 per riga' }, { v: 2, label: '2 per riga', help: 'Due stelle per riga, colonna e regione: serve una griglia da almeno 8×8.', need: o => o.size >= 8 },
    ] },
  ];

  function rowSets(n, k) {
    const out = [];
    (function rec(start, cur) {
      if (cur.length === k) { out.push(cur.slice()); return; }
      for (let c = start; c < n; c++) {
        if (cur.length && c - cur[cur.length - 1] < 2) continue;
        cur.push(c); rec(c + 1, cur); cur.pop();
      }
    })(0, []);
    return out;
  }
  const touches = (a, b) => a.some(x => b.some(y => Math.abs(x - y) <= 1));

  function genStars(n, k, sets) {
    const colCnt = new Array(n).fill(0), rows = [];
    let steps = 0;
    const rec = r => {
      if (++steps > 200000) return false;
      if (r === n) return colCnt.every(c => c === k);
      for (const s of Z.shuffle(sets.slice())) {
        if (s.some(c => colCnt[c] >= k)) continue;
        if (r > 0 && touches(rows[r - 1], s)) continue;
        s.forEach(c => colCnt[c]++);
        const rem = n - r - 1;
        if (colCnt.every(c => k - c <= rem)) { rows[r] = s; if (rec(r + 1)) return true; }
        s.forEach(c => colCnt[c]--);
      }
      return false;
    };
    return rec(0) ? rows : null;
  }

  function nb4(n, i) {
    const x = i % n, y = (i / n) | 0, r = [];
    if (x > 0) r.push(i - 1); if (x < n - 1) r.push(i + 1); if (y > 0) r.push(i - n); if (y < n - 1) r.push(i + n);
    return r;
  }

  function genRegions(n, k, stars) {
    const N = n * n, reg = new Int16Array(N).fill(-1), isStar = new Uint8Array(N);
    stars.forEach(i => { isStar[i] = 1; });
    if (k === 1) stars.forEach((s, r) => { reg[s] = r; });
    else {
      const un = Z.shuffle(stars.slice());
      let id = 0;
      while (un.length) {
        const a = un.pop();
        un.sort((p, q) => (Math.abs(p % n - a % n) + Math.abs(((p / n) | 0) - ((a / n) | 0))) - (Math.abs(q % n - a % n) + Math.abs(((q / n) | 0) - ((a / n) | 0))));
        let joined = false;
        for (let t = 0; t < un.length && !joined; t++) {
          const b = un[t];
          /* BFS da a verso b attraverso celle libere non stella */
          const prev = new Int16Array(N).fill(-2);
          prev[a] = -1;
          const q = [a];
          while (q.length && prev[b] === -2) {
            const c = q.shift();
            for (const d of nb4(n, c)) {
              if (prev[d] !== -2 || reg[d] >= 0) continue;
              if (isStar[d] && d !== b) continue;
              prev[d] = c; q.push(d);
            }
          }
          if (prev[b] === -2) continue;
          for (let c = b; c !== -1; c = prev[c]) reg[c] = id;
          un.splice(t, 1);
          joined = true;
        }
        if (!joined) return null;
        id++;
      }
    }
    for (;;) {
      const free = [];
      for (let i = 0; i < N; i++) if (reg[i] < 0 && nb4(n, i).some(j => reg[j] >= 0)) free.push(i);
      if (!free.length) break;
      const i = Z.pick(free);
      reg[i] = reg[Z.pick(nb4(n, i).filter(j => reg[j] >= 0))];
    }
    return Array.from(reg);
  }

  /* Risolutore riga per riga con maschere di bit; restituisce fino a "limit" soluzioni (null se troppo lungo) */
  function solve(n, k, reg, limit, sets) {
    const masks = sets.map(st => st.reduce((m, c) => m | (1 << c), 0));
    const near = masks.map(m => m | (m << 1) | (m >> 1));
    const regOf = sets.map(() => null);
    const colCnt = new Int8Array(n), regCnt = new Int8Array(n), rows = [], sols = [];
    /* celle di ogni regione nelle righe da r in poi, e per regione la prima riga dopo cui non ha più celle */
    const after = Z.range(n + 1).map(() => new Int16Array(n));
    for (let r = n - 1; r >= 0; r--) {
      after[r].set(after[r + 1]);
      for (let c = 0; c < n; c++) after[r][reg[r * n + c]]++;
    }
    /* righe "minime" ancora necessarie per riempire le regioni: ogni riga ospita al massimo k stelle */
    let nodes = 0, full = 0;
    const LIMIT = 400000;
    const rec = (r, prevNear) => {
      if (sols.length >= limit || ++nodes > LIMIT) return;
      if (r === n) { sols.push(rows.slice()); return; }
      const rem = n - r - 1;
      const rowRegs = reg.slice(r * n, r * n + n);
      for (let si = 0; si < masks.length; si++) {
        const m = masks[si];
        if ((m & full) || (m & prevNear)) continue;
        const cs = sets[si];
        let ok = true;
        for (const c of cs) { const R = rowRegs[c]; if (++regCnt[R] > k) ok = false; if (++colCnt[c] === k) full |= 1 << c; }
        if (ok) {
          const af = after[r + 1];
          let need = 0;
          for (let R = 0; R < n; R++) {
            const miss = k - regCnt[R];
            if (miss > af[R]) { ok = false; break; }
            need += miss;
          }
          if (ok && need > rem * k) ok = false;
          for (let c = 0; c < n && ok; c++) if (k - colCnt[c] > rem) ok = false;
        }
        if (ok) { rows[r] = cs; rec(r + 1, near[si]); }
        for (const c of cs) { regCnt[rowRegs[c]]--; if (colCnt[c]-- === k) full &= ~(1 << c); }
        if (sols.length >= limit || nodes > LIMIT) return;
      }
    };
    rec(0, 0);
    return nodes > LIMIT ? null : sols;
  }


  function connectedWithout(n, reg, R, skip) {
    const cells = [];
    for (let i = 0; i < n * n; i++) if (reg[i] === R && i !== skip) cells.push(i);
    if (!cells.length) return false;
    const seen = new Set([cells[0]]), q = [cells[0]];
    while (q.length) {
      const c = q.pop();
      for (const d of nb4(n, c)) if (d !== skip && reg[d] === R && !seen.has(d)) { seen.add(d); q.push(d); }
    }
    return seen.size === cells.length;
  }

  function generate(opt) {
    const n = opt.size, k = n < 8 ? 1 : opt.k, sets = rowSets(n, k);
    for (let att = 0; att < 200; att++) {
      const rows = genStars(n, k, sets);
      if (!rows) continue;
      const stars = [];
      rows.forEach((s, r) => s.forEach(c => stars.push(r * n + c)));
      const reg = genRegions(n, k, stars);
      if (!reg) continue;
      const isStar = new Set(stars);
      for (let it = 0; it < 150; it++) {
        const sols = solve(n, k, reg, 2, sets);
        if (!sols) break;
        if (sols.length === 1) return { n, k, reg, sol: stars.slice().sort((a, b) => a - b) };
        const alt = sols.find(s => s.some((cs, r) => cs.join() !== rows[r].join()));
        const altStars = [];
        alt.forEach((s, r) => s.forEach(c => altStars.push(r * n + c)));
        let moved = false;
        for (const c of Z.shuffle(altStars.filter(i => !isStar.has(i)))) {
          const R1 = reg[c];
          const opts = Z.shuffle(nb4(n, c).map(j => reg[j]).filter(R => R !== R1));
          if (!opts.length || !connectedWithout(n, reg, R1, c)) continue;
          reg[c] = opts[0];
          moved = true;
          break;
        }
        if (!moved) break;
      }
    }
    return null;
  }

  const HUES = [8, 40, 75, 140, 175, 205, 240, 275, 310, 340];

  /* ---------- Suggerimento spiegato ---------- */
  const star1 = k => (k === 1 ? 'una stella' : k + ' stelle');
  function hint(P, st) {
    const n = P.n, k = P.k, N = n * n, s = Z.clone(st), sol = new Set(P.sol);
    const wrong = [];
    s.c.forEach((v, i) => { if ((v === 1 && !sol.has(i)) || (v === 2 && sol.has(i))) wrong.push(i); });
    if (wrong.length) {
      const i = Z.pick(wrong), was = s.c[i], r0 = (i / n) | 0, c0 = i % n;
      const what = was === 1 ? 'La stella' : 'Il puntino', g = was === 1 ? 'a' : 'o';
      let because = '';
      if (was === 1) {
        const near = Z.range(N).find(j => j !== i && s.c[j] === 1 && Math.abs(((j / n) | 0) - r0) <= 1 && Math.abs(j % n - c0) <= 1);
        const rowS = Z.range(n).filter(x => s.c[r0 * n + x] === 1).length, colS = Z.range(n).filter(y => s.c[y * n + c0] === 1).length;
        const regS = Z.range(N).filter(j => P.reg[j] === P.reg[i] && s.c[j] === 1).length;
        if (near != null) because = `tocca la stella in ${Z.cellName(near, n)}, e le stelle non possono toccarsi nemmeno in diagonale.`;
        else if (rowS > k) because = `la riga ${r0 + 1} avrebbe più di ${star1(k)}.`;
        else if (colS > k) because = `la colonna ${c0 + 1} avrebbe più di ${star1(k)}.`;
        else if (regS > k) because = `la sua regione avrebbe più di ${star1(k)}.`;
      }
      s.c[i] = 0;
      return {
        state: s, focus: [i], area: Z.range(n).map(x => r0 * n + x),
        tag: 'wrong',
        tip: Z.say('C\'è qualcosa da ricontrollare nella riga che si illumina.', 'Ricontrolla con calma la riga che si illumina.') +
          ` Conta le stelle di ogni riga, colonna e regione (${k === 1 ? 'ne serve una' : 'ne servono ' + k} per ciascuna) e verifica che nessuna stella ne tocchi un'altra.`,
        why: `${what} in ${Z.cellName(i, n)} ` + (because || `sembrava possibile, ma porta a un problema più avanti: alla fine una riga, una colonna o una regione resterebbe senza spazio per ${k === 1 ? 'la sua stella' : 'le sue stelle'}.`) +
          ` L'ho tolt${g}, così riparti da una base sicura.` + (wrong.length > 1 ? ` Ci sono altre ${wrong.length - 1} caselle da ricontrollare.` : ''),
      };
    }
    const units = [];
    for (let r = 0; r < n; r++) units.push({ name: `la riga ${r + 1}`, cells: Z.range(n).map(c => r * n + c) });
    for (let c = 0; c < n; c++) units.push({ name: `la colonna ${c + 1}`, cells: Z.range(n).map(r => r * n + c) });
    for (let R = 0; R < n; R++) units.push({ name: 'questa regione', cells: Z.range(N).filter(i => P.reg[i] === R) });
    const star = k === 1 ? 'una stella' : `${k} stelle`;
    for (const U of Z.shuffle(units.slice())) {
      const have = U.cells.filter(i => s.c[i] === 1).length, free = U.cells.filter(i => s.c[i] === 0);
      if (have < k && free.length && free.length === k - have) {
        free.forEach(i => { s.c[i] = 1; });
        return {
          state: s, focus: free, area: U.cells,
          tip: Z.say(`Guarda ${U.name}: quante stelle le mancano, e quanti posti liberi le restano?`, `Conta i posti liberi in ${U.name}: sono proprio quanti ne servono?`) +
            ' Quando i posti liberi sono esattamente quante le stelle che mancano, la scelta è obbligata.',
          tag: 'place', why: `In ${U.name} servono ${star} e restano solo ${free.length === 1 ? 'un posto libero' : free.length + ' posti liberi'} (le altre caselle sono già escluse): ${free.length === 1 ? 'la stella va lì' : 'le stelle vanno lì'}.`,
        };
      }
    }
    for (const i of Z.shuffle(Z.range(N).filter(i => s.c[i] === 1))) {
      const r = (i / n) | 0, c = i % n, around = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const y = r + dy, x = c + dx;
        if ((dx || dy) && x >= 0 && y >= 0 && x < n && y < n && s.c[y * n + x] === 0) around.push(y * n + x);
      }
      if (around.length) {
        around.forEach(j => { s.c[j] = 2; });
        return { state: s, focus: around, area: [i], tag: 'touch',
          tip: `Guarda la stella in ${Z.cellName(i, n)}: cosa puoi dire delle caselle che la circondano? Segnarle aiuta a vedere dove restano posti liberi.`, why: 'Le stelle non possono toccarsi, nemmeno in diagonale: tutte le caselle attorno a questa stella sono vuote. Le ho segnate con un puntino.' };
      }
    }
    for (const U of Z.shuffle(units.slice())) {
      const have = U.cells.filter(i => s.c[i] === 1).length, free = U.cells.filter(i => s.c[i] === 0);
      if (have === k && free.length) {
        free.forEach(i => { s.c[i] = 2; });
        const name = U.name[0].toUpperCase() + U.name.slice(1);
        return { state: s, focus: free, area: U.cells, tag: 'full',
          tip: `${name} ha già ${k === 1 ? 'la sua stella' : 'tutte le sue stelle'}: cosa vuol dire per le altre caselle? Segnarle con un puntino rende la griglia più chiara.`, why: `${name} ha già ${k === 1 ? 'la sua stella' : 'le sue ' + k + ' stelle'}: le altre caselle sono vuote. Le ho segnate con un puntino.` };
      }
    }
    /* 4) una stella qui toglierebbe spazio a una riga, colonna o regione */
    for (const i of Z.shuffle(Z.range(N).filter(i => s.c[i] === 0 && !sol.has(i)))) {
      const t = s.c.slice(), r = (i / n) | 0, c = i % n;
      t[i] = 1;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const y = r + dy, x = c + dx;
        if ((dx || dy) && x >= 0 && y >= 0 && x < n && y < n && t[y * n + x] === 0) t[y * n + x] = 2;
      }
      for (const U of units) {
        const have = U.cells.filter(j => t[j] === 1).length;
        if (have > k) continue;
        if (have === k && U.cells.includes(i)) continue;
        const free = U.cells.filter(j => t[j] === 0);
        /* massimo esatto di stelle non adiacenti che entrano nelle caselle libere */
        let fit = 99;
        if (free.length <= 8) {
          fit = 0;
          for (let mask = 1; mask < (1 << free.length); mask++) {
            const pick = free.filter((_, q) => mask & (1 << q));
            if (pick.length <= fit) continue;
            const okPick = pick.every((a, x) => pick.every((b2, y) => x >= y || Math.abs(((a / n) | 0) - ((b2 / n) | 0)) > 1 || Math.abs(a % n - b2 % n) > 1));
            if (okPick) fit = pick.length;
          }
        }
        if (have + fit < k) {
          s.c[i] = 2;
          return {
            state: s, focus: [i], area: [i],
            tip: `Prova a immaginare una stella in ${Z.cellName(i, n)}: le caselle attorno diventerebbero vuote. Cosa succederebbe a ${U.name}?`,
            tag: 'imagine', why: `Prova a immaginare una stella in ${Z.cellName(i, n)}: le caselle attorno diventerebbero vuote e ${U.name} non avrebbe più spazio per ${k === 1 ? 'la sua stella' : 'le sue ' + k + ' stelle'}. Quindi qui non può esserci una stella: ho messo un puntino.`,
          };
        }
      }
    }
    const miss = P.sol.filter(i => s.c[i] !== 1);
    if (!miss.length) return null;
    const i = Z.pick(miss);
    s.c[i] = 1;
    return {
      state: s, focus: [i], area: [],
      tip: 'Non ci sono mosse dirette. Un trucco: cerca gruppi di regioni che stanno tutte dentro lo stesso numero di righe (o di colonne). Quelle righe sono riservate a loro, e nelle altre caselle di quelle righe non possono esserci stelle.',
      tag: 'advanced', why: `Non ci sono mosse dirette. Un trucco avanzato: se alcune regioni stanno tutte dentro lo stesso numero di righe (o colonne), quelle righe sono "riservate" a loro e nelle altre caselle di quelle righe non possono esserci stelle. Ecco una stella della soluzione, in ${Z.cellName(i, n)}.`,
    };
  }

  Z.register({
    options: OPTIONS,
    id: 'stars',
    name: 'Stelle',
    hue: 230,
    tagline: 'Stelle che non si sfiorano mai.',
    rules: `<p>Posiziona le stelle in modo che ogni <b>riga</b>, ogni <b>colonna</b> e ogni <b>regione colorata</b> ne contenga esattamente <b>una</b> (<b>due</b> nel livello Difficile).</p>
      <p>Due stelle <b>non possono toccarsi</b>, nemmeno in diagonale.</p>
      <p>Tocca una volta per una stella, due volte per un puntino (casella vuota), tre volte per cancellare. Trascina per mettere tanti puntini.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M32 8v24H8M32 32h24" class="ic-l2"/><path d="M20 13l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" class="ic-a"/><path d="M44 37l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" class="ic-a"/></svg>`,
    generate,
    _check(P) { const s = solve(P.n, P.k, P.reg, 2, rowSets(P.n, P.k)); return s && s.length === 1 ? '' : 'NON unico'; },
    init: P => ({ c: new Array(P.n * P.n).fill(0) }),
    solved(P, s) {
      const st = [];
      s.c.forEach((v, i) => { if (v === 1) st.push(i); });
      return st.length === P.sol.length && st.every((v, i) => v === P.sol[i]);
    },
    hint,
    view(ctx) {
      const P = ctx.puzzle, n = P.n, k = P.k;
      let cur = null;
      const el = Z.h('div.stars');
      el.style.setProperty('--n', n);
      const grid = Z.h('div.st-grid');
      el.append(grid);
      const off = Z.ri(0, 9);
      const cells = Z.range(n * n).map(i => {
        const c = Z.h('div.st-cell', { 'data-i': i });
        c.style.setProperty('--rh', HUES[(P.reg[i] * 3 + off) % HUES.length]);
        c.innerHTML = '<svg viewBox="0 0 24 24" class="st-star"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg><span class="st-dot"></span>';
        grid.append(c);
        return c;
      });
      grid.append(Z.outline(n, n, P.reg));
      let down = null;
      const cellFromEvent = e => {
        const t = document.elementFromPoint(e.clientX, e.clientY);
        const c = t && t.closest && t.closest('.st-cell');
        return c && el.contains(c) ? +c.dataset.i : -1;
      };
      el.addEventListener('contextmenu', e => e.preventDefault());
      el.addEventListener('pointerdown', e => {
        const i = cellFromEvent(e);
        if (i < 0 || !cur) return;
        e.preventDefault();
        down = { i, id: e.pointerId, drag: false, right: e.button === 2 };
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        ctx.begin();
      });
      el.addEventListener('pointermove', e => {
        if (!down || e.pointerId !== down.id) return;
        const i = cellFromEvent(e);
        if (i < 0) return;
        if (!down.drag && i !== down.i) {
          down.drag = true;
          if (cur.c[down.i] === 0) { const s = Z.clone(cur); s.c[down.i] = 2; ctx.preview(s); }
        }
        if (down.drag && cur.c[i] === 0) { const s = Z.clone(cur); s.c[i] = 2; ctx.preview(s); }
      });
      el.addEventListener('pointerup', e => {
        if (!down || e.pointerId !== down.id) return;
        if (!down.drag) {
          const s = Z.clone(cur), i = down.i;
          s.c[i] = down.right ? (s.c[i] === 2 ? 0 : 2) : (s.c[i] + 1) % 3;
          ctx.preview(s);
        }
        down = null;
        ctx.end();
      });
      el.addEventListener('pointercancel', () => { if (down) { down = null; ctx.end(); } });

      function paint() {
        const bad = new Set();
        const st = [];
        cur.c.forEach((v, i) => { if (v === 1) st.push(i); });
        const rowC = {}, colC = {}, regC = {};
        for (const i of st) {
          const r = (i / n) | 0, c = i % n, R = P.reg[i];
          (rowC[r] = rowC[r] || []).push(i); (colC[c] = colC[c] || []).push(i); (regC[R] = regC[R] || []).push(i);
          for (const j of st) if (j !== i && Math.abs(((j / n) | 0) - r) <= 1 && Math.abs(j % n - c) <= 1) bad.add(i);
        }
        for (const g of [rowC, colC, regC]) for (const key in g) if (g[key].length > k) g[key].forEach(i => bad.add(i));
        cells.forEach((c, i) => {
          c.classList.toggle('star', cur.c[i] === 1);
          c.classList.toggle('dot', cur.c[i] === 2);
          c.classList.toggle('bad', bad.has(i));
        });
      }
      /* comandi con le frecce */
      const put = (i, v) => { if (!cur) return; const s = Z.clone(cur); s.c[i] = s.c[i] === v ? 0 : v; ctx.commit(s); };
      return {
        el, aspect: 1,
        render(s) { cur = s; paint(); },
        flash(list) { (list || []).forEach(i => Z.flashEl(cells[i])); },
        cursor: () => Z.gridCursor(ctx, {
          w: n, h: n, el: i => cells[i],
          tip: 'Sposta il riquadro con le frecce, poi scegli cosa mettere.',
          keys: [
            { label: 'Stella', icon: Z.ICONS.star, act: i => put(i, 1) },
            { label: 'Puntino', icon: Z.ICONS.dot, act: i => put(i, 2) },
            { label: 'Cancella', icon: Z.ICONS.erase, act: i => { if (cur && cur.c[i]) { const s = Z.clone(cur); s.c[i] = 0; ctx.commit(s); } } },
            { label: 'Puntini in fila', icon: Z.ICONS.pen, pen: true, tip: 'Muovendoti metti un puntino in ogni casella vuota. Tocca di nuovo per smettere.',
              act: i => { if (cur && cur.c[i] === 0) { const s = Z.clone(cur); s.c[i] = 2; ctx.commit(s); } } },
          ],
        }),
      };
    },
  });
})();
