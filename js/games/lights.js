/* Luci — spegni tutte le lanterne; ogni tocco cambia anche le vicine */
(function () {
  'use strict';
  const Z = window.Zen;
  const CFG = { easy: [6, 13], normal: [7, 22], hard: [8, 32] };

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

  function generate(level) {
    const [n, k] = CFG[level], N = n * n;
    for (;;) {
      const on = new Array(N).fill(0);
      for (const i of Z.shuffle(Z.range(N)).slice(0, k)) press(n, on, i);
      const lit = on.reduce((a, b) => a + b, 0);
      if (lit < N * 0.3) continue;
      const x = solve(n, on);
      if (x && x.reduce((a, b) => a + b, 0) >= k * 0.8) return { n, start: on };
    }
  }

  /* ---------- Suggerimento spiegato ---------- */
  function hint(P, st) {
    const n = P.n, x = solve(n, st.on);
    if (!x) return null;
    const list = Z.range(n * n).filter(i => x[i]);
    if (!list.length) return null;
    const s = Z.clone(st);
    const chase = list.filter(i => i >= n && st.on[i - n]);
    const i = Z.pick(chase.length ? chase : list);
    press(n, s.on, i);
    const left = list.length - 1;
    let why = "Conta solo <b>quali</b> lanterne tocchi, non l'ordine, e toccarne una due volte annulla l'effetto. ";
    why += chase.includes(i)
      ? 'Un metodo utile è "inseguire le luci": per spegnere una lanterna accesa tocca quella subito sotto, così riga dopo riga le luci scendono verso il basso. '
      : "Ho calcolato l'insieme più piccolo di tocchi che spegne tutto. ";
    why += left ? `Questa lanterna fa parte della soluzione: ne restano altre ${left} da toccare.` : "Era l'ultimo tocco!";
    return { state: s, focus: [i], why };
  }

  Z.register({
    id: 'lights',
    name: 'Luci',
    hue: 45,
    tagline: 'Spegni le lanterne, una alla volta.',
    rules: `<p>Tocca una lanterna per <b>accenderla o spegnerla</b>: insieme a lei cambiano anche le <b>quattro vicine</b> (sopra, sotto, a destra e a sinistra).</p>
      <p>L'obiettivo è <b>spegnere tutte le lanterne</b>. Toccare due volte la stessa lanterna annulla l'effetto: conta solo quali tocchi, non l'ordine.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M32 14v6" class="ic-l2"/><rect x="22" y="20" width="20" height="26" rx="9" class="ic-a"/><path d="M26 46h12v4H26z" class="ic-l2f"/></svg>`,
    generate,
    _test: { solve, press },
    init: P => ({ on: P.start.slice() }),
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
      };
    },
  });
})();
