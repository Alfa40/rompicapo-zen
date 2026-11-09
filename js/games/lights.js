/* Luci — spegni tutte le lanterne; ogni tocco cambia anche le vicine */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 7, choices: [{ v: 7, label: '7×7' }, { v: 8, label: '8×8' }, { v: 9, label: '9×9' }, { v: 10, label: '10×10' }, { v: 12, label: '12×12' }, { v: 15, label: '15×15' }, { v: 20, label: '20×20' }] },
    { id: 'mv', label: 'Mosse necessarie', def: 2, choices: [
      { v: 1, label: 'Poche' }, { v: 2, label: 'Normali' }, { v: 3, label: 'Tante' },
    ] },
  ];

  function press(n, on, i) {
    const x = i % n, y = (i / n) | 0;
    on[i] ^= 1;
    if (x > 0) on[i - 1] ^= 1;
    if (x < n - 1) on[i + 1] ^= 1;
    if (y > 0) on[i - n] ^= 1;
    if (y < n - 1) on[i + n] ^= 1;
  }

  /* Risolve A·x = on su GF(2), restituisce l'insieme di tocchi più corto */
  function solve(n, on) {
    const N = n * n;
    const M = Z.range(N).map(i => {
      const row = new Uint8Array(N + 1);
      const x = i % n, y = (i / n) | 0;
      row[i] = 1;
      if (x > 0) row[i - 1] = 1; if (x < n - 1) row[i + 1] = 1;
      if (y > 0) row[i - n] = 1; if (y < n - 1) row[i + n] = 1;
      row[N] = on[i];
      return row;
    });
    const piv = [];
    let r = 0;
    for (let c = 0; c < N && r < N; c++) {
      let p = -1;
      for (let k = r; k < N; k++) if (M[k][c]) { p = k; break; }
      if (p < 0) continue;
      [M[r], M[p]] = [M[p], M[r]];
      for (let k = 0; k < N; k++) if (k !== r && M[k][c]) for (let j = c; j <= N; j++) M[k][j] ^= M[r][j];
      piv.push(c); r++;
    }
    for (let k = r; k < N; k++) if (M[k][N]) return null;
    const isPiv = new Uint8Array(N);
    piv.forEach(c => { isPiv[c] = 1; });
    const free = Z.range(N).filter(c => !isPiv[c]);
    let best = null;
    const combos = Math.min(1 << free.length, 1 << 12);
    for (let mask = 0; mask < combos; mask++) {
      const x = new Uint8Array(N);
      free.forEach((c, k) => { x[c] = (mask >> k) & 1; });
      for (let k = 0; k < r; k++) {
        const c = piv[k];
        let v = M[k][N];
        for (const f of free) if (M[k][f] && x[f]) v ^= 1;
        x[c] = v;
      }
      const w = x.reduce((a, b) => a + b, 0);
      if (!best || w < best.w) best = { x, w };
    }
    return best.x;
  }

  /* Si tocca a caso solo dalla seconda riga in giù: così «inseguire le luci» dall'alto risolve sempre tutto,
     senza calcoli. Ogni passo ha un perché: le righe sopra sono già spente, e l'unico modo di spegnere una
     lanterna senza riaccenderle è toccare quella subito sotto. */
  function generate(opt) {
    const n = opt.size, N = n * n, k = Math.max(3, Math.round(N * [0.45, 0.25, 0.45, 0.55][opt.mv]));
    for (;;) {
      const on = new Array(N).fill(0);
      for (const i of Z.shuffle(Z.range(N - n)).slice(0, k)) press(n, on, i + n);
      if (on.reduce((a, b) => a + b, 0) >= N * 0.3 && on.slice(0, n).some(Boolean)) return { n, start: on };
    }
  }

  /* ---------- Suggerimento spiegato ---------- */
  function hint(P, st) {
    const n = P.n, N = n * n, s = Z.clone(st);
    if (st.on.every(v => !v)) return null;
    /* la prima riga con una lanterna accesa (tranne l'ultima): si tocca quella subito sotto */
    for (let r = 0; r < n - 1; r++) {
      const lit = Z.range(n).map(c => r * n + c).filter(i => st.on[i]);
      if (!lit.length) continue;
      const j = lit[0], i = j + n;
      press(n, s.on, i);
      const above = r ? (r === 1 ? 'La riga sopra è già tutta spenta' : `Le ${r} righe sopra sono già tutte spente`) : '';
      return {
        state: s, focus: [i], area: [j], tag: 'chase',
        tip: Z.say('Guarda la lanterna accesa che si illumina. Il trucco: tocca la lanterna proprio sotto di lei!',
          'Spegniamo le luci dall’alto verso il basso. Per ogni lanterna accesa, tocca quella subito sotto. Comincia da quella che si illumina.'),
        why: `La lanterna in ${Z.cellName(j, n)} è accesa. ${above ? above + ': non vogliamo riaccenderla. ' : ''}` +
          `Tocco la lanterna subito sotto: quella di sopra si spegne, e le righe più in alto non cambiano. Così le luci scendono giù, giù, fino a sparire!`,
      };
    }
    /* restano accese solo lanterne dell'ultima riga (succede se si sono toccate lanterne della prima riga):
       si sistema la prima riga, poi si insegue di nuovo */
    const x = solve(n, st.on);
    if (!x) return null;
    const top = Z.range(n).filter(i => x[i]), list = Z.range(N).filter(i => x[i]);
    const i = top.length ? top[0] : list[0];
    press(n, s.on, i);
    return {
      state: s, focus: [i], area: Z.range(N - n, N), tag: 'calc',
      tip: 'Sono rimaste accese delle luci in fondo. Per spegnerle si riparte dall’alto: tocca una lanterna della prima riga, poi spegni di nuovo le luci scendendo verso il basso.',
      why: 'Sono rimaste accese delle luci in fondo. Tocco questa lanterna in alto: poi, spegnendo di nuovo le luci dall’alto verso il basso, alla fine si spengono tutte.',
    };
  }

  Z.register({
    options: OPTIONS,
    id: 'lights',
    name: 'Luci',
    hue: 45,
    tagline: 'Spegni le lanterne, una alla volta.',
    rules: Z.rules({
      goal: `<b>Spegni tutte le lanterne</b> della griglia.`,
      rules: [
        `Quando tocchi una lanterna, lei <b>cambia</b>: se è accesa si spegne, se è spenta si accende.`,
        `Insieme a lei cambiano anche le <b>quattro vicine</b>: sopra, sotto, a destra e a sinistra (non in diagonale). Sui bordi le vicine sono meno.`,
      ],
      play: [
        `Tocca una lanterna, accesa o spenta.`,
        `Toccare due volte la stessa lanterna è come non toccarla. L'<b>ordine</b> dei tocchi non conta: conta solo quali lanterne tocchi.`,
      ],
      start: `Usa il metodo «riga per riga»: per ogni lanterna accesa nella prima riga, tocca quella subito sotto. La prima riga si spegne. Fai lo stesso per la seconda riga, poi per la terza, fino in fondo. Funziona sempre: ogni griglia è fatta perché questo metodo la spenga tutta.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M32 14v6" class="ic-l2"/><rect x="22" y="20" width="20" height="26" rx="9" class="ic-a"/><path d="M26 46h12v4H26z" class="ic-l2f"/></svg>`,
    generate,
    _test: { solve, press },
    init: P => ({ on: P.start.slice() }),
    progress(P, s) { const x = solve(P.n, s.on); return { ok: x ? -x.reduce((a, b) => a + b, 0) : 0, bad: 0 }; },
    solved: (P, s) => s.on.every(v => !v),
    hint,
    view(ctx) {
      const P = ctx.puzzle, n = P.n;
      let cur = null;
      const el = Z.h('div.lights');
      el.style.setProperty('--n', n);
      const cells = Z.range(n * n).map(i => {
        const b = Z.h('button.lamp', { type: 'button', 'aria-label': 'Lanterna ' + (i + 1) });
        b.innerHTML = '<span class="lamp-top"></span><span class="lamp-body"><span class="lamp-glow"></span></span>';
        b.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (!cur) return;
          const s = Z.clone(cur);
          press(n, s.on, i);
          ctx.commit(s);
        });
        el.append(b);
        return b;
      });
      return {
        el, aspect: 1,
        render(s) { cur = s; cells.forEach((c, i) => c.classList.toggle('on', !!s.on[i])); },
        flash(list) { (list || []).forEach(i => Z.flashEl(cells[i])); },
        cursor: () => Z.gridCursor(ctx, {
          w: n, h: n, el: i => cells[i],
          tip: 'Sposta il riquadro con le frecce e tocca la lanterna.',
          keys: [{ label: 'Tocca la lanterna', icon: Z.ICONS.tap, act: i => { if (!cur) return; const s = Z.clone(cur); press(n, s.on, i); ctx.commit(s); } }],
        }),
      };
    },
  });
})();
