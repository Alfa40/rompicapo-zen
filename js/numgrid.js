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

  /* ---------- Risolutore «umano» per le griglie latine (Sudoku, Futoshiki, Calcudoku) ----------
     Usa solo ragionamenti che una persona può fare, dal più semplice, e non tira mai a indovinare.
     Se risolve tutta la griglia, la soluzione è anche unica. Serve ai generatori (si tengono solo i rompicapo
     risolvibili così, al livello scelto) e al Suggerimento (spiega proprio il ragionamento che serve).
     cfg: { n, units: [{ where, kind: 'row'|'col'|'box', cells }], peers: [[...]], rules: [{ id, lv, fam, run(S) }] }
     Livelli: 1 posti e numeri unici (+ regole base del gioco); 2 candidati bloccati e coppie;
     3 terne, X-wing e Y-wing; 4 swordfish, XYZ-wing e quartine. */
  const lc = s => s.charAt(0).toLowerCase() + s.slice(1);
  const uname = U => U.where.replace(/^Nella /, 'la ').replace(/^Nel /, 'il ');
  const udi = U => U.where.replace(/^Nella /, 'della ').replace(/^Nel /, 'del ');
  /* articolo giusto davanti a un numero: l'1, l'8, l'11, il 5 */
  Z.il = d => ([1, 8, 11].includes(+d) ? 'l’' : 'il ') + '<b>' + d + '</b>';
  Z.latinSolver = function (cfg) {
    const n = cfg.n, N = n * n, units = cfg.units, peers = cfg.peers, FULL = ((1 << (n + 1)) - 1) & ~1;
    const sees = new Uint8Array(N * N);
    peers.forEach((ps, i) => { for (const p of ps) sees[i * N + p] = 1; });
    const cn = i => Z.cellName(i, n);
    const R = i => ((i / n) | 0) + 1, C = i => (i % n) + 1;
    /* elenco di caselle leggibile: «le caselle della riga 7 nelle colonne 3 e 9» */
    const cells = a => {
      if (a.length === 1) return 'la casella in ' + cn(a[0]);
      if (a.every(i => R(i) === R(a[0]))) return `le caselle della riga ${R(a[0])} nelle colonne ${Z.fmtList(a.map(C).sort((x, y) => x - y))}`;
      if (a.every(i => C(i) === C(a[0]))) return `le caselle della colonna ${C(a[0])} nelle righe ${Z.fmtList(a.map(R).sort((x, y) => x - y))}`;
      return 'le caselle ' + Z.fmtList(a.map(i => '(' + cn(i) + ')'));
    };
    /* caselle di una zona, nominate dentro quella zona: «le caselle delle colonne 3 e 9» */
    const cellsIn = (U, a) => (U.kind === 'row' ? `le caselle delle colonne ${Z.fmtList(a.map(C).sort((x, y) => x - y))}`
      : U.kind === 'col' ? `le caselle delle righe ${Z.fmtList(a.map(R).sort((x, y) => x - y))}` : 'le caselle ' + Z.fmtList(a.map(i => '(' + cn(i) + ')')));
    const nums = m => Z.fmtList(Z.bits(m, n).map(d => '<b>' + d + '</b>'));
    const alt = m => Z.bits(m, n).map(d => '<b>' + d + '</b>').join(' o ');
    const bit = d => 1 << d;
    /* coppie di zone che si incrociano in più caselle (riquadro e riga/colonna del Sudoku) */
    const inter = [];
    for (let a = 0; a < units.length; a++) for (let b = 0; b < units.length; b++) {
      if (a === b) continue;
      const B = new Set(units[b].cells), common = units[a].cells.filter(i => B.has(i));
      if (common.length >= 2) inter.push([units[a], units[b], new Set(common)]);
    }
    const rows = units.filter(U => U.kind === 'row'), cols = units.filter(U => U.kind === 'col');
    function combos(arr, k, cb, from = 0, cur = []) {
      if (cur.length === k) return cb(cur);
      for (let x = from; x <= arr.length - (k - cur.length); x++) {
        cur.push(arr[x]);
        if (combos(arr, k, cb, x + 1, cur)) return true;
        cur.pop();
      }
      return false;
    }

    /* coppie, terne e quartine «nude» (k caselle con k numeri in tutto) e «nascoste» (k numeri in k caselle) */
    const subsets = k => S => {
      const W = k === 2 ? 'due' : k === 3 ? 'tre' : 'quattro';
      for (const U of units) {
        const free = U.cells.filter(i => !S.v[i]);
        if (free.length <= k) continue;
        const small = free.filter(i => Z.popcount(S.cand[i]) <= k);
        if (combos(small, k, set => {
          let m = 0;
          for (const i of set) m |= S.cand[i];
          if (Z.popcount(m) !== k) return false;
          const others = free.filter(i => !set.includes(i) && (S.cand[i] & m));
          if (!others.length) return false;
          const txt = `${U.where} ${cellsIn(U, set)} possono contenere solo ${nums(m)}: quei ${W} numeri vanno lì, quindi non possono stare nelle altre caselle ${udi(U)}.`;
          for (const i of others) S.elim(i, m, txt, set);
          return true;
        })) return true;
        const miss = [];
        for (let d = 1; d <= n; d++) if (!U.cells.some(i => S.v[i] === d)) miss.push(d);
        const pos = {};
        for (const d of miss) pos[d] = free.filter(i => S.cand[i] & bit(d));
        const few = miss.filter(d => pos[d].length >= 2 && pos[d].length <= k);
        if (combos(few, k, ds => {
          const at = [...new Set(ds.flatMap(d => pos[d]))];
          if (at.length !== k) return false;
          const keep = ds.reduce((m, d) => m | bit(d), 0);
          if (!at.some(i => S.cand[i] & ~keep)) return false;
          const txt = `${U.where} i numeri ${nums(keep)} possono stare solo in ${cellsIn(U, at)}: quelle ${W} caselle sono riservate a loro e non possono avere altri numeri.`;
          for (const i of at) S.elim(i, S.cand[i] & ~keep, txt, at);
          return true;
        })) return true;
      }
      return false;
    };
    /* candidati bloccati: in una zona un numero può stare solo dove incrocia un'altra zona */
    const locked = S => {
      for (const [A, B, common] of inter) for (let d = 1; d <= n; d++) {
        if (A.cells.some(i => S.v[i] === d)) continue;
        const at = A.cells.filter(i => !S.v[i] && (S.cand[i] & bit(d)));
        if (at.length < 2 || !at.every(i => common.has(i))) continue;
        const out = B.cells.filter(i => !common.has(i) && !S.v[i] && (S.cand[i] & bit(d)));
        if (!out.length) continue;
        const txt = `${A.where} ${Z.il(d)} può stare solo dove incrocia ${uname(B)}: di sicuro sarà lì, quindi ${lc(B.where)} ${Z.il(d)} non può stare altrove.`;
        for (const i of out) S.elim(i, bit(d), txt, at);
        return true;
      }
      return false;
    };
    /* X-wing (k = 2) e swordfish (k = 3): un numero che in k righe sta solo in k colonne */
    const fish = k => S => {
      for (const [base, cover, bn, cvn] of [[rows, cols, 'righe', 'colonne'], [cols, rows, 'colonne', 'righe']]) {
        if (!base.length) continue;
        for (let d = 1; d <= n; d++) {
          const lines = [];
          base.forEach((L, li) => {
            if (L.cells.some(i => S.v[i] === d)) return;
            const p = [];
            L.cells.forEach((i, x) => { if (!S.v[i] && (S.cand[i] & bit(d))) p.push(x); });
            if (p.length >= 2 && p.length <= k) lines.push({ li, p });
          });
          if (combos(lines, k, set => {
            const xs = [...new Set(set.flatMap(s => s.p))];
            if (xs.length !== k) return false;
            const own = new Set(set.flatMap(s => s.p.map(x => base[s.li].cells[x])));
            const out = [];
            for (const x of xs) for (const i of cover[x].cells) if (!own.has(i) && !S.v[i] && (S.cand[i] & bit(d))) out.push(i);
            if (!out.length) return false;
            const ln = Z.fmtList(set.map(s => s.li + 1)), cl = Z.fmtList(xs.sort((a, b) => a - b).map(x => x + 1));
            const txt = `Nelle ${bn} ${ln} ${Z.il(d)} può stare solo nelle ${cvn} ${cl}: ognuna di queste ${bn} ne mette uno lì, e così ${k === 2 ? 'le due' : 'le tre'} ${cvn} hanno già il loro. Nelle altre caselle di quelle ${cvn} ${Z.il(d)} non può stare.`;
            for (const i of out) S.elim(i, bit(d), txt, [...own]);
            return true;
          })) return true;
        }
      }
      return false;
    };
    /* Y-wing: perno con due candidati e due «pinze» che lo vedono; XYZ-wing: perno con tre candidati */
    const wing = three => S => {
      for (let p = 0; p < N; p++) {
        if (S.v[p]) continue;
        const pm = S.cand[p], pc = Z.popcount(pm);
        if (pc !== (three ? 3 : 2)) continue;
        const pin = peers[p].filter(i => !S.v[i] && Z.popcount(S.cand[i]) === 2 && (three ? (S.cand[i] & pm) === S.cand[i] : Z.popcount(S.cand[i] & pm) === 1));
        for (let a = 0; a < pin.length; a++) for (let b = a + 1; b < pin.length; b++) {
          const X = pin[a], Y = pin[b], mx = S.cand[X], my = S.cand[Y];
          if (mx === my) continue;
          const c = mx & my;
          if (Z.popcount(c) !== 1) continue;
          if (!three && ((mx | my) & ~c & ~pm || (c & pm) || ((mx | my) & pm) !== pm)) continue;
          if (three && !(c & pm)) continue;
          const d = 31 - Math.clz32(c);
          const out = [];
          for (let i = 0; i < N; i++) {
            if (i === p || i === X || i === Y || S.v[i] || !(S.cand[i] & c)) continue;
            if (sees[i * N + X] && sees[i * N + Y] && (!three || sees[i * N + p])) out.push(i);
          }
          if (!out.length) continue;
          const txt = three
            ? `La casella in ${cn(p)} può avere solo ${alt(pm)}; due caselle che la vedono, in ${cn(X)} e in ${cn(Y)}, solo ${alt(mx)} e solo ${alt(my)}. Comunque vada, una di queste tre avrà ${Z.il(d)}: le caselle che le vedono tutte e tre non possono averlo.`
            : `La casella in ${cn(p)} può avere solo ${alt(pm)}. Qualunque dei due sia, una tra la casella in ${cn(X)} (${alt(mx)}) e quella in ${cn(Y)} (${alt(my)}) dovrà avere ${Z.il(d)}: le caselle che le vedono entrambe non possono averlo.`;
          for (const i of out) S.elim(i, c, txt, [p, X, Y]);
          return true;
        }
      }
      return false;
    };
    const TECH = [
      ...(cfg.rules || []),
      ...(inter.length ? [{ id: 'locked', lv: 2, fam: 'locked', run: locked }] : []),
      { id: 'pair', lv: 2, fam: 'pair', run: subsets(2) },
      { id: 'triple', lv: 3, fam: 'pair', run: subsets(3) },
      { id: 'xwing', lv: 3, fam: 'wing', run: fish(2) },
      { id: 'ywing', lv: 3, fam: 'wing', run: wing(false) },
      { id: 'sword', lv: 4, fam: 'wing', run: fish(3) },
      { id: 'xyz', lv: 4, fam: 'wing', run: wing(true) },
      { id: 'quad', lv: 4, fam: 'pair', run: subsets(4) },
    ].sort((a, b) => a.lv - b.lv);

    function state(v0) {
      const v = Array.from(v0, x => x || 0), cand = new Int32Array(N);
      let left = 0;
      for (let i = 0; i < N; i++) if (!v[i]) {
        let m = FULL;
        for (const p of peers[i]) if (v[p]) m &= ~bit(v[p]);
        cand[i] = m; left++;
      }
      const S = {
        n, N, v, cand, left, log: [], tech: null,
        elim(i, m, txt, src) {
          const r = S.cand[i] & m;
          if (!r) return false;
          S.cand[i] &= ~m;
          S.log.push({ i, m: r, txt, src: src || [], t: S.tech });
          return true;
        },
        place(i, d) {
          S.v[i] = d; S.cand[i] = 0; S.left--;
          for (const p of peers[i]) S.cand[p] &= ~bit(d);
        },
        mask: i => (S.v[i] ? bit(S.v[i]) : S.cand[i]),
      };
      return S;
    }
    /* il prossimo numero sicuro: casella con un solo candidato o numero con un solo posto in una zona */
    function single(S) {
      for (let i = 0; i < N; i++) if (!S.v[i]) {
        const m = S.cand[i];
        if (!m) return { bad: true };
        if (!(m & (m - 1))) return { i, d: 31 - Math.clz32(m), kind: 'naked' };
      }
      for (const U of units) for (let d = 1; d <= n; d++) {
        let at = -1, k = 0, done = false;
        for (const i of U.cells) { if (S.v[i] === d) { done = true; break; } if (!S.v[i] && (S.cand[i] & bit(d))) { k++; at = i; } }
        if (done) continue;
        if (!k) return { bad: true };
        if (k === 1) return { i: at, d, kind: 'hidden', U };
      }
      return null;
    }
    function step(S, maxLv) {
      for (const T of TECH) {
        if (T.lv > maxLv) break;
        S.tech = T;
        if (T.run(S)) return T;
      }
      return null;
    }
    return {
      TECH,
      /* risolve da capo: { ok, hard (livello più alto usato), used: { tecnica: volte } } */
      solve(v0, maxLv = 4) {
        const S = state(v0), used = {};
        let hard = 1;
        for (;;) {
          if (!S.left) return { ok: true, hard, used };
          const s = single(S);
          if (s && s.bad) return { ok: false, bad: true, hard, used };
          if (s) { S.place(s.i, s.d); continue; }
          const T = step(S, maxLv);
          if (!T) return { ok: false, hard, used, left: S.left };
          used[T.id] = (used[T.id] || 0) + 1;
          if (T.lv > hard) hard = T.lv;
        }
      },
      /* prossimo passo per il Suggerimento, con i ragionamenti che servono davvero per quella casella */
      next(v0, maxLv = 4) {
        const S = state(v0);
        for (let k = 0; k < 400; k++) {
          const s = single(S);
          if (s && s.bad) return null;
          if (s) {
            const rel = S.log.filter(e => (s.kind === 'naked' ? e.i === s.i : s.U.cells.includes(e.i) && (e.m & bit(s.d))));
            return Object.assign(s, { rel, S });
          }
          if (!step(S, maxLv)) return null;
        }
        return null;
      },
    };
  };

  /* Suggerimento per le griglie latine.
     o: { n, units, peers(i), solver, naked(i, d), hidden(U, d, i): testi dei passi semplici, fam: { famiglia: consiglio } } */
  const FAM_TIP = {
    locked: 'Annota i candidati e guarda un riquadro: c\'è un numero che può stare solo su una riga o su una colonna? Allora quella riga o colonna non può averlo fuori dal riquadro.',
    pair: 'Annota i candidati e cerca due caselle della stessa WHERE con gli stessi due soli numeri: quei numeri sono «prenotati» e spariscono dalle altre caselle. Vale anche al contrario: due numeri che hanno solo le stesse due caselle.',
    wing: 'Qui serve un ragionamento a incastro: annota i candidati e cerca caselle con due soli numeri che si vedono tra loro, oppure un numero che in due righe ha solo due posti, sulle stesse colonne.',
  };
  Z.latinHint = function (P, st, o) {
    const n = o.n, N = n * n, s = Z.clone(st);
    const wrong = [];
    for (let i = 0; i < N; i++) if (s.v[i] && s.v[i] !== P.sol[i]) wrong.push(i);
    const zone = U => uname(U);
    const where = (o.units.length > 2 * n) ? 'riga, colonna o riquadro' : 'riga o colonna';
    if (wrong.length) {
      const i = Z.pick(wrong), d = s.v[i];
      const U = o.units.find(u => u.cells.includes(i));
      const twin = o.peers(i).find(p => st.v[p] === d);
      s.v[i] = 0; s.m[i] = 0;
      return {
        state: s, focus: [i], area: U.cells,
        tag: 'wrong',
        tip: Z.say(`C'è qualcosa da ricontrollare ${U.where.toLowerCase()}.`, `Vale la pena ricontrollare ${zone(U)}.`) +
          ` Per ogni numero che hai scritto chiediti: è già presente nella sua ${where}? E lascia ancora un posto a tutti gli altri numeri?`,
        why: (twin != null
          ? `Il <b>${d}</b> in ${Z.cellName(i, n)} si ripete: c'è già un ${d} in ${Z.cellName(twin, n)}, ${((twin / n) | 0) === ((i / n) | 0) ? 'nella stessa riga' : twin % n === i % n ? 'nella stessa colonna' : 'nello stesso riquadro'}.`
          : `Il <b>${d}</b> in ${Z.cellName(i, n)} sembrava possibile, ma non è quello giusto: lasciandolo lì, più avanti qualche casella resterebbe senza numeri possibili.`) +
          ` L'ho tolto, così riparti da una base sicura.` + (wrong.length > 1 ? ` Ci sono altri ${wrong.length - 1} numeri da ricontrollare.` : ''),
      };
    }
    const place = (i, d) => { s.v[i] = d; s.m[i] = 0; for (const p of o.peers(i)) s.m[p] &= ~(1 << d); };
    const r = o.solver.next(s.v);
    if (r && P.sol[r.i] === r.d) {
      const { i, d } = r, U = r.U || o.units.find(u => u.cells.includes(i));
      place(i, d);
      if (!r.rel.length) {
        const why = r.kind === 'naked' ? o.naked(i, d) : o.hidden(U, d, i);
        const tip = r.kind === 'naked'
          ? Z.say(`Guarda ${zone(U)}: in una delle sue caselle libere può andare un solo numero.`, `${U.where} c'è una casella con un solo numero possibile. Riesci a trovarla?`) +
            ` Per ogni casella libera elimina i numeri che vede già nella sua ${where}: quelli che restano sono i candidati.`
          : Z.say(`${U.where} manca ancora il <b>${d}</b>: dove può andare?`, `Prova con il <b>${d}</b> ${zone(U).replace(/^(la|il) /, m => (m === 'la ' ? 'nella ' : 'nel '))}: quante caselle libere possono ospitarlo?`) +
            ` Escludi le caselle che hanno già un ${d} nella loro ${where}: se ne resta una sola, è quella.`;
        return { state: s, focus: [i], area: U.cells, why, tip, tag: r.kind };
      }
      /* il ragionamento più avanzato tra quelli che servono dà il nome al passo */
      const top = r.rel.reduce((a, e) => (e.t.lv > a.t.lv ? e : a), r.rel[0]);
      const steps = [...new Set(r.rel.map(e => e.txt))];
      const shown = steps.length > 3 ? steps.slice(-3) : steps;
      const end = r.kind === 'naked'
        ? `Così in ${Z.cellName(i, n)} resta solo ${Z.il(d)}.`
        : `Così ${lc(U.where)} ${Z.il(d)} può andare solo in ${Z.cellName(i, n)}.`;
      const area = [...new Set([i, ...r.rel.flatMap(e => e.src), ...(r.kind === 'hidden' ? U.cells : [])])];
      return {
        state: s, focus: [i], area, tag: top.t.fam,
        tip: ((o.fam && o.fam[top.t.fam]) || FAM_TIP[top.t.fam] || 'Annota i candidati: qui serve un passo in più.').replace('WHERE', where),
        why: (steps.length > shown.length ? 'Annotando i candidati si arriva a questo punto. ' : '') + shown.join(' ') + ' ' + end,
      };
    }
    /* rompicapo di prima (salvati con le versioni vecchie) che la logica non risolve: casella con meno candidati */
    const cand = Z.basicCand(s.v, n, o.peers);
    let best = -1, bc = 99;
    for (let i = 0; i < N; i++) if (!s.v[i]) {
      const c = Z.popcount(cand[i] | (1 << P.sol[i]));
      if (c < bc) { bc = c; best = i; }
    }
    if (best < 0) return null;
    const d = P.sol[best];
    const list = Z.bits(cand[best] | (1 << d), n);
    place(best, d);
    return {
      state: s, focus: [best], area: [best],
      tip: `Qui non c'è una mossa immediata: è il momento delle note. Scrivi i candidati di ${Z.cellName(best, n)}, sono pochi: prova a immaginarne uno alla volta e guarda quale porta a un problema.`,
      tag: 'guess', why: `Qui non c'è una mossa immediata. In ${Z.cellName(best, n)} restano i candidati ${Z.fmtList(list.map(x => '<b>' + x + '</b>'))}: ` +
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
