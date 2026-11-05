/* Griglia numerica condivisa: Sudoku, Futoshiki, Calcudoku */
(function () {
  'use strict';
  const Z = window.Zen;

  Z.NumGrid = function (ctx, o) {
    const n = o.n, N = n * n, giv = o.givens;
    let sel = -1, noteMode = false, cur = null, pend = 0, pendT = 0;

    const el = Z.h('div.ng' + (o.cls ? '.' + o.cls : ''));
    el.style.setProperty('--n', n);
    el.style.setProperty('--gap', o.gap || 0);
    el.style.setProperty('--nc', n <= 4 ? 2 : n <= 9 ? 3 : 4);
    if (n >= 10) el.classList.add('wide'); /* numeri a due cifre */
    const grid = Z.h('div.ng-grid');
    el.append(grid);

    const cells = [], vals = [], notes = [];
    for (let i = 0; i < N; i++) {
      const v = Z.h('span.ng-v');
      const nt = Z.h('div.ng-notes');
      for (let d = 1; d <= n; d++) nt.append(Z.h('span', { text: d }));
      const c = Z.h('div.ng-cell', null, v, nt);
      if (giv[i]) c.classList.add('given');
      c.addEventListener('pointerdown', e => { e.preventDefault(); sel = i; paint(); });
      cells.push(c); vals.push(v); notes.push(nt);
      grid.append(c);
    }
    if (o.decorate) o.decorate(el, cells, grid);

    /* Tastierino */
    const pad = Z.h('div.numpad');
    pad.style.setProperty('--keys', n + 2);
    const digitBtns = [];
    for (let d = 1; d <= n; d++) {
      const b = Z.h('button.key', { type: 'button', text: d, 'aria-label': 'Inserisci ' + d, on: { click: () => input(d) } });
      digitBtns.push(b); pad.append(b);
    }
    const noteBtn = Z.h('button.key.tool', { type: 'button', title: 'Note a matita (N)', 'aria-label': 'Note a matita', html: Z.ICONS.pencil, on: { click: () => { noteMode = !noteMode; paint(); } } });
    const delBtn = Z.h('button.key.tool', { type: 'button', title: 'Cancella', 'aria-label': 'Cancella', html: Z.ICONS.erase, on: { click: erase } });
    pad.append(noteBtn, delBtn);
    ctx.controls.append(pad);

    function input(d) {
      if (sel < 0 || giv[sel] || !cur) return;
      const s = Z.clone(cur);
      if (noteMode) {
        if (s.v[sel]) return;
        s.m[sel] ^= 1 << d;
      } else if (s.v[sel] === d) {
        s.v[sel] = 0;
      } else {
        s.v[sel] = d; s.m[sel] = 0;
        for (const p of o.peers(sel)) s.m[p] &= ~(1 << d);
      }
      ctx.commit(s);
    }
    function erase() {
      if (sel < 0 || giv[sel] || !cur) return;
      if (!cur.v[sel] && !cur.m[sel]) return;
      const s = Z.clone(cur);
      s.v[sel] = 0; s.m[sel] = 0;
      ctx.commit(s);
    }
    function conflicts(v) {
      const bad = new Set();
      for (const U of o.units) {
        const seen = {};
        for (const i of U) if (v[i]) (seen[v[i]] = seen[v[i]] || []).push(i);
        for (const k in seen) if (seen[k].length > 1) seen[k].forEach(i => bad.add(i));
      }
      if (o.extraConflicts) o.extraConflicts(v).forEach(i => bad.add(i));
      return bad;
    }
    function paint() {
      if (!cur) return;
      const v = cur.v, bad = conflicts(v);
      const sv = sel >= 0 ? v[sel] : 0;
      const peers = new Set(sel >= 0 ? o.peers(sel) : []);
      const counts = new Array(n + 1).fill(0);
      v.forEach(x => counts[x]++);
      for (let i = 0; i < N; i++) {
        const c = cells[i];
        c.classList.toggle('sel', i === sel);
        c.classList.toggle('peer', peers.has(i));
        c.classList.toggle('same', !!sv && v[i] === sv && i !== sel);
        c.classList.toggle('bad', bad.has(i) && !giv[i]);
        vals[i].textContent = v[i] || '';
        const m = v[i] ? 0 : cur.m[i];
        const ch = notes[i].children;
        for (let d = 1; d <= n; d++) ch[d - 1].classList.toggle('on', !!(m & (1 << d)));
      }
      digitBtns.forEach((b, k) => b.classList.toggle('done', counts[k + 1] >= n));
      noteBtn.classList.toggle('active', noteMode);
      if (o.afterPaint) o.afterPaint(v, cells);
      if (sel >= 0) ctx.mark(cells[sel], true);
    }
    const moveSel = (dx, dy) => {
      if (sel < 0) sel = 0;
      else {
        const x = (sel % n + dx + n) % n, y = (((sel / n) | 0) + dy + n) % n;
        sel = y * n + x;
      }
      paint();
    };

    return {
      el, aspect: 1,
      render(s) { cur = s; paint(); },
      flash(list) {
        if (!list || !list.length) return;
        sel = list[0]; paint();
        list.forEach(i => Z.flashEl(cells[i]));
      },
      onKey(e) {
        const k = e.key;
        if (/^[0-9]$/.test(k)) {
          /* da tastiera: con griglie oltre 9 si possono digitare due cifre di fila (1 poi 0 = 10) */
          const d = +k;
          if (pend && Date.now() - pendT < 900 && pend * 10 + d <= n) { pend = 0; if (noteMode) input(1); input(10 + d); return true; }
          if (d === 0) { erase(); return true; }
          if (d <= n) { input(d); pend = n >= 10 && d === 1 ? 1 : 0; pendT = Date.now(); return true; }
          return true;
        }
        if (k === 'Backspace' || k === 'Delete') { erase(); return true; }
        if (k === 'n' || k === 'N') { noteMode = !noteMode; paint(); return true; }
        const dirs = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
        if (dirs[k]) { moveSel(dirs[k][0], dirs[k][1]); return true; }
        return false;
      },
      /* modalità «Frecce»: le frecce spostano la casella scelta, i numeri restano sotto */
      cursor: () => ({ el: Z.arrowPad({ compact: true, onDir: d => moveSel(...Z.DIRS[d]) }).el }),
    };
  };

  /* ---------- Utilità per le spiegazioni ---------- */
  Z.fmtList = arr => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' e ' + arr[arr.length - 1]);
  Z.cellName = (i, w) => `riga ${((i / w) | 0) + 1}, colonna ${i % w + 1}`;
  Z.bits = (m, n) => { const r = []; for (let d = 1; d <= n; d++) if (m & (1 << d)) r.push(d); return r; };

  /* Motore di suggerimenti per le griglie latine.
     o.levels: funzioni (v) -> { cand: maschere dei candidati per le caselle vuote, ... }, dalla più semplice alla più avanzata.
     o.naked(i, d, livello, info) e o.hidden(unità, d, i, livello, info) restituiscono la spiegazione. */
  Z.latinHint = function (P, st, o) {
    const n = o.n, N = n * n, s = Z.clone(st);
    const wrong = [];
    for (let i = 0; i < N; i++) if (s.v[i] && s.v[i] !== P.sol[i]) wrong.push(i);
    if (wrong.length) {
      const i = Z.pick(wrong), d = s.v[i];
      s.v[i] = 0; s.m[i] = 0;
      return {
        state: s, focus: [i],
        why: `Il <b>${d}</b> in ${Z.cellName(i, n)} non è corretto: seguendo le regole porterebbe, prima o poi, a una contraddizione. L'ho tolto, così riparti da una base sicura.` +
          (wrong.length > 1 ? ` Attenzione: ci sono altri ${wrong.length - 1} numeri da rivedere.` : ''),
      };
    }
    const place = (i, d) => { s.v[i] = d; s.m[i] = 0; for (const p of o.peers(i)) s.m[p] &= ~(1 << d); };
    for (let lv = 0; lv < o.levels.length; lv++) {
      const info = o.levels[lv](s.v), cand = info.cand;
      const nk = [];
      for (let i = 0; i < N; i++) {
        const m = cand[i];
        if (!s.v[i] && m && !(m & (m - 1)) && 31 - Math.clz32(m) === P.sol[i]) nk.push(i);
      }
      if (nk.length) {
        const i = Z.pick(nk), d = P.sol[i];
        const why = o.naked(i, d, lv, info);
        place(i, d);
        return { state: s, focus: [i], why };
      }
      const hs = [];
      for (const U of o.units) for (let d = 1; d <= n; d++) {
        if (U.cells.some(i => s.v[i] === d)) continue;
        const pos = U.cells.filter(i => !s.v[i] && (cand[i] & (1 << d)));
        if (pos.length === 1 && P.sol[pos[0]] === d) hs.push([U, d, pos[0]]);
      }
      if (hs.length) {
        const [U, d, i] = Z.pick(hs);
        const why = o.hidden(U, d, i, lv, info);
        place(i, d);
        return { state: s, focus: [i], why };
      }
    }
    /* Nessuna deduzione semplice: casella con meno candidati */
    const info = o.levels[o.levels.length - 1](s.v);
    let best = -1, bc = 99;
    for (let i = 0; i < N; i++) if (!s.v[i]) {
      const c = Z.popcount(info.cand[i] | (1 << P.sol[i]));
      if (c < bc) { bc = c; best = i; }
    }
    if (best < 0) return null;
    const d = P.sol[best];
    const list = Z.bits(info.cand[best] | (1 << d), n);
    place(best, d);
    return {
      state: s, focus: [best],
      why: `Qui non c'è una mossa immediata. In ${Z.cellName(best, n)} restano i candidati ${Z.fmtList(list.map(x => '<b>' + x + '</b>'))}: ` +
        `per scartare quelli sbagliati bisogna seguire una catena di conseguenze finché non si arriva a una contraddizione. Il valore giusto è <b>${d}</b>.`,
    };
  };

  /* Unità righe/colonne per griglie n×n */
  Z.lineUnits = function (n) {
    const U = [];
    for (let k = 0; k < n; k++) {
      U.push({ where: `Nella riga ${k + 1}`, kind: 'row', cells: Z.range(n).map(c => k * n + c) });
      U.push({ where: `Nella colonna ${k + 1}`, kind: 'col', cells: Z.range(n).map(r => r * n + k) });
    }
    return U;
  };
  Z.basicCand = function (v, n, peersOf) {
    const N = n * n, full = ((1 << (n + 1)) - 1) & ~1, cand = new Int32Array(N);
    for (let i = 0; i < N; i++) if (!v[i]) {
      let m = full;
      for (const p of peersOf(i)) if (v[p]) m &= ~(1 << v[p]);
      cand[i] = m;
    }
    return cand;
  };
})();
