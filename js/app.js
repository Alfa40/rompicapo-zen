/* Rompicapo Zen — schermate, temi, salvataggi, annulla/ripristina */
(function () {
  'use strict';
  const Z = window.Zen, h = Z.h;
  const root = document.documentElement;
  const screen = document.getElementById('screen');
  const overlay = document.getElementById('overlay');
  const bg = document.getElementById('bg');

  const PHRASES = [
    'Respira. Hai trovato l\'ordine nel caos.',
    'Un passo alla volta, come l\'acqua che scava la pietra.',
    'La mente calma vede lontano.',
    'Ogni nodo si scioglie con pazienza.',
    'Il silenzio ha fatto la sua parte.',
    'Semplice, come un sasso nel ruscello.',
    'Hai ascoltato la logica, e lei ti ha risposto.',
    'Il vento passa, la montagna resta.',
  ];

  /* Dai 3 livelli alla difficoltà personalizzata: una sola partita salvata per gioco */
  if (!Z.store.get('opzioni-v3', false)) {
    for (const id of Z.ORDER) {
      let save = null, done = 0;
      for (const lv of ['normal', 'easy', 'hard']) {
        save = save || Z.store.get(`save:${id}:${lv}`, null);
        done += Z.store.get(`done:${id}:${lv}`, 0);
        Z.store.del(`save:${id}:${lv}`); Z.store.del(`done:${id}:${lv}`);
      }
      if (save && !Z.store.get(`save:${id}`, null)) Z.store.set(`save:${id}`, save);
      if (done) Z.store.set(`done:${id}`, Z.store.get(`done:${id}`, 0) + done);
    }
    Z.store.set('opzioni-v3', true);
  }

  /* ---------- Rompicapo preparati in anticipo ----------
     Per ogni gioco (tranne il Sudoku, che è immediato) si tengono pronti fino a 10 rompicapo
     con le impostazioni scelte; quando ne restano 5 se ne preparano altri 5.
     Il lavoro avviene in un thread separato, quindi il gioco non si blocca. */
  const QUEUE_MAX = 10, QUEUE_LOW = 5, NO_QUEUE = new Set(['sudoku']);
  const optKey = o => JSON.stringify(o);
  function queueOf(id, o) {
    const q = Z.store.get('queue:' + id, null);
    return q && q.key === optKey(o) ? q.list : [];
  }
  function queueSave(id, o, list) {
    if (Z.store.set('queue:' + id, { key: optKey(o), list })) return;
    /* spazio del browser esaurito: se ne tengono meno */
    while (list.length > 1) {
      list = list.slice(0, list.length >> 1);
      if (Z.store.set('queue:' + id, { key: optKey(o), list })) return;
    }
  }
  /* prende un rompicapo pronto, se c'è */
  function queueTake(id, o) {
    if (NO_QUEUE.has(id)) return null;
    const list = queueOf(id, o);
    if (!list.length) return null;
    const P = list.shift();
    queueSave(id, o, list);
    return P;
  }
  let worker = null, workerOff = false, working = null;
  const filling = {};
  function prefetch() {
    if (working || workerOff) return;
    if (!worker) {
      try { worker = new Worker('js/worker.js'); } catch (e) { workerOff = true; return; } /* es. aperto da file */
      worker.onerror = () => { workerOff = true; working = null; worker.terminate(); worker = null; };
      worker.onmessage = e => {
        const d = e.data;
        if (d.P) {
          const o = Z.getOpts(d.id);
          if (optKey(o) === d.key) {
            const list = queueOf(d.id, o);
            list.push(d.P);
            queueSave(d.id, o, list);
          }
        }
        if (d.done) { working = null; prefetch(); }
      };
    }
    /* prima il gioco aperto, poi gli altri */
    const order = Z.ORDER.slice().sort((a, b) => (b === currentId) - (a === currentId));
    for (const id of order) {
      if (NO_QUEUE.has(id)) continue;
      const o = Z.getOpts(id), key = optKey(o), n = queueOf(id, o).length;
      /* scesi a 5 (o mai riempiti): si riempie fino a 10, un rompicapo alla volta */
      if (n <= QUEUE_LOW) filling[id] = key;
      if (filling[id] !== key || n >= QUEUE_MAX) { if (n >= QUEUE_MAX) delete filling[id]; continue; }
      working = id;
      worker.postMessage({ id, opt: o, key, n: 1 });
      return;
    }
  }
  let currentId = null;

  /* ---------- Tema chiaro/scuro ---------- */
  const MODES = ['auto', 'light', 'dark'];
  let mode = Z.store.get('mode', 'auto');
  function applyMode() {
    if (mode === 'auto') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
  }
  function modeButton() {
    const label = { auto: 'Tema automatico', light: 'Tema chiaro', dark: 'Tema scuro' };
    const b = h('button.icon-btn', { type: 'button', title: label[mode], 'aria-label': label[mode], html: Z.ICONS[mode === 'auto' ? 'auto' : mode === 'light' ? 'sun' : 'moon'] });
    b.addEventListener('click', () => {
      mode = MODES[(MODES.indexOf(mode) + 1) % 3];
      Z.store.set('mode', mode);
      applyMode();
      const nb = modeButton();
      b.replaceWith(nb);
    });
    return b;
  }
  applyMode();

  /* ---------- Tema visivo della partita ---------- */
  const MOTIFS = {
    leaf: '<path d="M12 2C5 6 3 13 6 21c9-2 13-9 6-19z"/><path d="M6 21C8 15 10 10 12 2" class="m-vein"/>',
    petal: '<path d="M12 3c5 4 5 11 0 18-5-7-5-14 0-18z"/>',
    wave: '<path d="M2 13c3-4 6-4 9 0s6 4 9 0" class="m-stroke"/><path d="M5 18c2-2.5 4-2.5 6 0" class="m-stroke"/>',
    star: '<path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2z"/>',
    cloud: '<path d="M7 18h10a4 4 0 0 0 .4-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18z"/>',
    firefly: '<circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="9" class="m-halo"/>',
  };
  function applyTheme(t) {
    root.style.setProperty('--h', t.h);
    root.style.setProperty('--h2', t.h2);
    bg.innerHTML = '';
    bg.append(h('div.blob.b1'), h('div.blob.b2'), h('div.blob.b3'));
    const svgM = MOTIFS[t.motif];
    for (let k = 0; k < 11; k++) {
      const m = h('div.motif', { html: `<svg viewBox="0 0 24 24">${svgM}</svg>` });
      m.style.left = (Math.random() * 96) + '%';
      m.style.top = (Math.random() * 96) + '%';
      m.style.setProperty('--s', (0.6 + Math.random() * 1.1).toFixed(2));
      m.style.setProperty('--r', Math.round(Math.random() * 360) + 'deg');
      m.style.setProperty('--d', (18 + Math.random() * 22).toFixed(1) + 's');
      m.style.setProperty('--dl', (-Math.random() * 30).toFixed(1) + 's');
      if (k % 2) m.classList.add('alt');
      bg.append(m);
    }
  }

  /* ---------- Overlay / finestre ---------- */
  function closeOverlay() { overlay.classList.remove('show'); overlay.innerHTML = ''; }
  function openSheet(content, cls) {
    overlay.innerHTML = '';
    const card = h('div.sheet' + (cls ? '.' + cls : ''), { role: 'dialog', 'aria-modal': 'true' }, content);
    overlay.append(card);
    overlay.classList.add('show');
    overlay.onclick = e => { if (e.target === overlay) closeOverlay(); };
    return card;
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && overlay.classList.contains('show')) { closeOverlay(); return; }
    if (game && !overlay.classList.contains('show')) game.key(e);
  });

  /* ---------- Home ---------- */
  let game = null;
  function home() {
    game = null;
    currentId = null;
    closeOverlay();
    applyTheme(Z.themeById(Z.store.get('homeTheme', 'giardino')));
    screen.innerHTML = '';
    screen.className = 'home';
    const top = h('header.topbar', null,
      h('div.brand', null,
        h('div.logo', { on: { click: () => Z.Proposte && Z.Proposte.logoTap() }, html: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" class="lg-a"/><path d="M14 27c3 5 7 7 10 7s7-2 10-7" class="lg-l"/><circle cx="18" cy="20" r="2.4" class="lg-e"/><circle cx="30" cy="20" r="2.4" class="lg-e"/></svg>' }),
        h('div', null, h('h1', { text: 'Rompicapo Zen' }), h('p.sub', { text: 'Respira. Pensa. Risolvi.' }))),
      modeButton());
    const grid = h('div.cards');
    Z.ORDER.forEach((id, k) => {
      const G = Z.GAMES[id];
      const saved = Z.store.get(`save:${id}`, null);
      const card = h('button.card', { type: 'button', style: { '--h': G.hue, '--k': k } },
        h('div.card-ic', { html: G.icon }),
        h('div.card-tx', null, h('h2', { text: G.name }), h('p', { text: G.tagline })),
        saved ? h('span.badge', { text: 'In corso' }) : null);
      card.addEventListener('click', () => setupSheet(id));
      grid.append(card);
    });
    const prop = Z.Proposte ? Z.Proposte.homeButton() : null;
    screen.append(top, prop || '', grid, h('p.foot', { text: 'Ogni rompicapo è generato al momento: non ne vedrai mai due uguali.' }));
  }

  /* Pannello della difficoltà: ogni scelta viene salvata subito per quel gioco */
  function optionsPanel(id) {
    const G = Z.GAMES[id];
    const o = Z.getOpts(id);
    const box = h('div.opts');
    const draw = () => {
      box.innerHTML = '';
      for (const d of G.options || []) {
        const cur = d.choices.find(c => c.v === o[d.id]);
        const pick = v => {
          o[d.id] = v;
          /* scelte non più compatibili tornano a una valida */
          for (const e of G.options) {
            const x = e.choices.find(y => y.v === o[e.id]);
            if (x && x.need && !x.need(o)) o[e.id] = (e.choices.slice().reverse().find(y => !y.need || y.need(o)) || e.choices[0]).v;
          }
          Z.setOpts(id, o);
          draw();
          prefetch();
        };
        let row;
        if (d.id === 'size' && d.choices.length > 2) {
          /* dimensione: barra da far scorrere col dito, con anteprima della griglia */
          const ch = d.choices;
          const rng = h('input.size-range', {
            type: 'range', min: '0', max: String(ch.length - 1), step: '1',
            value: String(Math.max(0, ch.findIndex(c => c.v === o[d.id]))), 'aria-label': d.label,
          });
          const cells = h('div.size-cells');
          const show = () => {
            const c = ch[+rng.value];
            rng.setAttribute('aria-valuetext', c.label);
            cells.style.setProperty('--n', String(c.v));
          };
          rng.addEventListener('input', show);
          rng.addEventListener('change', () => pick(ch[+rng.value].v));
          show();
          row = h('div.size-pick', null, h('div.size-prev', null, cells), h('div.size-side', null, rng));
        } else {
          row = h('div.chips', { role: 'radiogroup', 'aria-label': d.label });
          for (const c of d.choices) {
            const b = h('button.opt-chip' + (c.v === o[d.id] ? '.on' : ''), {
              type: 'button', role: 'radio', 'aria-checked': String(c.v === o[d.id]), text: c.label,
            });
            b.disabled = !(!c.need || c.need(o));
            b.addEventListener('click', () => pick(c.v));
            row.append(b);
          }
        }
        box.append(h('div.opt', null,
          h('div.opt-label', { text: d.label }), row,
          cur && cur.help ? h('p.opt-help', { text: cur.help }) : null));
      }
    };
    draw();
    return box;
  }

  function setupSheet(id) {
    const G = Z.GAMES[id];
    const saved = Z.store.get(`save:${id}`, null);
    const done = Z.store.get(`done:${id}`, 0);
    const go = fresh => { closeOverlay(); startGame(id, fresh); };
    const rulesBox = h('div.rules', { html: G.rules });
    rulesBox.hidden = true;
    const rulesToggle = h('button.btn.rules-toggle', { type: 'button', text: 'Come si gioca', 'aria-expanded': 'false' });
    rulesToggle.addEventListener('click', () => {
      rulesBox.hidden = !rulesBox.hidden;
      rulesToggle.setAttribute('aria-expanded', String(!rulesBox.hidden));
    });
    const card = openSheet([
      h('div.sheet-head', null, h('div.card-ic', { html: G.icon }), h('h2', { text: G.name })),
      rulesToggle,
      rulesBox,
      h('h3.opt-title', { text: 'Difficoltà' }),
      optionsPanel(id),
      done ? h('p.opt-done', { text: `${done} risolti finora` }) : null,
      h('div.sheet-actions', null,
        saved ? h('button.btn', { type: 'button', text: 'Continua', on: { click: () => go(false) } }) : null,
        h('button.btn.primary', { type: 'button', text: saved ? 'Nuova partita' : 'Gioca', on: { click: () => go(true) } })),
      saved ? h('p.opt-note', { text: 'La partita in corso resta com’era; le nuove impostazioni valgono per le prossime.' }) : null,
    ]);
    card.style.setProperty('--h', G.hue);
  }

  function rulesSheet(G) {
    openSheet([
      h('div.sheet-head', null, h('div.card-ic', { html: G.icon }), h('h2', { text: 'Come si gioca' })),
      h('div.rules', { html: G.rules }),
      h('div.sheet-actions', null, h('button.btn.primary', { type: 'button', text: 'Ho capito', on: { click: closeOverlay } })),
    ]);
  }

  Z.ui = { openSheet, closeOverlay, home: () => home() };

  function confirmSheet(text, yes, onYes) {
    openSheet([
      h('p.confirm', { text }),
      h('div.sheet-actions', null,
        h('button.btn', { type: 'button', text: 'Annulla', on: { click: closeOverlay } }),
        h('button.btn.primary', { type: 'button', text: yes, on: { click: () => { closeOverlay(); onYes(); } } })),
    ]);
  }

  /* ---------- Partita ---------- */
  function startGame(id, fresh) {
    const G = Z.GAMES[id];
    currentId = id;
    const key = `save:${id}`;
    const saved = !fresh && Z.store.get(key, null);

    screen.innerHTML = '';
    screen.className = 'game';
    const themeName = h('span.theme-name');
    const lvPill = h('button.lv-pill', { type: 'button', title: 'Cambia difficoltà', on: { click: () => gameOptions() } });
    const bar = h('header.gbar', null,
      h('button.icon-btn', { type: 'button', title: 'Menu', 'aria-label': 'Torna al menu', html: Z.ICONS.back, on: { click: home } }),
      h('div.gtitle', null, h('b', { text: G.name }), h('span', null, lvPill, themeName)),
      h('button.icon-btn', { type: 'button', title: 'Come si gioca', 'aria-label': 'Come si gioca', html: Z.ICONS.help, on: { click: () => rulesSheet(G) } }));
    const wrap = h('div.board-wrap');
    const controls = h('div.controls');
    const bUndo = h('button.tool', { type: 'button', html: Z.ICONS.undo + '<span>Annulla</span>' });
    const bRedo = h('button.tool', { type: 'button', html: Z.ICONS.redo + '<span>Ripristina</span>' });
    const bHint = h('button.tool', { type: 'button', html: Z.ICONS.hint + '<span>Suggerimento</span>' });
    const bNew = h('button.tool', { type: 'button', html: Z.ICONS.fresh + '<span>Nuovo</span>' });
    const toolbar = h('nav.toolbar', null, bUndo, bRedo, bHint, bNew);
    const hintText = h('div.hint-tx');
    const hintBox = h('div.hint-box', { role: 'status', 'aria-live': 'polite' },
      h('div.hint-ic', { html: Z.ICONS.hint }), hintText,
      h('button.hint-x', { type: 'button', 'aria-label': 'Chiudi spiegazione', html: Z.ICONS.cross, on: { click: () => hideHint() } }));
    screen.append(bar, wrap, hintBox, controls, toolbar);
    let hinting = false;
    function showHint(html) {
      /* "il 1" -> "l'1", "il 8" -> "l'8", "il 11" -> "l'11" */
      hintText.innerHTML = html.replace(/\b([Ii])l (<b>)?(1|8|11)(?!\d)/g, (m, I, b, d) => (I === 'I' ? 'L' : 'l') + "'" + (b || '') + d);
      hintBox.classList.remove('show');
      void hintBox.offsetWidth;
      hintBox.classList.add('show');
      fit();
    }
    function hideHint() {
      if (!hintBox.classList.contains('show')) return;
      hintBox.classList.remove('show');
      fit();
    }

    let P, cur, undo = [], redo = [], view = null, won = false, gestureStart = null;

    /* Cronologia illimitata; se lo spazio del browser non basta si salvano solo le mosse più recenti */
    const save = () => {
      if (won) return;
      let keep = undo.length;
      for (;;) {
        if (Z.store.set(key, { P, s: cur, u: undo.slice(undo.length - keep), r: keep === undo.length ? redo : [] })) return;
        if (keep === 0) return;
        keep = Math.floor(keep / 2);
      }
    };
    const updateTools = () => {
      bUndo.disabled = !undo.length || won;
      bRedo.disabled = !redo.length || won;
      bHint.disabled = won;
    };
    const after = () => {
      save();
      updateTools();
      if (!won && G.solved(P, cur)) win();
    };
    const set = ns => { cur = ns; view.render(cur); after(); };
    const ctx = {
      board: wrap, controls,
      get puzzle() { return P; },
      get state() { return cur; },
      commit(ns) {
        if (won) return;
        undo.push(JSON.stringify(cur));
        redo = [];
        if (!hinting) hideHint();
        set(ns);
      },
      preview(ns) { if (won) return; cur = ns; view.render(cur); },
      begin() { gestureStart = JSON.stringify(cur); },
      end() {
        if (gestureStart !== null && gestureStart !== JSON.stringify(cur)) {
          undo.push(gestureStart);
          redo = [];
          hideHint();
          after();
        }
        gestureStart = null;
      },
    };

    /* ---------- Zoom solo sulla griglia (le griglie grandi hanno caselle piccole) ---------- */
    const Zm = { s: 1, tx: 0, ty: 0, max: 1, bw: 0, bh: 0, ww: 0, wh: 0 };
    const zoomUI = h('div.zoom-ui', null,
      h('button.zoom-btn', { type: 'button', 'aria-label': 'Ingrandisci la griglia', text: '+', on: { click: () => zoomAt(Zm.s * 1.6) } }),
      h('button.zoom-btn', { type: 'button', 'aria-label': 'Riduci la griglia', text: '−', on: { click: () => zoomAt(Zm.s / 1.6) } }));
    function clampZoom() {
      Zm.s = Math.min(Zm.max, Math.max(1, Zm.s));
      const mx = Math.max(0, (Zm.bw * Zm.s - Zm.ww) / 2 + 12), my = Math.max(0, (Zm.bh * Zm.s - Zm.wh) / 2 + 12);
      Zm.tx = Math.min(mx, Math.max(-mx, Zm.tx));
      Zm.ty = Math.min(my, Math.max(-my, Zm.ty));
      if (Zm.s === 1) { Zm.tx = 0; Zm.ty = 0; }
    }
    function applyZoom() {
      if (!view) return;
      clampZoom();
      view.el.style.width = Math.floor(Zm.bw * Zm.s) + 'px';
      view.el.style.height = Math.floor(Zm.bh * Zm.s) + 'px';
      view.el.style.transform = Zm.s > 1 ? `translate(${Zm.tx}px, ${Zm.ty}px)` : '';
      wrap.classList.toggle('zoomed', Zm.s > 1.01);
    }
    /* zoom verso un punto (coordinate rispetto al centro del campo) */
    function zoomAt(ns, px = 0, py = 0) {
      const qx = (px - Zm.tx) / Zm.s, qy = (py - Zm.ty) / Zm.s;
      Zm.s = Math.min(Zm.max, Math.max(1, ns));
      Zm.tx = px - qx * Zm.s; Zm.ty = py - qy * Zm.s;
      applyZoom();
    }

    function fit() {
      if (!view) return;
      const r = wrap.getBoundingClientRect();
      const W = Math.max(120, r.width - 8), H = Math.max(120, r.height - 8);
      const a = view.aspect || 1;
      let w = Math.min(W, 680), hh = w / a;
      if (hh > H) { hh = H; w = hh * a; }
      Zm.bw = w; Zm.bh = hh; Zm.ww = r.width; Zm.wh = r.height;
      /* massimo: caselle di circa 44 px (64 dove ci sono le etichette piccole delle gabbie) */
      const cells = (P && P.opt && P.opt.size) || 9;
      const target = view.el.classList.contains('cages') ? 64 : 44;
      Zm.max = Math.max(1, Math.min(8, target / (Math.min(w, hh) / (cells + (view.zoomExtra || 0)))));
      const can = Zm.max > 1.15;
      wrap.classList.toggle('zoomable', can);
      zoomUI.hidden = !can;
      if (!can) Zm.s = 1;
      applyZoom();
    }

    /* due dita sulla griglia = zoom e spostamento; il primo dito non deve lasciare mosse a metà */
    const touches = new Map();
    let pinch = null, snap = null, swallow = false, cancelling = false;
    const mid = () => {
      const r = wrap.getBoundingClientRect(), [a, b] = [...touches.values()];
      return { x: (a.x + b.x) / 2 - r.left - r.width / 2, y: (a.y + b.y) / 2 - r.top - r.height / 2, d: Math.hypot(a.x - b.x, a.y - b.y) || 1 };
    };
    wrap.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (touches.size === 1) {
        swallow = false;
        snap = { cur: JSON.stringify(cur), u: undo.length, r: redo.slice(), target: e.target, id: e.pointerId };
        return;
      }
      if (!wrap.classList.contains('zoomable') || won) return;
      e.stopPropagation(); e.preventDefault();
      if (touches.size === 2 && snap) {
        /* annulla quello che il primo dito aveva iniziato */
        cancelling = true;
        try { snap.target.dispatchEvent(new PointerEvent('pointercancel', { pointerId: snap.id, bubbles: true })); } catch (err) { /* ok */ }
        cancelling = false;
        gestureStart = null;
        if (JSON.stringify(cur) !== snap.cur) {
          cur = JSON.parse(snap.cur);
          undo.length = Math.min(undo.length, snap.u);
          redo = snap.r;
          view.render(cur);
          save(); updateTools();
        }
        const m = mid();
        pinch = { d0: m.d, s0: Zm.s, qx: (m.x - Zm.tx) / Zm.s, qy: (m.y - Zm.ty) / Zm.s };
        swallow = true;
      }
    }, true);
    let lastStep = 0;
    wrap.addEventListener('pointermove', e => {
      if (!touches.has(e.pointerId)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!swallow) return;
      e.stopPropagation(); e.preventDefault();
      if (!pinch || touches.size < 2) return;
      pinchStep(false);
    }, true);
    function pinchStep(force) {
      const now = Date.now();
      if (!force && now - lastStep < 30) return;
      lastStep = now;
      const m = mid();
      Zm.s = Math.min(Zm.max, Math.max(1, pinch.s0 * m.d / pinch.d0));
      Zm.tx = m.x - pinch.qx * Zm.s; Zm.ty = m.y - pinch.qy * Zm.s;
      applyZoom();
    }
    const lift = e => {
      if (cancelling || !touches.has(e.pointerId)) return;
      touches.delete(e.pointerId);
      if (swallow) { e.stopPropagation(); }
      if (pinch && touches.size === 1) {
        /* ultimo passo con la posizione finale delle due dita */
        touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
        pinchStep(true);
        touches.delete(e.pointerId);
      }
      if (touches.size < 2) pinch = null;
      if (!touches.size) { swallow = false; snap = null; }
    };
    wrap.addEventListener('pointerup', lift, true);
    wrap.addEventListener('pointercancel', lift, true);
    /* rotellina: Ctrl/pizzico del trackpad = zoom, altrimenti sposta la griglia ingrandita */
    wrap.addEventListener('wheel', e => {
      if (!wrap.classList.contains('zoomable')) return;
      const r = wrap.getBoundingClientRect();
      const px = e.clientX - r.left - r.width / 2, py = e.clientY - r.top - r.height / 2;
      if (e.ctrlKey || Zm.s === 1) {
        if (!e.ctrlKey && e.deltaY > 0) return;
        e.preventDefault();
        zoomAt(Zm.s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002)), px, py);
      } else {
        e.preventDefault();
        if (e.shiftKey && !e.deltaX) Zm.tx -= e.deltaY; else { Zm.tx -= e.deltaX; Zm.ty -= e.deltaY; }
        applyZoom();
      }
    }, { passive: false });

    function begin() {
      wrap.innerHTML = '';
      controls.innerHTML = '';
      const theme = Z.themeById(P.theme);
      applyTheme(theme);
      Z.store.set('homeTheme', theme.id);
      themeName.textContent = theme.name;
      lvPill.textContent = P.opt ? Z.optsSummary(G, P.opt) : 'Difficoltà';
      view = G.view(ctx);
      view.el.classList.add('board');
      Zm.s = 1; Zm.tx = 0; Zm.ty = 0;
      wrap.append(view.el, zoomUI);
      fit();
      requestAnimationFrame(fit);
      view.render(cur);
      after();
    }

    function newPuzzle() {
      won = false;
      hideHint();
      wrap.innerHTML = '';
      controls.innerHTML = '';
      const o = Z.getOpts(id), ready = queueTake(id, o);
      const slow = !ready && ((id === 'futoshiki' && o.size >= 10) || (id === 'calcudoku' && o.size >= 11) || (id === 'hashi' && o.size >= 18));
      wrap.append(h('div.loading', null, h('div.spinner'), h('p', { text: 'Preparo un nuovo rompicapo…' }),
        slow ? h('p.loading-note', { text: 'Le griglie così grandi richiedono qualche secondo.' }) : null));
      updateTools();
      setTimeout(() => {
        let p = ready;
        const opt = Z.getOpts(id);
        for (let t = 0; t < 5 && !p; t++) p = G.generate(opt);
        P = p;
        P.opt = opt;
        prefetch();
        P.theme = Z.nextTheme();
        cur = G.init(P);
        undo = []; redo = [];
        begin();
      }, 40);
    }

    function win() {
      won = true;
      hideHint();
      Z.store.del(key);
      Z.store.set(`done:${id}`, Z.store.get(`done:${id}`, 0) + 1);
      updateTools();
      view.el.classList.add('solved');
      petals();
      setTimeout(() => {
        if (game !== api) return;
        const card = openSheet([
          h('div.win-ic', { html: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" class="lg-a"/><path d="M20 33l8 8 16-17" class="win-ck"/></svg>' }),
          h('h2', { text: 'Completato' }),
          h('p.phrase', { text: Z.pick(PHRASES) }),
          h('p.count', { text: `${G.name} · ${Z.store.get(`done:${id}`, 0)} risolti` }),
          h('div.sheet-actions', null,
            h('button.btn', { type: 'button', text: 'Menu', on: { click: home } }),
            h('button.btn.primary', { type: 'button', text: 'Prossimo rompicapo', on: { click: () => { closeOverlay(); newPuzzle(); } } })),
        ], 'win');
        overlay.onclick = null;
        card.focus && card.focus();
      }, 1100);
    }

    /* Difficoltà dalla partita: si applica al prossimo rompicapo */
    function gameOptions() {
      const card = openSheet([
        h('div.sheet-head', null, h('div.card-ic', { html: G.icon }), h('h2', { text: 'Difficoltà' })),
        optionsPanel(id),
        h('div.sheet-actions', null,
          h('button.btn', { type: 'button', text: 'Chiudi', on: { click: closeOverlay } }),
          h('button.btn.primary', { type: 'button', text: 'Nuovo rompicapo', on: { click: () => { closeOverlay(); newPuzzle(); } } })),
        won ? null : h('p.opt-note', { text: 'Le scelte restano salvate. Con «Nuovo rompicapo» quello in corso andrà perso.' }),
      ]);
      card.style.setProperty('--h', G.hue);
    }

    function petals() {
      const layer = h('div.petals');
      for (let k = 0; k < 18; k++) {
        const p = h('i');
        p.style.left = (Math.random() * 100) + '%';
        p.style.setProperty('--d', (3.5 + Math.random() * 3).toFixed(2) + 's');
        p.style.setProperty('--dl', (Math.random() * 1.2).toFixed(2) + 's');
        p.style.setProperty('--x', (Math.random() * 120 - 60).toFixed(0) + 'px');
        p.style.setProperty('--hh', k % 3 ? 'var(--h)' : 'var(--h2)');
        layer.append(p);
      }
      document.body.append(layer);
      setTimeout(() => layer.remove(), 8000);
    }

    bUndo.addEventListener('click', () => {
      if (!undo.length || won) return;
      hideHint();
      redo.push(JSON.stringify(cur));
      cur = JSON.parse(undo.pop());
      view.render(cur);
      after();
    });
    bRedo.addEventListener('click', () => {
      if (!redo.length || won) return;
      hideHint();
      undo.push(JSON.stringify(cur));
      cur = JSON.parse(redo.pop());
      view.render(cur);
      after();
    });
    bHint.addEventListener('click', () => {
      if (won || !view) return;
      const r = G.hint(P, cur);
      if (!r) return;
      hinting = true;
      ctx.commit(r.state);
      hinting = false;
      if (view.flash) view.flash(r.focus);
      if (r.why && !won) showHint(r.why);
    });
    bNew.addEventListener('click', () => {
      if (won) { newPuzzle(); return; }
      confirmSheet('Vuoi iniziare un nuovo rompicapo? Quello in corso andrà perso.', 'Nuovo rompicapo', newPuzzle);
    });

    const api = {
      key(e) {
        const mod = e.ctrlKey || e.metaKey;
        if (mod && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); (e.shiftKey ? bRedo : bUndo).click(); return; }
        if (mod && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); bRedo.click(); return; }
        if (!mod && (e.key === 'h' || e.key === 'H') && !(view && view.letters)) { bHint.click(); return; } /* nel cruciverba H è una lettera */
        if (view && view.onKey && !won && view.onKey(e)) e.preventDefault();
      },
      fit,
    };
    game = api;

    if (saved && saved.P && saved.s) {
      P = saved.P;
      if (!P.theme) P.theme = Z.nextTheme();
      cur = saved.s; undo = saved.u || []; redo = saved.r || [];
      begin();
    } else newPuzzle();
  }

  window.addEventListener('resize', () => { if (game) game.fit(); });

  /* Niente zoom: pizzico su iPhone/iPad (Safari ignora user-scalable=no) e Ctrl+rotellina/+/- su computer.
     Il doppio tocco è già disattivato da touch-action: manipulation (CSS). */
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false }));
  document.addEventListener('touchmove', e => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  window.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].includes(e.key)) e.preventDefault();
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !window.ZEN_PREVIEW) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* facoltativo */ });
  }

  /* Collegamento diretto: index.html#sudoku */
  const m = /^#(\w+)/.exec(location.hash);
  if (m && Z.GAMES[m[1]]) startGame(m[1]);
  else home();
  setTimeout(prefetch, 1500);
  /* arrivati col link degli amici: il tasto compare subito */
  if (Z.Proposte) Z.Proposte.ready.then(ok => { if (ok && !game) home(); });
})();
