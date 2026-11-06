/* Rompicapo Zen — pagine del Percorso: elenco dei giochi (ognuno si sblocca dopo Z.Stats.UNLOCK partite finite),
   resoconto di un gioco (frasi gentili + numeri e andamento) e «Rivedi la partita» mossa per mossa.
   I dati vengono da js/stats.js e restano solo su questo dispositivo, separati per ogni rompicapo. */
(function () {
  'use strict';
  const Z = window.Zen, h = Z.h, S = Z.Stats;
  const LOCK = '<svg viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  const PATH = '<svg viewBox="0 0 24 24"><path d="M5 20c0-5 4-5 7-8s2-7 7-8"/><circle cx="5" cy="20" r="1.6"/><circle cx="19" cy="4" r="1.6"/></svg>';
  const PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5l11 7-11 7z"/></svg>';
  const PAUSE = '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>';
  const NEXT = '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>';
  const PREV = '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>';

  const pct = x => Math.round(x * 100) + '%';
  const sec = ms => { const s = Math.round(ms / 1000); return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min${s % 60 ? ' ' + (s % 60) + ' s' : ''}`; };
  const sec1 = ms => (ms / 1000).toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' s';
  const day = t => new Date(t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + ', ' + new Date(t).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  const left = id => Math.max(0, S.UNLOCK - S.finished(id).length);
  const anyOpen = () => Z.ORDER.some(id => S.unlocked(id));

  /* ---------- tasto nel menu ---------- */
  function homeButton() {
    const open = anyOpen();
    const best = Z.ORDER.map(left).reduce((a, b) => Math.min(a, b), S.UNLOCK);
    const b = h('button.prop-btn.pc-btn' + (open ? '' : '.locked'), { type: 'button', 'aria-label': open ? 'Percorso' : 'Percorso, bloccato' },
      h('span.prop-ic', { html: open ? PATH : LOCK }),
      h('span', null, h('b', { text: 'Percorso' }),
        h('small', { text: open ? 'Come giochi, gioco per gioco, e cosa allenare' : `Si sblocca dopo ${S.UNLOCK} partite finite a un gioco: ${best === 1 ? 'te ne manca 1' : 'te ne mancano ' + best}` })));
    b.addEventListener('click', () => (open ? list() : lockedSheet()));
    return b;
  }
  function lockedSheet() {
    const rows = Z.ORDER.map(id => ({ id, n: S.finished(id).length })).sort((a, b) => b.n - a.n).slice(0, 5);
    Z.ui.openSheet([
      h('div.sheet-head', null, h('div.card-ic.pc-lock', { html: LOCK }), h('h2', { text: 'Percorso' })),
      h('p.rules', { text: `Il Percorso impara come giochi: ogni rompicapo si sblocca dopo ${S.UNLOCK} partite finite. Durante il gioco non vedrai niente, nessun timer: raccolgo i dati in silenzio, e restano solo su questo dispositivo.` }),
      h('div.pc-mini', null, ...rows.map(r => progressRow(r.id))),
      h('div.sheet-actions', null, h('button.btn.primary', { type: 'button', text: 'Ho capito', on: { click: Z.ui.closeOverlay } })),
    ]);
  }
  function progressRow(id) {
    const G = Z.GAMES[id], n = Math.min(S.UNLOCK, S.finished(id).length);
    return h('div.pc-prow', { style: { '--h': G.hue } },
      h('span', { text: G.name }), h('span.pc-bar', null, h('i', { style: { width: (n / S.UNLOCK * 100) + '%' } })), h('small', { text: `${n} di ${S.UNLOCK}` }));
  }

  function page(title, sub, back) {
    Z.ui.closeOverlay();
    const screen = Z.ui.screen;
    screen.innerHTML = '';
    screen.className = 'home percorso';
    screen.style.removeProperty('--h');
    window.scrollTo(0, 0);
    screen.append(h('header.topbar.pc-top', null,
      h('button.icon-btn', { type: 'button', 'aria-label': 'Indietro', html: Z.ICONS.back, on: { click: back } }),
      h('div.pc-title', null, h('h1', { text: title }), sub ? h('p.sub', { text: sub }) : null)));
    return screen;
  }

  /* ---------- elenco dei giochi ---------- */
  function list() {
    const screen = page('Percorso', 'Come giochi, gioco per gioco', () => Z.ui.home());
    if (ios && !standalone()) screen.append(h('p.pc-note', { text: 'Consiglio: aggiungi il gioco alla schermata Home (Condividi → Aggiungi alla schermata Home). Così Safari non cancella i tuoi dati se non giochi per qualche giorno.' }));
    const grid = h('div.cards');
    /* prima i giochi sbloccati, poi quelli più vicini allo sblocco */
    const order = Z.ORDER.slice().sort((a, b) => S.finished(b).length - S.finished(a).length);
    order.forEach((id, k) => {
      const G = Z.GAMES[id], fin = S.finished(id), open = fin.length >= S.UNLOCK;
      const a = open ? agg(fin.slice(-10)) : null;
      const card = h('button.card.pc-card' + (open ? '' : '.locked'), { type: 'button', style: { '--h': G.hue, '--k': k }, 'aria-disabled': open ? null : 'true' },
        h('div.card-ic', { html: G.icon }),
        h('div.card-tx', null, h('h2', { text: G.name }),
          open ? h('p', { text: `${fin.length} partite · ${a.prec == null ? '' : pct(a.prec) + ' mosse giuste'}` })
            : h('div.pc-lockline', null, h('span.pc-bar', null, h('i', { style: { width: (fin.length / S.UNLOCK * 100) + '%' } })), h('small', { text: `${fin.length} di ${S.UNLOCK} partite` }))),
        open ? null : h('span.pc-lockic', { html: LOCK }));
      if (open) card.addEventListener('click', () => report(id));
      grid.append(card);
    });
    screen.append(grid, h('p.foot', { text: 'I dati restano solo su questo dispositivo e non si mescolano tra un gioco e l\'altro.' }));
  }

  /* ---------- numeri di un gruppo di partite (quelle del Percorso pesano il doppio) ---------- */
  function agg(gs) {
    const A = { w: 0, n: 0, ok: 0, err: 0, away: 0, undo: 0, re: 0, hint: 0, pz: 0, pzOk: 0, dur: 0 };
    for (const g of gs) {
      const w = g.src === 'percorso' ? 2 : 1;
      A.w += w;
      for (const k of ['n', 'ok', 'err', 'away', 'undo', 're', 'hint', 'pz', 'pzOk', 'dur']) A[k] += (g[k] || 0) * w;
    }
    const den = A.ok + A.err + A.away;
    return {
      games: gs.length, prec: den ? A.ok / den : null, spm: A.n ? A.dur / A.n : 0, dur: A.w ? A.dur / A.w : 0,
      hints: A.w ? A.hint / A.w : 0, doubts: A.w ? (A.err + A.away + A.undo + A.re + A.hint) / A.w : 0,
      changes: A.w ? (A.undo + A.re) / A.w : 0, pz: A.pz, pzOk: A.pzOk,
    };
  }
  /* ragionamento più difficile: dubbi / volte in cui serviva */
  function weakest(id) {
    const W = Z.store.get('weak:' + id, null), T = S.TAGS[id] || {};
    if (!W) return [];
    return Object.keys(T).map(t => ({ t, name: T[t][0], tip: T[t][1], d: W.doubt[t] || 0, need: W.need[t] || 0 }))
      .filter(x => x.need >= 2).map(x => Object.assign(x, { r: x.d / x.need })).sort((a, b) => b.r - a.r);
  }
  function words(id) {
    const fin = S.finished(id), A = agg(fin.slice(-10)), good = [], train = [];
    if (A.prec != null && A.prec >= 0.9) good.push('Le tue mosse sono molto precise: quasi sempre vanno dritte verso la soluzione.');
    else if (A.prec != null && A.prec >= 0.8) good.push('La gran parte delle tue mosse è giusta.');
    if (A.hints < 0.3) good.push('Risolvi quasi sempre in autonomia, senza suggerimenti.');
    if (A.pz >= 3 && A.pzOk / A.pz >= 0.6) good.push('Quando ti fermi a pensare, dopo arriva quasi sempre la mossa giusta: il tuo ragionamento funziona.');
    if (fin.length >= 8) {
      const e = agg(fin.slice(0, 4)), l = agg(fin.slice(-4));
      if (e.spm && l.spm && (e.spm - l.spm) / e.spm >= 0.15) good.push(`Rispetto alle prime partite ti serve il ${Math.round((e.spm - l.spm) / e.spm * 100)}% di tempo in meno per ogni mossa.`);
      if (e.prec != null && l.prec != null && l.prec - e.prec >= 0.05) good.push('Rispetto alle prime partite sbagli meno mosse.');
    }
    const wk = weakest(id);
    const avg = wk.length ? wk.reduce((a, x) => a + x.r, 0) / wk.length : 0;
    if (wk.length && wk[0].d >= 2 && wk[0].r > Math.max(0.15, avg * 1.2)) train.push(`Fai un po' più fatica quando serve ${wk[0].name}. ${wk[0].tip}`);
    if (A.prec != null && A.prec < 0.75) train.push('Ogni tanto una mossa va nella direzione sbagliata: prima di confermarla, cerca un motivo sicuro.');
    if (A.changes > 3) train.push('Cambi idea abbastanza spesso: quando hai un dubbio, cerca una conferma prima di muovere.');
    if (A.hints > 1.5) train.push('Usi spesso il Suggerimento: leggi con calma la spiegazione, è lo stesso ragionamento che servirà le prossime volte.');
    if (!good.length) good.push('Stai costruendo il tuo modo di giocare: ogni partita aiuta.');
    if (!train.length) train.push('Non vedo punti deboli chiari: prova pure una difficoltà più alta.');
    return { good: good.slice(0, 3), train: train.slice(0, 2), A, wk };
  }

  /* ---------- grafico: una serie, partita per partita (tocca un punto per il valore) ---------- */
  function chart(title, vals, fmt, fixed) {
    if (vals.length < 2) return null;
    const W = 320, H = 120, L = 40, R = 12, T = 12, B = 22;
    let lo = Math.min(...vals), hi = Math.max(...vals);
    if (fixed) { lo = fixed[0]; hi = fixed[1]; }
    if (hi - lo < 1e-9) { hi += 1; lo = Math.max(0, lo - 1); }
    const x = i => L + i * (W - L - R) / (vals.length - 1), y = v => T + (hi - v) / (hi - lo) * (H - T - B);
    const svg = Z.s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'pc-chart', role: 'img', 'aria-label': title });
    for (const v of [lo, (lo + hi) / 2, hi]) {
      Z.s('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'pc-grid' }, svg);
      Z.s('text', { x: L - 6, y: y(v) + 3.5, class: 'pc-ax', 'text-anchor': 'end' }, svg).textContent = fmt(v);
    }
    Z.s('text', { x: L, y: H - 6, class: 'pc-ax' }, svg).textContent = 'prima';
    Z.s('text', { x: W - R, y: H - 6, class: 'pc-ax', 'text-anchor': 'end' }, svg).textContent = 'ultima';
    Z.s('path', { d: vals.map((v, i) => (i ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1)).join(' '), class: 'pc-line' }, svg);
    const tip = h('p.pc-tip', { text: 'Tocca un punto per vedere il valore.' });
    const dots = vals.map((v, i) => Z.s('circle', { cx: x(i), cy: y(v), r: 4, class: 'pc-dot' }, svg));
    vals.forEach((v, i) => {
      const hit = Z.s('circle', { cx: x(i), cy: y(v), r: 13, class: 'pc-hit' }, svg);
      const show = () => { dots.forEach((d, k) => d.classList.toggle('on', k === i)); tip.textContent = `Partita ${i + 1} di ${vals.length}: ${fmt(v)}`; };
      hit.addEventListener('pointerenter', show);
      hit.addEventListener('click', show);
    });
    return h('figure.pc-fig', null, h('figcaption', { text: title }), svg, tip);
  }

  /* ---------- resoconto di un gioco ---------- */
  function report(id) {
    const G = Z.GAMES[id];
    const screen = page(G.name, 'Resoconto', list);
    screen.style.setProperty('--h', G.hue);
    const all = S.games(id), fin = all.filter(g => g.done), W = words(id), A = W.A;
    const box = h('section.pc-words', { style: { '--h': G.hue } },
      h('div.pc-wh', null, h('div.card-ic', { html: G.icon }), h('h2', { text: 'In breve' })),
      h('h3', { text: 'I tuoi punti forti' }), h('ul', null, ...W.good.map(t => h('li', { text: t }))),
      h('h3', { text: 'Da allenare' }), h('ul', null, ...W.train.map(t => h('li', { text: t }))));
    const last = fin.slice(-20);
    const tiles = [
      ['Partite finite', String(fin.length) + (all.length > fin.length ? ` (+${all.length - fin.length} lasciate)` : '')],
      ['Tempo medio', sec(A.dur)],
      ['Per ogni mossa', sec1(A.spm)],
      ['Mosse giuste', A.prec == null ? '—' : pct(A.prec)],
      ['Dubbi a partita', A.doubts.toLocaleString('it-IT', { maximumFractionDigits: 1 })],
      ['Suggerimenti a partita', A.hints.toLocaleString('it-IT', { maximumFractionDigits: 1 })],
    ];
    const precVals = last.map(g => { const d = g.ok + g.err + g.away; return d ? g.ok / d : null; }).filter(v => v != null);
    const more = h('details.pc-more', null, h('summary', { text: 'I numeri' }),
      h('p.pc-help', { text: 'Ultime 10 partite. «Dubbi» sono le mosse sbagliate o che si allontanano dalla soluzione, i ripensamenti, Annulla e i suggerimenti. I tocchi corretti subito non contano.' }),
      h('div.pc-tiles', null, ...tiles.map(([k, v]) => h('div.pc-tile', null, h('b', { text: v }), h('small', { text: k })))),
      chart('Mosse giuste, partita per partita', precVals, v => pct(v), [0, 1]),
      chart('Secondi per mossa, partita per partita', last.filter(g => g.n).map(g => g.dur / g.n / 1000), v => v.toLocaleString('it-IT', { maximumFractionDigits: 1 }) + ' s'),
      W.wk.length ? h('div.pc-tags', null, h('h3', { text: 'Ragionamenti' }),
        ...W.wk.map(x => h('div.pc-trow', null, h('span', { text: x.name[0].toUpperCase() + x.name.slice(1) }),
          h('span.pc-bar.warn', null, h('i', { style: { width: Math.min(100, x.r * 100) + '%' } })),
          h('small', { text: x.r < 0.05 ? 'sicuro' : x.r < 0.25 ? 'qualche dubbio' : 'da allenare' })))) : null);
    const reps = Z.store.get('replay:' + id, []);
    const games = h('section.pc-games', null, h('h3', { text: 'Le ultime partite' }),
      ...all.slice(-8).reverse().map(g => {
        const k = reps.findIndex(r => r.pid === g.pid), d = g.ok + g.err + g.away;
        return h('div.pc-grow', null,
          h('div', null, h('b', { text: day(g.d) }),
            h('small', { text: [g.opt ? Z.optsSummary(G, g.opt) : '', sec(g.dur), d ? pct(g.ok / d) + ' giuste' : '', g.done ? '' : 'lasciata a metà', g.src === 'percorso' ? 'Percorso' : ''].filter(Boolean).join(' · ') })),
          k >= 0 ? h('button.btn', { type: 'button', text: 'Rivedi', on: { click: () => replay(id, k) } }) : null);
      }));
    screen.append(box, more, games);
  }

  /* ---------- rivedi la partita ---------- */
  const STEP = {
    ok: 'Mossa giusta', err: 'Mossa sbagliata', away: 'Mossa che si allontana dalla soluzione', fix: 'Correzione', neu: 'Mossa',
  };
  function label(id, st) {
    if (st.s) return 'Tocco corretto subito: non conta';
    let t = st.k === 'h' ? 'Suggerimento' : st.k === 'u' ? 'Annulla' : st.k === 'r' ? 'Ripristina' : st.k === 'x' ? 'Tentativo non riuscito' : STEP[st.e] || 'Mossa';
    const extra = [];
    if (st.p) extra.push('dopo una pausa di ' + sec(st.t * 100));
    if (st.r) extra.push('torni a una situazione già vista');
    const T = S.TAGS[id] || {};
    if (st.g && T[st.g] && S.isDoubt(st)) extra.push('serviva ' + T[st.g][0]);
    return t + (extra.length ? ' · ' + extra.join(' · ') : '');
  }
  const NO_FLASH = new Set(['wordsearch', 'hashi', 'maze', 'lights']);
  function replay(id, k) {
    const G = Z.GAMES[id], rep = Z.store.get('replay:' + id, [])[k];
    if (!rep) return;
    const P = rep.P;
    const states = [rep.s0];
    for (const st of rep.steps) states.push(st.d ? S.patch(states[states.length - 1], st.d) : states[states.length - 1]);
    Z.ui.closeOverlay();
    Z.ui.applyTheme(Z.themeById(P.theme));
    const screen = Z.ui.screen;
    screen.innerHTML = '';
    screen.className = 'game replay';
    screen.style.removeProperty('--h');
    let cur = states[0], at = 0, timer = 0;
    const wrap = h('div.board-wrap');
    const ctx = { board: wrap, controls: h('div'), get puzzle() { return P; }, get state() { return cur; },
      commit() {}, preview() {}, begin() {}, end() {}, mark() {}, miss() {} };
    const view = G.view(ctx);
    view.el.classList.add('board', 'pc-ro');
    wrap.append(view.el);
    const info = h('p.rp-info');
    const when = h('p.rp-when');
    const tl = h('div.rp-tl', { 'aria-hidden': 'true' });
    rep.steps.forEach((st, i) => {
      const cls = st.s ? 'slip' : S.isDoubt(st) ? 'doubt' : st.k === 'm' && st.e === 'ok' ? 'ok' : 'neu';
      tl.append(h('i.' + cls, { on: { click: () => go(i + 1) } }));
    });
    const range = h('input.rp-range', { type: 'range', min: 0, max: rep.steps.length, value: 0, 'aria-label': 'Mossa' });
    range.addEventListener('input', () => go(+range.value));
    const bPrev = h('button.tool', { type: 'button', 'aria-label': 'Mossa prima', html: PREV + '<span>Prima</span>', on: { click: () => go(at - 1) } });
    const bPlay = h('button.tool', { type: 'button', 'aria-label': 'Riproduci', html: PLAY + '<span>Riproduci</span>' });
    const bNext = h('button.tool', { type: 'button', 'aria-label': 'Mossa dopo', html: NEXT + '<span>Dopo</span>', on: { click: () => go(at + 1) } });
    const bDoubt = h('button.tool', { type: 'button', 'aria-label': 'Prossimo dubbio', html: Z.ICONS.hint + '<span>Dubbio dopo</span>', on: { click: () => {
      const j = rep.steps.findIndex((st, i) => i >= at && S.isDoubt(st));
      go(j >= 0 ? j + 1 : rep.steps.length);
    } } });
    const stop = () => { clearInterval(timer); timer = 0; bPlay.innerHTML = PLAY + '<span>Riproduci</span>'; };
    bPlay.addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (at >= rep.steps.length) go(0);
      bPlay.innerHTML = PAUSE + '<span>Pausa</span>';
      timer = setInterval(() => { if (!screen.contains(bPlay) || at >= rep.steps.length) { stop(); return; } go(at + 1); }, 700);
    });
    /* evidenzia cosa è cambiato (dove l'indice nello stato è lo stesso del Suggerimento) */
    function flash(st) {
      if (!view.flash || NO_FLASH.has(id) || !st.d) return;
      const f = [...new Set(st.d.filter(([p]) => p.length >= 2).map(([p]) => +p[1]).filter(x => x === x))];
      if (f.length && f.length < 12) try { view.flash(f); } catch (e) { /* niente */ }
    }
    function go(i) {
      at = Math.max(0, Math.min(rep.steps.length, i));
      cur = states[at];
      view.render(cur);
      range.value = at;
      [...tl.children].forEach((e, j) => e.classList.toggle('at', j === at - 1));
      if (!at) { info.textContent = 'Inizio della partita'; when.textContent = `${rep.steps.length} passi · tocca la striscia o usa i tasti`; return; }
      const st = rep.steps[at - 1];
      flash(st);
      info.textContent = label(id, st);
      info.className = 'rp-info ' + (st.s ? 'slip' : S.isDoubt(st) ? 'doubt' : st.e === 'ok' ? 'ok' : '');
      when.textContent = `Passo ${at} di ${rep.steps.length} · ${sec1(st.t * 100)}`;
    }
    const bar = h('header.gbar', null,
      h('button.icon-btn', { type: 'button', 'aria-label': 'Torna al resoconto', html: Z.ICONS.back, on: { click: () => { stop(); Z.ui.applyTheme(Z.themeById(Z.store.get('homeTheme', 'giardino'))); report(id); } } }),
      h('div.gtitle', null, h('b', { text: G.name }), h('span', { text: 'Rivedi la partita · ' + day(rep.d) })),
      h('span.rp-sp'));
    const legend = h('div.rp-legend', null, h('span', null, h('i.ok'), 'giusta'), h('span', null, h('i.doubt'), 'dubbio'), h('span', null, h('i.neu'), 'altro'));
    screen.append(bar, wrap, h('div.rp-ctl', null, info, when, tl, range, legend), h('nav.toolbar.rp-tools', null, bPrev, bPlay, bNext, bDoubt));
    const fit = () => {
      if (!wrap.isConnected) { window.removeEventListener('resize', fit); return; }
      const r = wrap.getBoundingClientRect(), a = view.aspect || 1;
      let w = Math.min(r.width - 8, 680), hh = w / a;
      if (hh > r.height - 8) { hh = r.height - 8; w = hh * a; }
      view.el.style.width = Math.floor(w) + 'px';
      view.el.style.height = Math.floor(hh) + 'px';
    };
    window.addEventListener('resize', fit);
    fit();
    requestAnimationFrame(fit);
    go(0);
  }

  Z.Percorso = { homeButton, list, report, replay };
})();
