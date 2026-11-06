/* Solitari di carte: Classico, FreeCell, Piramide, TriPeaks e Golf, con le carte francesi.
   Le smazzate sono casuali ma si danno solo quelle che si possono vincere (generate trova prima la strada, P.sol).
   Dopo qualche mossa sbagliata la partita può bloccarsi: il Suggerimento lo dice (stuck). Il Suggerimento cerca una strada
   fino alla vittoria (conosce anche le carte coperte, ma non le nomina) e, se non la vede tutta, consiglia la mossa
   che sembra più utile. Nel menu i cinque giochi stanno insieme («Solitari», family) e si scelgono con la difficoltà,
   ma ognuno ha i suoi dati e il suo Percorso. */
(function () {
  'use strict';
  const Z = window.Zen;
  const VS = '︎'; /* niente emoji per i semi sull'iPhone */
  const SUITS = ['♥', '♦', '♣', '♠'].map(x => x + VS), SUIT_N = ['cuori', 'quadri', 'fiori', 'picche'];
  const rk = c => c % 13 + 1, su = c => (c / 13) | 0, red = c => c < 26;
  const RL = r => (r === 1 ? 'A' : r === 11 ? 'J' : r === 12 ? 'Q' : r === 13 ? 'K' : String(r));
  const nm = c => `<b class="cd-n${red(c) ? ' r' : ''}">${RL(rk(c))}${SUITS[su(c)]}</b>`;
  const top = a => (a.length ? a[a.length - 1] : -1);
  const sum = a => a.reduce((x, y) => x + y, 0);
  const deck = () => Z.shuffle(Z.range(52));
  /* carta c sulla pila del suo seme; "sicura" = le carte più basse dell'altro colore sono già salite */
  const toF = (F, c) => F[su(c)] === rk(c) - 1;
  const safeF = (F, c) => toF(F, c) && (rk(c) <= 2 || (red(c) ? Math.min(F[2], F[3]) : Math.min(F[0], F[1])) >= rk(c) - 1);
  /* lo scende su hi in una colonna: colore diverso e un valore in meno */
  const builds = (lo, hi) => rk(hi) === rk(lo) + 1 && red(hi) !== red(lo);
  const near = (a, b, wrap) => { const d = Math.abs(rk(a) - rk(b)); return d === 1 || (wrap && d === 12); };
  const NOTSURE = ' <i>Non vedo ancora tutta la strada fino alla fine: questa mi sembra la mossa più utile.</i>';

  /* ---------- ricerca di una strada (uguale per tutti i solitari) ----------
     E: { moves(P, s, search), apply(P, s, m), key(s), score(s), goal(s) }. Si esplorano prima gli stati più promettenti;
     la strada trovata resta in memoria, così i suggerimenti dopo sono immediati. */
  const memo = new Map(), sigs = new WeakMap();
  /* chiave esatta di uno stato di questa smazzata (le mosse in memoria valgono solo per lei) */
  const mkey = (E, P, s) => {
    let g = sigs.get(P);
    if (!g) { g = JSON.stringify(P.start) + P.kind; sigs.set(P, g); }
    return g + '#' + (E.mkey || E.key)(s);
  };
  function remember(E, P, s, path, sure) {
    if (memo.size > 30000) memo.clear();
    for (const m of path) { memo.set(mkey(E, P, s), { m, sure }); s = E.apply(P, s, m); }
  }
  function search(E, P, s0, ms, max) {
    const t0 = Z.now(), seen = new Set([E.key(s0)]);
    const N = [{ s: s0, p: -1, m: null }], heap = [];
    const push = (v, i) => { heap.push([v, i]); let k = heap.length - 1; while (k) { const q = (k - 1) >> 1; if (heap[q][0] >= heap[k][0]) break; [heap[q], heap[k]] = [heap[k], heap[q]]; k = q; } };
    const pop = () => {
      const r = heap[0], l = heap.pop();
      if (heap.length) { heap[0] = l; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < heap.length && heap[a][0] > heap[m][0]) m = a; if (b < heap.length && heap[b][0] > heap[m][0]) m = b; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } }
      return r[1];
    };
    const pathTo = i => { const out = []; for (; N[i].p >= 0; i = N[i].p) out.push(N[i].m); return out.reverse(); };
    let best = 0, bestV = E.score(s0), n = 0;
    push(bestV, 0);
    while (heap.length) {
      const i = pop(), s = N[i].s;
      if (E.goal(s)) return { path: pathTo(i), win: true };
      if ((++n & 127) === 0 && (Z.now() - t0 > ms || N.length > max)) return { path: pathTo(best), win: false };
      for (const m of E.moves(P, s, true)) {
        const ns = E.apply(P, s, m), k = E.key(ns);
        if (seen.has(k)) continue;
        seen.add(k);
        N.push({ s: ns, p: i, m });
        const v = E.score(ns) - N.length * 1e-7;
        if (v > bestV) { bestV = v; best = N.length - 1; }
        push(v, N.length - 1);
      }
    }
    return { path: [], win: false, lost: true };
  }
  /* prossima mossa consigliata: { m, sure } oppure null (nessuna strada) */
  const seeded = new Set();
  function nextMove(E, P, s) {
    /* la strada trovata quando la smazzata è stata preparata (P.sol) */
    if (P.sol) { const k0 = mkey(E, P, P.start); if (!seeded.has(k0)) { seeded.add(k0); remember(E, P, Z.clone(P.start), P.sol, true); } }
    const k = mkey(E, P, s), had = memo.get(k);
    if (had) return had.m ? had : null;
    const r = search(E, P, s, 260, 60000);
    if (r.path.length) { remember(E, P, s, r.path, r.win); return memo.get(k); }
    if (!r.lost) { const ms = E.moves(P, s, true); return ms.length ? { m: ms[0], sure: false } : null; }
    memo.set(k, { m: null });
    return null;
  }

  /* ---------- disegno delle carte (comune) ---------- */
  function table(cls, W, H, CW) {
    const el = Z.h('div.cards-t.' + cls);
    el.style.setProperty('--cw', CW);
    const pos = (e, x, y, w, hgt) => {
      e.style.left = x + '%'; e.style.top = (y / H * 100) + '%';
      if (w != null) { e.style.width = w + '%'; e.style.height = (hgt / H * 100) + '%'; }
    };
    return { el, pos };
  }
  function makeCards(T, CW, CH, tap) {
    return Z.range(52).map(c => {
      const e = Z.h('div.cd' + (red(c) ? '.red' : ''), { 'data-c': c, role: 'img', 'aria-label': RL(rk(c)) + ' di ' + SUIT_N[su(c)] });
      e.innerHTML = `<span class="cd-k">${RL(rk(c))}<i>${SUITS[su(c)]}</i></span><span class="cd-s">${SUITS[su(c)]}</span>`;
      T.pos(e, 0, 0, CW, CH);
      e.addEventListener('pointerdown', ev => { ev.preventDefault(); tap({ c }); });
      T.el.append(e);
      return e;
    });
  }
  function makeSlot(T, CW, CH, name, x, y, label, tap, slots) {
    const e = Z.h('div.cd-slot', { html: label || '' });
    T.pos(e, x, y, CW, CH);
    e.addEventListener('pointerdown', ev => { ev.preventDefault(); tap({ slot: name }); });
    T.el.append(e);
    slots[name] = e;
    return e;
  }
  /* mette la carta al suo posto; se si sposta, passa sopra le altre durante il movimento */
  function placer(T, cards) {
    const last = {};
    return (c, x, y, z, up) => {
      const e = cards[c], k = x.toFixed(2) + ',' + y.toFixed(2);
      e.classList.toggle('down', !up);
      if (last[c] !== k) {
        T.pos(e, x, y);
        if (last[c] !== undefined) { e.style.zIndex = 900 + z; clearTimeout(e._zt); e._zt = setTimeout(() => { e.style.zIndex = z; e._zt = 0; }, 320); }
        else e.style.zIndex = z;
        last[c] = k;
      } else if (!e._zt) e.style.zIndex = z;
    };
  }
  const REDEAL = '<svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2-4.9"/><path d="M19 4v4h-4"/></svg>';
  const flashIn = (cards, slots) => list => (list || []).forEach(t => Z.flashEl(typeof t === 'number' ? cards[t] : slots[t]));
  const STUCK_LOST = () => Z.say(
    'Da qui non trovo più una strada fino alla vittoria. Questa partita all’inizio si poteva vincere: annulla qualche mossa e prova un’altra strada (spesso basta tornare a prima di un mazzo girato o di una colonna svuotata).',
    'Con le mosse fatte finora la partita si è bloccata, ma dall’inizio si poteva vincere. Prova ad annullare qualche mossa e a scegliere diversamente.');
  const STUCK_NONE = () => 'Non ci sono più mosse possibili. Questa partita all’inizio si poteva vincere: annulla qualche mossa e prova un’altra strada.';

  /* ======================= Classico (Klondike) ======================= */
  const KL = {
    moves(P, s, search) {
      const out = [], F = s.f, w = top(s.w);
      if (search) {
        if (w >= 0 && safeF(F, w)) return [{ k: 'wf' }];
        for (let i = 0; i < 7; i++) { const c = top(s.t[i]); if (c >= 0 && safeF(F, c)) return [{ k: 'tf', from: i }]; }
      }
      if (w >= 0 && toF(F, w)) out.push({ k: 'wf' });
      for (let i = 0; i < 7; i++) { const c = top(s.t[i]); if (c >= 0 && toF(F, c)) out.push({ k: 'tf', from: i }); }
      /* tutto scoperto e mazzo finito: basta far salire le carte */
      if (search && !s.st.length && !s.w.length && s.d.every(x => !x)) return out;
      const empty = s.t.findIndex(a => !a.length);
      const fits = (j, c) => (s.t[j].length ? builds(c, top(s.t[j])) : rk(c) === 13);
      for (let i = 0; i < 7; i++) {
        const a = s.t[i];
        for (let k = s.d[i]; k < a.length; k++) {
          const c = a[k];
          if (search && !(k === s.d[i] ? (s.d[i] > 0 || rk(c) !== 13) : toF(F, a[k - 1]))) continue;
          for (let j = 0; j < 7; j++) {
            if (j === i || (search && !s.t[j].length && j !== empty)) continue;
            if (fits(j, c)) out.push({ k: 'tt', from: i, n: a.length - k, to: j });
          }
        }
      }
      if (w >= 0) for (let j = 0; j < 7; j++) { if (search && !s.t[j].length && j !== empty) continue; if (fits(j, w)) out.push({ k: 'wt', to: j }); }
      if (!search) for (let x = 0; x < 4; x++) if (F[x]) for (let j = 0; j < 7; j++) if (fits(j, x * 13 + F[x] - 1)) out.push({ k: 'ft', s: x, to: j });
      if (s.st.length || s.w.length) out.push({ k: 'draw' });
      return out;
    },
    apply(P, s, m) {
      const n = { t: s.t.map(a => a.slice()), d: s.d.slice(), st: s.st.slice(), w: s.w.slice(), f: s.f.slice() };
      const flip = i => { if (n.d[i] && n.d[i] >= n.t[i].length) n.d[i] = n.t[i].length - 1; };
      if (m.k === 'draw') {
        if (!n.st.length) { n.st = n.w.reverse(); n.w = []; } else for (let x = 0; x < P.draw && n.st.length; x++) n.w.push(n.st.pop());
      } else if (m.k === 'wf') n.f[su(n.w.pop())]++;
      else if (m.k === 'wt') n.t[m.to].push(n.w.pop());
      else if (m.k === 'tf') { n.f[su(n.t[m.from].pop())]++; flip(m.from); }
      else if (m.k === 'tt') { n.t[m.to].push(...n.t[m.from].splice(n.t[m.from].length - m.n)); flip(m.from); }
      else if (m.k === 'ft') { n.f[m.s]--; n.t[m.to].push(m.s * 13 + n.f[m.s]); }
      return n;
    },
    key: s => s.t.map((a, i) => s.d[i] + ':' + a.join('.')).join('/') + '|' + s.st.join('.') + '|' + s.w.join('.'),
    score: s => 6 * sum(s.f) - 5 * sum(s.d) - 0.3 * (s.st.length + s.w.length) + s.t.filter(a => !a.length).length,
    goal: s => sum(s.f) === 52,
    explain(P, s, m) {
      const F = s.f;
      if (m.k === 'wf' || m.k === 'tf') {
        const c = m.k === 'wf' ? top(s.w) : top(s.t[m.from]);
        return { tag: 'found', area: [c], focus: [c],
          tip: Z.say('Guarda le carte che puoi prendere: ce n\'è una che può già salire sulla pila del suo seme?', 'Le pile dei semi si costruiscono dall\'Asso al Re, un seme per pila. Quale carta può già andarci?'),
          why: `${nm(c)} sale sulla pila di ${SUIT_N[su(c)]}: ${rk(c) === 1 ? 'un Asso apre sempre una pila nuova' : 'sopra c\'è già ' + nm(c - 1)}. ` +
            (safeF(F, c) ? 'È una mossa tranquilla: le carte più basse dell\'altro colore sono già salite, quindi sul tavolo non ti servirà più.' : 'Ogni carta che sale lascia più spazio sul tavolo.') };
      }
      if (m.k === 'draw') {
        const re = !s.st.length;
        return { tag: 'draw', area: ['st'], focus: ['st'],
          tip: re ? 'Il mazzo è finito: rigiralo per ripassare le carte degli scarti.' : Z.say('Sul tavolo adesso non c\'è una mossa utile: prova a girare il mazzo.', 'Guarda bene il tavolo: se nessuna carta può spostarsi in modo utile, è il momento di girare il mazzo.'),
          why: re ? 'Gli scarti tornano nel mazzo nello stesso ordine: potrai rivedere le carte che prima non potevi usare.'
            : `Nessuna mossa sul tavolo scopre carte nuove: dal mazzo ne arriva una${P.draw === 3 ? ' (se ne girano tre, ma si usa solo quella in cima)' : ''}.` };
      }
      if (m.k === 'wt') {
        const c = top(s.w), t = top(s.t[m.to]);
        return { tag: t < 0 ? 'king' : 'waste', area: [c], focus: [c],
          tip: t < 0 ? 'C\'è una colonna vuota: lì può andare solo un Re. Ce n\'è uno pronto?' : Z.say('Guarda la carta in cima agli scarti: c\'è una colonna dove può scendere?', 'La carta degli scarti può tornare in gioco: cerca una carta di colore diverso e di un valore più alto.'),
          why: t < 0 ? `${nm(c)} va nella colonna vuota: è l'unica carta che può andarci, e così lascia gli scarti.`
            : `${nm(c)} scende dagli scarti su ${nm(t)}: colore diverso e un valore in meno. Così rimette in gioco anche la carta che c'è sotto negli scarti.` };
      }
      if (m.k === 'ft') {
        const c = m.s * 13 + F[m.s] - 1;
        return { tag: 'back', area: [c], focus: [c], tip: 'A volte conviene riprendere una carta dalle pile dei semi per appoggiarci sopra le altre.', why: `${nm(c)} torna sul tavolo: ora ci puoi appoggiare sopra una carta di colore diverso.` };
      }
      /* da colonna a colonna */
      const a = s.t[m.from], k = a.length - m.n, c = a[k], t = top(s.t[m.to]);
      const what = m.n > 1 ? `il gruppo che parte da ${nm(c)}` : nm(c);
      const reveal = k === s.d[m.from] && s.d[m.from] > 0;
      const onto = t < 0 ? 'nella colonna vuota (lì può andare solo un Re)' : `su ${nm(t)}: colore diverso e un valore in meno`;
      if (reveal) return { tag: 'reveal', area: [c], focus: [c],
        tip: Z.say('In una colonna ci sono carte coperte: se sposti le carte scoperte che le stanno sopra, ne giri una nuova. Dove possono andare?', 'Le carte coperte nascondono le mosse che ti servono. Quale colonna puoi liberare per girarne una?'),
        why: `Sposta ${what} ${onto}. Così si gira una carta coperta: più carte vedi, più mosse avrai.` };
      if (t < 0) return { tag: 'shift', area: [c, 't' + m.to], focus: [c], tip: 'C\'è una colonna vuota: lì può andare solo un Re. Quale ti conviene spostare?', why: `Sposta ${what} ${onto}.` };
      if (k > s.d[m.from]) return { tag: 'shift', area: [a[k - 1]], focus: [c],
        tip: 'Una carta che potrebbe salire sulla sua pila ha sopra altre carte: puoi spostarle altrove?',
        why: `Sposta ${what} ${onto}: così resta libero ${nm(a[k - 1])}, che può salire sulla pila di ${SUIT_N[su(a[k - 1])]}.` };
      return { tag: 'shift', area: [c], focus: [c], tip: 'Prova a spostare un gruppo di carte: una colonna vuota può accogliere un Re.', why: `Sposta ${what} ${onto}: la colonna resta vuota e potrà accogliere un Re.` };
    },
    deal(opt) {
      const d = deck(), t = [], dn = [];
      let k = 0;
      for (let i = 0; i < 7; i++) { t.push(d.slice(k, k + i + 1)); k += i + 1; dn.push(i); }
      return { draw: opt.draw, start: { t, d: dn, st: d.slice(k), w: [], f: [0, 0, 0, 0] } };
    },
    progress: (P, s) => ({ ok: 2 * sum(s.f) + sum(s.t.map((a, i) => a.length - s.d[i])), bad: 0 }),
  };

  function klView(ctx) {
    const P = ctx.puzzle, H = 140, CW = 12.4, G = (100 - 7 * CW) / 8, CH = CW * 1.42;
    const X = i => G + i * (CW + G), TOP = 2, Y0 = TOP + CH + 3;
    const T = table('kl', 100, H, CW), slots = {};
    let cur = null, sel = null;
    makeSlot(T, CW, CH, 'st', X(0), TOP, REDEAL, tap, slots).classList.add('cd-stock');
    for (let x = 0; x < 4; x++) makeSlot(T, CW, CH, 'f' + x, X(3 + x), TOP, `<span class="cd-sl${x < 2 ? ' r' : ''}">${SUITS[x]}</span>`, tap, slots);
    for (let i = 0; i < 7; i++) makeSlot(T, CW, CH, 't' + i, X(i), Y0, '<span class="cd-sl">K</span>', tap, slots);
    const cards = makeCards(T, CW, CH, tap), place = placer(T, cards);
    const fan = P.draw === 3 ? 3 : 1;
    function where(c) {
      if (cur.st.includes(c)) return { in: 'st' };
      const wi = cur.w.indexOf(c);
      if (wi >= 0) return { in: 'w', top: wi === cur.w.length - 1 };
      for (let i = 0; i < 7; i++) { const k = cur.t[i].indexOf(c); if (k >= 0) return { in: 't', i, k, up: k >= cur.d[i] }; }
      return { in: 'f', x: su(c), top: rk(c) === cur.f[su(c)] };
    }
    const legal = () => KL.moves(P, cur, false);
    function find(src, dest) {
      return legal().find(m => {
        if (src.w) return dest.f != null ? m.k === 'wf' && su(top(cur.w)) === dest.f : m.k === 'wt' && m.to === dest.t;
        if (src.f != null) return m.k === 'ft' && m.s === src.f && m.to === dest.t;
        if (dest.f != null) return m.k === 'tf' && m.from === src.i && src.k === cur.t[src.i].length - 1 && su(top(cur.t[src.i])) === dest.f;
        return m.k === 'tt' && m.from === src.i && m.n === cur.t[src.i].length - src.k && m.to === dest.t;
      });
    }
    /* toccata due volte: va dove può (prima sulla pila del seme) */
    function auto(src) {
      const ms = legal();
      const one = src.w || (src.i != null && src.k === cur.t[src.i].length - 1);
      if (one) { const f = ms.find(m => (src.w ? m.k === 'wf' : m.k === 'tf' && m.from === src.i)); if (f) return f; }
      const to = ms.filter(m => (src.w ? m.k === 'wt' : src.f != null ? m.k === 'ft' && m.s === src.f : m.k === 'tt' && m.from === src.i && m.n === cur.t[src.i].length - src.k));
      return to.find(m => cur.t[m.to].length) || to[0] || null;
    }
    const same = (a, b) => a && b && !!a.w === !!b.w && a.f === b.f && a.i === b.i && a.k === b.k;
    function tap(t) {
      if (!cur) return;
      const w = t.slot ? null : where(t.c);
      if (t.slot === 'st' || (w && w.in === 'st')) {
        sel = null;
        if (cur.st.length || cur.w.length) ctx.commit(KL.apply(P, cur, { k: 'draw' })); else paint();
        return;
      }
      const src = !w ? null : w.in === 'w' && w.top ? { w: true } : w.in === 't' && w.up ? { i: w.i, k: w.k } : w.in === 'f' && w.top ? { f: w.x } : null;
      if (sel) {
        if (same(sel, src)) { const m = auto(sel); sel = null; if (m) ctx.commit(KL.apply(P, cur, m)); else { ctx.miss(); paint(); Z.flashEl(cards[t.c]); } return; }
        const dest = t.slot ? (t.slot[0] === 'f' ? { f: +t.slot[1] } : { t: +t.slot[1] }) : w.in === 't' ? { t: w.i } : w.in === 'f' ? { f: w.x } : null;
        const m = dest && find(sel, dest);
        if (m) { sel = null; ctx.commit(KL.apply(P, cur, m)); return; }
        if (!src) { sel = null; ctx.miss(); paint(); return; }
      }
      sel = src;
      paint();
    }
    function paint() {
      const s = cur;
      s.st.forEach((c, k) => place(c, X(0), TOP, 10 + k, false));
      const L = s.w.length;
      s.w.forEach((c, k) => place(c, X(1) + Math.max(0, k - (L - fan)) * 3.4, TOP, 70 + k, true));
      for (let x = 0; x < 4; x++) for (let r = 0; r < 13; r++) { const c = x * 13 + r; if (r < s.f[x]) place(c, X(3 + x), TOP, 130 + r, true); }
      for (let i = 0; i < 7; i++) {
        const a = s.t[i], dn = s.d[i], up = a.length - dn;
        const need = dn * 2.4 + Math.max(0, up - 1) * 6.6, room = H - 2 - Y0 - CH, f = need > room ? room / need : 1;
        let y = Y0;
        a.forEach((c, k) => { place(c, X(i), y, 200 + k, k >= dn); y += (k < dn ? 2.4 : 6.6) * f; });
      }
      slots.st.classList.toggle('empty-st', !s.st.length);
      slots.st.classList.toggle('none', !s.st.length && !s.w.length);
      const on = new Set();
      if (sel) {
        if (sel.w) on.add(top(s.w));
        else if (sel.f != null) on.add(sel.f * 13 + s.f[sel.f] - 1);
        else s.t[sel.i].slice(sel.k).forEach(c => on.add(c));
      }
      cards.forEach((e, c) => e.classList.toggle('sel', on.has(c)));
    }
    return {
      el: T.el, aspect: 100 / H,
      render(s) { cur = s; if (sel && sel.i != null && (sel.k >= s.t[sel.i].length || sel.k < s.d[sel.i])) sel = null; if (sel && sel.w && !s.w.length) sel = null; paint(); },
      flash: flashIn(cards, slots),
    };
  }

  /* ======================= FreeCell ======================= */
  const runLen = a => { if (!a.length) return 0; let n = 1; while (n < a.length && builds(a[a.length - n], a[a.length - n - 1])) n++; return n; };
  const cap = (free, empties) => (free + 1) * Math.pow(2, Math.max(0, empties));
  const FC = {
    moves(P, s, search) {
      const out = [], F = s.f, free = s.c.filter(x => x < 0).length, empties = s.t.filter(a => !a.length).length;
      if (search) {
        for (let i = 0; i < s.c.length; i++) if (s.c[i] >= 0 && safeF(F, s.c[i])) return [{ k: 'cf', from: i }];
        for (let i = 0; i < 8; i++) { const c = top(s.t[i]); if (c >= 0 && safeF(F, c)) return [{ k: 'tf', from: i }]; }
      }
      s.c.forEach((c, i) => { if (c >= 0 && toF(F, c)) out.push({ k: 'cf', from: i }); });
      for (let i = 0; i < 8; i++) { const c = top(s.t[i]); if (c >= 0 && toF(F, c)) out.push({ k: 'tf', from: i }); }
      const empty = s.t.findIndex(a => !a.length), cell = s.c.indexOf(-1);
      for (let i = 0; i < 8; i++) {
        const a = s.t[i], L = runLen(a);
        for (let n = 1; n <= L; n++) {
          const c = a[a.length - n];
          for (let j = 0; j < 8; j++) {
            if (j === i) continue;
            if (!s.t[j].length) {
              if (search && (j !== empty || n === a.length)) continue;
              if (n <= cap(free, empties - 1)) out.push({ k: 'tt', from: i, n, to: j });
            } else if (builds(c, top(s.t[j])) && n <= cap(free, empties)) out.push({ k: 'tt', from: i, n, to: j });
          }
        }
      }
      s.c.forEach((c, i) => {
        if (c < 0) return;
        for (let j = 0; j < 8; j++) {
          if (!s.t[j].length ? (!search || j === empty) : builds(c, top(s.t[j]))) out.push({ k: 'ct', from: i, to: j });
        }
      });
      if (cell >= 0) for (let i = 0; i < 8; i++) if (s.t[i].length) {
        if (search) out.push({ k: 'tc', from: i, to: cell });
        else s.c.forEach((x, j) => { if (x < 0) out.push({ k: 'tc', from: i, to: j }); });
      }
      return out;
    },
    apply(P, s, m) {
      const n = { t: s.t.map(a => a.slice()), c: s.c.slice(), f: s.f.slice() };
      if (m.k === 'tf') n.f[su(n.t[m.from].pop())]++;
      else if (m.k === 'cf') { n.f[su(n.c[m.from])]++; n.c[m.from] = -1; }
      else if (m.k === 'tt') n.t[m.to].push(...n.t[m.from].splice(n.t[m.from].length - m.n));
      else if (m.k === 'ct') { n.t[m.to].push(n.c[m.from]); n.c[m.from] = -1; }
      else if (m.k === 'tc') n.c[m.to] = n.t[m.from].pop();
      return n;
    },
    key: s => s.t.map(a => a.join('.')).sort().join('/') + '|' + s.c.filter(x => x >= 0).sort((a, b) => a - b).join('.'),
    mkey: s => s.t.map(a => a.join('.')).join('/') + '|' + s.c.join('.'),
    score(s) {
      let v = 10 * sum(s.f) + 3 * s.c.filter(x => x < 0).length + 4 * s.t.filter(a => !a.length).length;
      for (const a of s.t) {
        for (let k = 1; k < a.length; k++) if (!builds(a[k], a[k - 1])) v -= 2;
        for (let k = 0; k < a.length; k++) if (rk(a[k]) === s.f[su(a[k])] + 1) v -= (a.length - 1 - k);
      }
      return v;
    },
    goal: s => sum(s.f) === 52,
    explain(P, s, m) {
      if (m.k === 'tf' || m.k === 'cf') {
        const c = m.k === 'tf' ? top(s.t[m.from]) : s.c[m.from];
        return { tag: 'found', area: [c], focus: [c],
          tip: Z.say('Guarda le carte libere, in fondo alle colonne e nelle celle: una può già salire sulla pila del suo seme?', 'Le pile dei semi vanno dall\'Asso al Re. Quale carta libera può salire adesso?'),
          why: `${nm(c)} sale sulla pila di ${SUIT_N[su(c)]}: ${rk(c) === 1 ? 'un Asso apre sempre una pila nuova' : 'sopra c\'è già ' + nm(c - 1)}. Ogni carta che sale libera spazio.` };
      }
      if (m.k === 'tc') {
        const a = s.t[m.from], c = top(a), u = a.length > 1 ? a[a.length - 2] : -1;
        const fu = u >= 0 && toF(s.f, u);
        return { tag: 'cell', area: [c], focus: [c],
          tip: Z.say('Una cella libera può tenere da parte una carta per un po\'. Quale carta ti blocca la strada?', 'A volte serve mettere da parte una carta in una cella per liberare quella sotto.'),
          why: `Metti ${nm(c)} in una cella: così ${u >= 0 ? nm(u) + ' resta libera' + (fu ? ' e può salire sulla sua pila' : '') : 'la colonna resta vuota'}. Le celle sono poche: usale per sbloccare, non per parcheggiare.` };
      }
      const c = m.k === 'ct' ? s.c[m.from] : s.t[m.from][s.t[m.from].length - m.n], t = top(s.t[m.to]);
      const what = m.k === 'tt' && m.n > 1 ? `il gruppo che parte da ${nm(c)}` : nm(c);
      if (t < 0) return { tag: 'empty', area: [c, 't' + m.to], focus: [c],
        tip: 'Una colonna vuota vale molto: ci puoi mettere qualsiasi carta, o un gruppo ordinato. Che cosa ti conviene spostarci?',
        why: `Sposta ${what} nella colonna vuota: ${m.k === 'ct' ? 'così si libera una cella' : 'così si libera la carta che c\'era sotto'}.` };
      const from = m.k === 'tt' ? s.t[m.from] : null, u = from && from.length > m.n ? from[from.length - m.n - 1] : -1;
      return { tag: 'build', area: [c], focus: [c],
        tip: Z.say('Cerca una carta che può scendere su un\'altra di colore diverso e di un valore più alto: le scale ordinate si spostano meglio.', 'Costruisci le colonne in scala: ogni carta va su una di colore diverso e di un valore in più.'),
        why: (m.k === 'tt' && m.n > 1 ? `Sposta ${what} su ${nm(t)}` : `${nm(c)} scende su ${nm(t)}`) + ': colore diverso e un valore in meno.' +
          (m.k === 'ct' ? ' Così si libera una cella.' : u >= 0 ? ` Così resta libera ${nm(u)}.` : ' Così la colonna resta vuota.') };
    },
    deal(opt) {
      const d = deck(), t = Z.range(8).map(() => []);
      d.forEach((c, i) => t[i % 8].push(c));
      return { cells: opt.cells, start: { t, c: new Array(opt.cells).fill(-1), f: [0, 0, 0, 0] } };
    },
    progress(P, s) {
      let ok = 2 * sum(s.f);
      for (const a of s.t) for (let k = 1; k < a.length; k++) if (builds(a[k], a[k - 1])) ok++;
      return { ok, bad: 0 };
    },
  };

  function fcView(ctx) {
    const P = ctx.puzzle, H = 140, CW = 11.2, G = (100 - 8 * CW) / 9, CH = CW * 1.42;
    const X = i => G + i * (CW + G), TOP = 2, Y0 = TOP + CH + 3;
    const T = table('fc', 100, H, CW), slots = {};
    let cur = null, sel = null;
    for (let x = 0; x < P.cells; x++) makeSlot(T, CW, CH, 'c' + x, X(x), TOP, '', tap, slots).classList.add('cd-cell');
    for (let x = 0; x < 4; x++) makeSlot(T, CW, CH, 'f' + x, X(4 + x), TOP, `<span class="cd-sl${x < 2 ? ' r' : ''}">${SUITS[x]}</span>`, tap, slots);
    for (let i = 0; i < 8; i++) makeSlot(T, CW, CH, 't' + i, X(i), Y0, '', tap, slots);
    const cards = makeCards(T, CW, CH, tap), place = placer(T, cards);
    function where(c) {
      const ci = cur.c.indexOf(c);
      if (ci >= 0) return { in: 'c', x: ci };
      for (let i = 0; i < 8; i++) { const k = cur.t[i].indexOf(c); if (k >= 0) return { in: 't', i, k }; }
      return { in: 'f', x: su(c) };
    }
    const legal = () => FC.moves(P, cur, false);
    const nOf = src => cur.t[src.i].length - src.k;
    function find(src, dest) {
      return legal().find(m => {
        if (src.c != null) return dest.f != null ? m.k === 'cf' && m.from === src.c && su(cur.c[src.c]) === dest.f : dest.t != null && m.k === 'ct' && m.from === src.c && m.to === dest.t;
        if (dest.f != null) return m.k === 'tf' && m.from === src.i && nOf(src) === 1 && su(top(cur.t[src.i])) === dest.f;
        if (dest.c != null) return m.k === 'tc' && m.from === src.i && nOf(src) === 1 && m.to === dest.c;
        return m.k === 'tt' && m.from === src.i && m.n === nOf(src) && m.to === dest.t;
      });
    }
    function auto(src) {
      const ms = legal();
      if (src.c != null) return ms.find(m => m.k === 'cf' && m.from === src.c) || ms.find(m => m.k === 'ct' && m.from === src.c && cur.t[m.to].length) || ms.find(m => m.k === 'ct' && m.from === src.c) || null;
      const n = nOf(src);
      return (n === 1 && ms.find(m => m.k === 'tf' && m.from === src.i)) || ms.find(m => m.k === 'tt' && m.from === src.i && m.n === n && cur.t[m.to].length)
        || ms.find(m => m.k === 'tt' && m.from === src.i && m.n === n) || (n === 1 && ms.find(m => m.k === 'tc' && m.from === src.i)) || null;
    }
    const same = (a, b) => a && b && a.c === b.c && a.i === b.i && a.k === b.k;
    function tap(t) {
      if (!cur) return;
      const w = t.slot ? null : where(t.c);
      let src = null;
      if (w && w.in === 'c') src = { c: w.x };
      else if (w && w.in === 't') { const a = cur.t[w.i]; if (a.length - w.k <= runLen(a)) src = { i: w.i, k: w.k }; }
      if (sel) {
        if (same(sel, src)) { const m = auto(sel); sel = null; if (m) ctx.commit(FC.apply(P, cur, m)); else { ctx.miss(); paint(); Z.flashEl(cards[t.c]); } return; }
        const dest = t.slot ? { [t.slot[0]]: +t.slot.slice(1) } : w.in === 't' ? { t: w.i } : w.in === 'f' ? { f: w.x } : w.in === 'c' ? { c: w.x } : null;
        const m = dest && find(sel, dest);
        if (m) { sel = null; ctx.commit(FC.apply(P, cur, m)); return; }
        if (!src) { sel = null; ctx.miss(); paint(); return; }
      }
      sel = src;
      if (!src && w && w.in === 't') Z.flashEl(cards[t.c]);
      paint();
    }
    function paint() {
      const s = cur;
      s.c.forEach((c, x) => { if (c >= 0) place(c, X(x), TOP, 70, true); });
      for (let x = 0; x < 4; x++) for (let r = 0; r < s.f[x]; r++) place(x * 13 + r, X(4 + x), TOP, 130 + r, true);
      for (let i = 0; i < 8; i++) {
        const a = s.t[i], need = Math.max(0, a.length - 1) * 6.6, room = H - 2 - Y0 - CH, f = need > room ? room / need : 1;
        a.forEach((c, k) => place(c, X(i), Y0 + k * 6.6 * f, 200 + k, true));
      }
      const on = new Set();
      if (sel) { if (sel.c != null) on.add(s.c[sel.c]); else s.t[sel.i].slice(sel.k).forEach(c => on.add(c)); }
      cards.forEach((e, c) => e.classList.toggle('sel', on.has(c)));
    }
    return {
      el: T.el, aspect: 100 / H,
      render(s) { cur = s; if (sel && ((sel.c != null && s.c[sel.c] < 0) || (sel.i != null && sel.k >= s.t[sel.i].length))) sel = null; paint(); },
      flash: flashIn(cards, slots),
    };
  }

  /* ======================= Piramide ======================= */
  const PY_ROW = [], PY_CH = [];
  for (let r = 0, i = 0; r < 7; r++) for (let j = 0; j <= r; j++, i++) { PY_ROW.push([r, j]); PY_CH.push(r < 6 ? [(r + 1) * (r + 2) / 2 + j, (r + 1) * (r + 2) / 2 + j + 1] : null); }
  const pyFree = (s, i) => s.p[i] >= 0 && (!PY_CH[i] || (s.p[PY_CH[i][0]] < 0 && s.p[PY_CH[i][1]] < 0));
  const PY = {
    moves(P, s, search) {
      const out = [], ex = Z.range(28).filter(i => pyFree(s, i)), w = top(s.w);
      for (const a of ex) if (rk(s.p[a]) === 13) { if (search) return [{ k: 'k', a }]; out.push({ k: 'k', a }); }
      if (w >= 0 && rk(w) === 13) out.push({ k: 'k', a: -1 });
      for (let x = 0; x < ex.length; x++) for (let y = x + 1; y < ex.length; y++) if (rk(s.p[ex[x]]) + rk(s.p[ex[y]]) === 13) out.push({ k: 'p', a: ex[x], b: ex[y] });
      if (w >= 0) for (const a of ex) if (rk(s.p[a]) + rk(w) === 13) out.push({ k: 'p', a, b: -1 });
      if (s.st.length || (s.w.length && (!P.passes || s.g < P.passes - 1))) out.push({ k: 'draw' });
      return out;
    },
    apply(P, s, m) {
      const n = { p: s.p.slice(), st: s.st.slice(), w: s.w.slice(), g: s.g, lim: s.lim };
      if (m.k === 'draw') { if (n.st.length) n.w.push(n.st.pop()); else { n.st = n.w.reverse(); n.w = []; n.g++; } }
      else {
        if (m.a >= 0) n.p[m.a] = -1; else n.w.pop();
        if (m.k === 'p') { if (m.b >= 0) n.p[m.b] = -1; else n.w.pop(); }
      }
      return n;
    },
    key: s => s.p.map(x => (x < 0 ? '-' : 'o')).join('') + '|' + s.st.join('.') + '|' + s.w.join('.') + '|' + (s.lim ? s.g : ''),
    score: s => 3 * s.p.filter(x => x < 0).length - 0.5 * s.g - 0.02 * s.w.length,
    goal: s => s.p.every(x => x < 0),
    explain(P, s, m) {
      const w = top(s.w);
      if (m.k === 'draw') {
        const re = !s.st.length;
        return { tag: 'draw', area: ['st'], focus: ['st'],
          tip: re ? 'Il mazzo è finito: rigiralo per ripassare le carte degli scarti.' : 'Nessuna coppia libera fa 13 adesso: gira una carta dal mazzo.',
          why: re ? 'Gli scarti tornano nel mazzo: potrai usarli di nuovo per fare coppie.' : `Nessuna carta libera fa 13 con un'altra${w >= 0 ? ' o con ' + nm(w) : ''}: dal mazzo arriva una carta nuova.` };
      }
      const c = m.a >= 0 ? s.p[m.a] : w;
      if (m.k === 'k') return { tag: 'king', area: [c], focus: [c], tip: 'Il Re vale 13 da solo: ce n\'è uno libero?', why: `${nm(c)} vale 13 da solo: si toglie senza coppia${m.a >= 0 ? ' e libera le carte che copriva' : ''}.` };
      const d = m.b >= 0 ? s.p[m.b] : w, frees = [m.a, m.b].some(i => i >= 0 && PY_ROW[i][0] > 0);
      return { tag: m.b < 0 ? 'waste' : 'pair', area: m.b < 0 ? [d] : [c, d], focus: [c, d],
        tip: m.b < 0 ? 'La carta in cima agli scarti può fare coppia con una della piramide: quale somma fa 13?'
          : Z.say('Cerca due carte libere che insieme fanno 13 (Asso 1, Fante 11, Donna 12).', 'Guarda solo le carte non coperte: ce ne sono due che sommate fanno 13?'),
        why: `${nm(c)} e ${nm(d)} fanno ${rk(c)} + ${rk(d)} = 13 e si tolgono insieme.` + (frees ? ' Così si scoprono altre carte della piramide.' : '') };
    },
    deal(opt) {
      const d = deck();
      return { passes: opt.passes, start: { p: d.slice(0, 28), st: d.slice(28), w: [], g: 0, lim: opt.passes ? 1 : 0 } };
    },
    progress: (P, s) => ({ ok: 52 - s.p.filter(x => x >= 0).length - s.st.length - s.w.length, bad: 0 }),
  };

  function pyView(ctx) {
    const P = ctx.puzzle, H = 100, CW = 12, SX = 13, CH = CW * 1.42, SY = CH * 0.56;
    const T = table('py', 100, H, CW), slots = {};
    let cur = null, sel = null;
    const px = i => { const [r, j] = PY_ROW[i]; return 50 - (r + 1) * SX / 2 + j * SX + (SX - CW) / 2; };
    const py = i => 2 + PY_ROW[i][0] * SY, SY0 = 2 + 6 * SY + CH + 4, STX = 50 - CW - 4, WX = 54;
    makeSlot(T, CW, CH, 'st', STX, SY0, REDEAL, tap, slots).classList.add('cd-stock');
    makeSlot(T, CW, CH, 'w', WX, SY0, '', tap, slots);
    const cards = makeCards(T, CW, CH, tap), place = placer(T, cards);
    const free = c => { const i = cur.p.indexOf(c); return i >= 0 ? pyFree(cur, i) : c === top(cur.w); };
    const at = c => { const i = cur.p.indexOf(c); return i >= 0 ? i : -1; };
    function tap(t) {
      if (!cur) return;
      if (t.slot === 'st' || (t.c != null && cur.st.includes(t.c))) {
        sel = null;
        const m = PY.moves(P, cur, false).find(x => x.k === 'draw');
        if (m) ctx.commit(PY.apply(P, cur, m)); else { ctx.miss(); paint(); }
        return;
      }
      if (t.c == null || !free(t.c)) { if (t.c != null && cur.p.includes(t.c)) { ctx.miss(); Z.flashEl(cards[t.c]); } sel = null; paint(); return; }
      const c = t.c;
      if (rk(c) === 13) { sel = null; ctx.commit(PY.apply(P, cur, { k: 'k', a: at(c) })); return; }
      if (sel != null && sel !== c && free(sel)) {
        if (rk(sel) + rk(c) === 13) { const a = at(sel), b = at(c); sel = null; ctx.commit(PY.apply(P, cur, a >= 0 ? { k: 'p', a, b } : { k: 'p', a: b, b: -1 })); return; }
        ctx.miss();
      }
      sel = sel === c ? null : c;
      paint();
    }
    function paint() {
      const s = cur;
      s.p.forEach((c, i) => { if (c >= 0) place(c, px(i), py(i), 10 + i, true); });
      s.st.forEach((c, k) => place(c, STX, SY0, 100 + k, false));
      s.w.forEach((c, k) => place(c, WX, SY0, 200 + k, true));
      const inPlay = new Set([...s.p, ...s.st, ...s.w]);
      cards.forEach((e, c) => {
        if (!inPlay.has(c)) e.classList.add('gone');
        else e.classList.remove('gone');
        e.classList.toggle('sel', sel === c);
        e.classList.toggle('dim', s.p.includes(c) && !pyFree(s, s.p.indexOf(c)));
      });
      slots.st.classList.toggle('empty-st', !s.st.length);
      slots.st.classList.toggle('none', !s.st.length && !(s.w.length && (!P.passes || s.g < P.passes - 1)));
    }
    return {
      el: T.el, aspect: 100 / H,
      render(s) { cur = s; if (sel != null && !free(sel)) sel = null; paint(); },
      flash: flashIn(cards, slots),
    };
  }

  /* ======================= TriPeaks e Golf (si prende una carta vicina a quella scoperta) ======================= */
  const TP_CH = [];
  for (let p = 0; p < 3; p++) TP_CH[p] = [3 + 2 * p, 4 + 2 * p];
  for (let q = 0; q < 6; q++) { const p = q >> 1, j = q & 1; TP_CH[3 + q] = [9 + 3 * p + j, 10 + 3 * p + j]; }
  for (let q = 0; q < 9; q++) TP_CH[9 + q] = [18 + q, 19 + q];
  const tpFree = (s, i) => s.p[i] >= 0 && (i >= 18 || (s.p[TP_CH[i][0]] < 0 && s.p[TP_CH[i][1]] < 0));
  /* E per TriPeaks (p: 28 carte) e Golf (t: 7 colonne) */
  function chain(kind) {
    const golf = kind === 'golf';
    const free = s => (golf ? Z.range(7).filter(i => s.t[i].length) : Z.range(28).filter(i => tpFree(s, i)));
    const card = (s, i) => (golf ? top(s.t[i]) : s.p[i]);
    const left = s => (golf ? sum(s.t.map(a => a.length)) : s.p.filter(x => x >= 0).length);
    const E = {
      moves(P, s) {
        const w = top(s.w), out = free(s).filter(i => near(card(s, i), w, P.wrap)).map(i => ({ k: 'p', i }));
        if (s.st.length) out.push({ k: 'draw' });
        return out;
      },
      apply(P, s, m) {
        const n = golf ? { t: s.t.map(a => a.slice()), st: s.st.slice(), w: s.w.slice() } : { p: s.p.slice(), st: s.st.slice(), w: s.w.slice() };
        if (m.k === 'draw') n.w.push(n.st.pop());
        else if (golf) n.w.push(n.t[m.i].pop());
        else { n.w.push(n.p[m.i]); n.p[m.i] = -1; }
        return n;
      },
      key: s => (golf ? s.t.map(a => a.length).join('.') : s.p.map(x => (x < 0 ? '-' : 'o')).join('')) + '|' + s.st.length + '|' + top(s.w),
      score: s => -3 * left(s) + 0.8 * s.st.length,
      goal: s => left(s) === 0,
      explain(P, s, m) {
        const w = top(s.w), opts = E.moves(P, s).filter(x => x.k === 'p');
        const wrap = P.wrap ? ' (sull\'Asso va anche il Re, e sul Re l\'Asso)' : '';
        if (m.k === 'draw') return { tag: 'draw', area: ['st'], focus: ['st'],
          tip: `Nessuna carta libera è vicina a ${nm(w)}: gira una carta dal mazzo.`,
          why: `Si può prendere solo una carta di un valore in più o in meno di ${nm(w)}${wrap}, e adesso non ce n'è: dal mazzo arriva una carta nuova da cui ripartire.` };
        const c = card(s, m.i), up = rk(c) === rk(w) % 13 + 1;
        const many = opts.length > 1;
        return { tag: many ? 'plan' : 'play', area: many ? opts.map(x => card(s, x.i)) : [c], focus: [c],
          tip: many ? Z.say('Ci sono più carte che puoi prendere: scegli quella che ti lascia continuare la catena più a lungo.', 'Prima di prendere una carta, guarda cosa viene dopo: quale ti permette di proseguire meglio?')
            : `Sulla carta scoperta (${nm(w)}) puoi prendere una carta di un valore in più o in meno${wrap}. Quale?`,
          why: `${nm(c)} è un valore ${up ? 'sopra' : 'sotto'} ${nm(w)} e si può prendere.` + (many ? ' Tra le carte possibili, questa apre la catena più lunga e lascia più carte nel mazzo per dopo.' : '') +
            (!golf && free(E.apply(P, s, m)).some(x => !free(s).includes(x)) ? ' Prendendola si gira una carta coperta.' : '') };
      },
    };
    return E;
  }
  const TP = chain('tripeaks'), GF = chain('golf');
  TP.deal = opt => { const d = deck(); return { wrap: opt.wrap, start: { p: d.slice(0, 28), st: d.slice(28, 51), w: [d[51]] } }; };
  GF.deal = opt => { const d = deck(); return { wrap: opt.wrap, start: { t: Z.range(7).map(i => d.slice(i * 5, i * 5 + 5)), st: d.slice(35, 51), w: [d[51]] } }; };
  TP.progress = (P, s) => ({ ok: s.p.filter(x => x < 0).length, bad: 0 });
  GF.progress = (P, s) => ({ ok: 35 - sum(s.t.map(a => a.length)), bad: 0 });

  function chainView(golf) {
    return function (ctx) {
      const P = ctx.puzzle, E = golf ? GF : TP;
      const CW = golf ? 12.4 : 9.2, CH = CW * 1.42, slots = {};
      let pos, H;
      if (golf) {
        const G = (100 - 7 * CW) / 8, X = i => G + i * (CW + G);
        H = 2 + 4 * 5.8 + CH + 6 + CH + 2;
        pos = { card: (i, k) => [X(i), 2 + k * 5.8], st: [50 - CW - 4, 2 + 4 * 5.8 + CH + 6], w: [54, 2 + 4 * 5.8 + CH + 6] };
      } else {
        const SX = 9.8, X0 = (100 - 9 * SX - CW) / 2, SY = CH * 0.5;
        const xs = [];
        for (let q = 0; q < 10; q++) xs[18 + q] = X0 + q * SX;
        for (let q = 0; q < 9; q++) xs[9 + q] = X0 + SX / 2 + q * SX;
        for (let q = 0; q < 6; q++) xs[3 + q] = xs[TP_CH[3 + q][0]] + SX / 2;
        for (let p = 0; p < 3; p++) xs[p] = xs[TP_CH[p][0]] + SX / 2;
        const row = i => (i < 3 ? 0 : i < 9 ? 1 : i < 18 ? 2 : 3);
        H = 2 + 3 * SY + CH + 5 + CH + 2;
        pos = { card: i => [xs[i], 2 + row(i) * SY], st: [50 - CW - 4, 2 + 3 * SY + CH + 5], w: [54, 2 + 3 * SY + CH + 5] };
      }
      const T = table(golf ? 'gf' : 'tp', 100, H, CW);
      let cur = null;
      makeSlot(T, CW, CH, 'st', pos.st[0], pos.st[1], '', tap, slots).classList.add('cd-stock');
      makeSlot(T, CW, CH, 'w', pos.w[0], pos.w[1], '', tap, slots);
      const cards = makeCards(T, CW, CH, tap), place = placer(T, cards);
      function tap(t) {
        if (!cur) return;
        if (t.slot === 'st' || (t.c != null && cur.st.includes(t.c))) {
          if (cur.st.length) ctx.commit(E.apply(P, cur, { k: 'draw' })); else ctx.miss();
          return;
        }
        if (t.c == null || cur.w.includes(t.c)) return;
        const i = golf ? cur.t.findIndex(a => top(a) === t.c) : cur.p.indexOf(t.c);
        const m = i >= 0 && E.moves(P, cur).find(x => x.k === 'p' && x.i === i);
        if (m) ctx.commit(E.apply(P, cur, m)); else { ctx.miss(); Z.flashEl(cards[t.c]); }
      }
      return {
        el: T.el, aspect: 100 / H,
        render(s) {
          cur = s;
          if (golf) s.t.forEach((a, i) => a.forEach((c, k) => { const [x, y] = pos.card(i, k); place(c, x, y, 10 + k, true); cards[c].classList.toggle('dim', k < a.length - 1); }));
          else s.p.forEach((c, i) => { if (c >= 0) { const [x, y] = pos.card(i); place(c, x, y, 10 + i, tpFree(s, i)); } });
          s.st.forEach((c, k) => place(c, pos.st[0], pos.st[1], 100 + k, false));
          s.w.forEach((c, k) => { place(c, pos.w[0], pos.w[1], 200 + k, true); cards[c].classList.remove('dim'); });
          slots.st.classList.toggle('none', !s.st.length);
        },
        flash: flashIn(cards, slots),
      };
    };
  }

  /* ---------- registrazione dei cinque giochi ---------- */
  const ICON = (a, b) => `<svg viewBox="0 0 64 64"><rect x="${a}" y="12" width="26" height="36" rx="5" class="ic-s ic-st" transform="rotate(-10 ${a + 13} 30)"/><rect x="${b}" y="16" width="26" height="36" rx="5" class="ic-a"/><text x="${b + 13}" y="40" class="ic-t ic-w">♥${VS}</text></svg>`;
  function reg(o) {
    const E = o.E;
    Z.register({
      id: o.id, name: o.name, hue: o.hue, tagline: o.tagline, rules: o.rules, options: o.options,
      family: 'solitari', random: true, hintCap: 400,
      icon: o.icon || ICON(12, 26),
      /* si danno solo smazzate che si possono vincere: si cerca la strada prima (di solito nel worker) */
      generate(opt) {
        let P = null;
        for (let t = 0; t < 150; t++) {
          P = Object.assign(E.deal(opt), { kind: o.id });
          const r = search(E, P, Z.clone(P.start), o.ms || 1200, o.max || 120000);
          if (r.win) { P.sol = r.path; return P; }
        }
        return P;
      },
      init: P => Z.clone(P.start),
      solved: (P, s) => E.goal(s),
      progress: E.progress,
      hint(P, s) {
        if (E.goal(s)) return null;
        const r = nextMove(E, P, s);
        if (!r) return null;
        const x = E.explain(P, s, r.m);
        return Object.assign(x, { state: E.apply(P, s, r.m), why: x.why + (r.sure ? '' : NOTSURE) });
      },
      /* niente suggerimento: perché */
      stuck: (P, s) => (E.moves(P, s, false).length ? STUCK_LOST() : STUCK_NONE()),
      /* per il mini rompicapo del quiz: una smazzata che si può vincere */
      winnable(P) { const r = search(E, P, Z.clone(P.start), 400, 80000); return r.win; },
      _check(P) {
        const s = P.start, all = [];
        if (s.t) s.t.forEach(a => all.push(...a));
        if (s.p) all.push(...s.p);
        all.push(...(s.st || []), ...(s.w || []));
        return new Set(all).size === 52 && all.length === 52 ? '' : 'mazzo sbagliato';
      },
      view: o.view,
      _E: E,
    });
  }
  const COMMON = '<p>Le carte sono francesi: <b>A</b> (Asso) vale 1, <b>J</b> (Fante) 11, <b>Q</b> (Donna) 12, <b>K</b> (Re) 13. Le carte sono mescolate a caso, ma ogni partita <b>si può vincere</b>: se ti blocchi, annulla qualche mossa o chiedi un suggerimento.</p>';
  const TAP = '<p>Tocca una carta per prenderla (si colora) e poi tocca dove metterla. Toccala <b>due volte</b> per mandarla da sola dove può andare.</p>';
  reg({
    id: 'klondike', name: 'Solitario classico', hue: 130, E: KL, view: klView,
    tagline: 'Sette colonne, quattro semi, un mazzo da girare.',
    options: [{ id: 'draw', label: 'Dal mazzo si girano', def: 1, choices: [
      { v: 1, label: 'Una carta', help: 'Si gira una carta alla volta: più tranquillo.' },
      { v: 3, label: 'Tre carte', help: 'Si girano tre carte alla volta e si usa solo quella in cima: più impegnativo.' }] }],
    rules: `<p>Porta tutte le carte sulle <b>quattro pile dei semi</b>, in alto a destra: ogni pila parte dall'<b>Asso</b> e sale fino al <b>Re</b>, sempre dello stesso seme.</p>
      <p>Nelle sette colonne le carte scendono di un valore alla volta, <b>alternando i colori</b> (rosso su nero, nero su rosso). Puoi spostare anche un gruppo ordinato. Quando liberi una carta coperta, si gira. In una colonna vuota può andare solo un <b>Re</b>.</p>
      <p>Tocca il mazzo in alto a sinistra per girare una carta; quando finisce, toccalo di nuovo per rigirare gli scarti.</p>` + TAP + COMMON,
  });
  reg({
    id: 'freecell', name: 'FreeCell', hue: 205, E: FC, view: fcView,
    tagline: 'Tutte le carte scoperte e qualche cella libera.',
    options: [{ id: 'cells', label: 'Celle libere', def: 4, choices: [
      { v: 4, label: '4 celle', help: 'Quattro celle: quasi ogni partita si può vincere.' },
      { v: 3, label: '3 celle', help: 'Tre celle: serve più attenzione.' },
      { v: 2, label: '2 celle', help: 'Due celle: per chi ama pensare a lungo.' }] }],
    rules: `<p>Tutte le carte sono <b>scoperte</b>. Portale sulle <b>quattro pile dei semi</b>, in alto a destra, dall'<b>Asso</b> al <b>Re</b>.</p>
      <p>Nelle colonne una carta va su un'altra di <b>colore diverso</b> e di un valore in più. Le <b>celle</b> in alto a sinistra tengono una carta ciascuna, per metterla da parte. In una colonna vuota può andare qualsiasi carta.</p>
      <p>Puoi spostare un gruppo ordinato se hai abbastanza celle e colonne vuote per farlo una carta alla volta.</p>` + TAP + COMMON,
  });
  reg({
    id: 'pyramid', name: 'Piramide', hue: 40, E: PY, view: pyView, ms: 250, max: 40000,
    tagline: 'Coppie che fanno 13, dalla cima in giù.',
    icon: `<svg viewBox="0 0 64 64"><rect x="24" y="8" width="16" height="22" rx="3" class="ic-a"/><rect x="14" y="22" width="16" height="22" rx="3" class="ic-s ic-st"/><rect x="34" y="22" width="16" height="22" rx="3" class="ic-s ic-st"/><rect x="4" y="36" width="16" height="22" rx="3" class="ic-s ic-st"/><rect x="24" y="36" width="16" height="22" rx="3" class="ic-a"/><rect x="44" y="36" width="16" height="22" rx="3" class="ic-s ic-st"/></svg>`,
    options: [{ id: 'passes', label: 'Giri del mazzo', def: 0, choices: [
      { v: 0, label: 'Senza limiti', help: 'Puoi rigirare il mazzo tutte le volte che vuoi.' },
      { v: 3, label: 'Tre', help: 'Puoi passare il mazzo tre volte.' },
      { v: 1, label: 'Uno', help: 'Il mazzo si passa una volta sola.' }] }],
    rules: `<p>Togli tutte le carte della <b>piramide</b> facendo <b>coppie che sommano 13</b>: Asso e Donna, 2 e Fante, 3 e 10, 4 e 9, 5 e 8, 6 e 7. Il <b>Re</b> vale 13 e si toglie da solo.</p>
      <p>Si possono usare solo le carte <b>libere</b>, cioè non coperte da altre carte sotto di loro, e la carta in cima agli <b>scarti</b>. Tocca il mazzo per girare una carta nuova.</p>
      <p>Tocca una carta e poi la sua compagna: se fanno 13, spariscono.</p>` + COMMON,
  });
  reg({
    id: 'tripeaks', name: 'TriPeaks', hue: 285, E: TP, view: chainView(false),
    tagline: 'Tre cime da scalare, una carta vicina all\'altra.',
    icon: `<svg viewBox="0 0 64 64"><path d="M4 50L18 20l14 30M32 50l14-30 14 30" class="ic-l2"/><rect x="11" y="10" width="14" height="19" rx="3" class="ic-a"/><rect x="39" y="10" width="14" height="19" rx="3" class="ic-a"/><rect x="25" y="34" width="14" height="19" rx="3" class="ic-s ic-st"/></svg>`,
    options: [{ id: 'wrap', label: 'Re e Asso vicini', def: 1, choices: [
      { v: 1, label: 'Re e Asso sì', help: 'Sull\'Asso puoi prendere il Re e sul Re l\'Asso: più facile.' },
      { v: 0, label: 'Re e Asso no', help: 'L\'Asso e il Re non si toccano: più impegnativo.' }] }],
    rules: `<p>Libera le <b>tre cime</b> di carte. Puoi prendere una carta scoperta se vale <b>uno in più o uno in meno</b> della carta girata in basso: diventa lei la nuova carta da cui ripartire. Il colore e il seme non contano.</p>
      <p>Le carte coperte si girano quando le carte sotto di loro sono state prese. Quando non puoi prendere niente, tocca il <b>mazzo</b> per girare una carta nuova.</p>
      <p>Il segreto è fare catene lunghe: prima di prendere una carta, guarda che cosa ti lascia dopo.</p>` + COMMON,
  });
  reg({
    id: 'golf', name: 'Golf', hue: 95, E: GF, view: chainView(true),
    tagline: 'Sette colonne da svuotare, una carta vicina all\'altra.',
    icon: `<svg viewBox="0 0 64 64"><rect x="6" y="8" width="14" height="19" rx="3" class="ic-s ic-st"/><rect x="25" y="8" width="14" height="19" rx="3" class="ic-s ic-st"/><rect x="44" y="8" width="14" height="19" rx="3" class="ic-s ic-st"/><rect x="6" y="16" width="14" height="19" rx="3" class="ic-a"/><rect x="25" y="16" width="14" height="19" rx="3" class="ic-a"/><rect x="44" y="16" width="14" height="19" rx="3" class="ic-a"/><path d="M32 40v16M32 40l10 4-10 4" class="ic-l2"/></svg>`,
    options: [{ id: 'wrap', label: 'Re e Asso vicini', def: 0, choices: [
      { v: 1, label: 'Re e Asso sì', help: 'Sull\'Asso puoi prendere il Re e sul Re l\'Asso: più facile.' },
      { v: 0, label: 'Re e Asso no', help: 'Come nel Golf classico: sul Re non si prende niente.' }] }],
    rules: `<p>Svuota le <b>sette colonne</b>. Puoi prendere l'ultima carta di una colonna se vale <b>uno in più o uno in meno</b> della carta girata in basso: diventa lei la nuova carta da cui ripartire. Il colore e il seme non contano.</p>
      <p>Quando non puoi prendere niente, tocca il <b>mazzo</b> per girare una carta nuova. Il mazzo si passa una volta sola.</p>
      <p>Il segreto è fare catene lunghe: prima di prendere una carta, guarda che cosa ti lascia dopo.</p>` + COMMON,
  });
  Z.CARDS = { search, nextMove, KL, FC, PY, TP, GF };
})();
