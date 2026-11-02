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
    closeOverlay();
    applyTheme(Z.themeById(Z.store.get('homeTheme', 'giardino')));
    screen.innerHTML = '';
    screen.className = 'home';
    const top = h('header.topbar', null,
      h('div.brand', null,
        h('div.logo', { html: '<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" class="lg-a"/><path d="M14 27c3 5 7 7 10 7s7-2 10-7" class="lg-l"/><circle cx="18" cy="20" r="2.4" class="lg-e"/><circle cx="30" cy="20" r="2.4" class="lg-e"/></svg>' }),
        h('div', null, h('h1', { text: 'Rompicapo Zen' }), h('p.sub', { text: 'Respira. Pensa. Risolvi.' }))),
      modeButton());
    const grid = h('div.cards');
    Z.ORDER.forEach((id, k) => {
      const G = Z.GAMES[id];
      const saved = Z.LEVELS.some(L => Z.store.get(`save:${id}:${L.id}`, null));
      const card = h('button.card', { type: 'button', style: { '--h': G.hue, '--k': k } },
        h('div.card-ic', { html: G.icon }),
        h('div.card-tx', null, h('h2', { text: G.name }), h('p', { text: G.tagline })),
        saved ? h('span.badge', { text: 'In corso' }) : null);
      card.addEventListener('click', () => levelSheet(id));
      grid.append(card);
    });
    screen.append(top, grid, h('p.foot', { text: 'Ogni rompicapo è generato al momento: non ne vedrai mai due uguali.' }));
  }

  function levelSheet(id) {
    const G = Z.GAMES[id];
    const list = h('div.levels');
    Z.LEVELS.forEach(L => {
      const saved = Z.store.get(`save:${id}:${L.id}`, null);
      const done = Z.store.get(`done:${id}:${L.id}`, 0);
      const b = h('button.level', { type: 'button' },
        h('span.lv-dots', { html: [0, 1, 2].map(k => `<i class="${k <= Z.LEVELS.indexOf(L) ? 'on' : ''}"></i>`).join('') }),
        h('span.lv-tx', null, h('b', { text: L.label }), h('small', { text: L.desc })),
        h('span.lv-meta', null, saved ? h('em', { text: 'Continua' }) : null, done ? h('small', { text: `${done} risolti` }) : null));
      b.addEventListener('click', () => { closeOverlay(); startGame(id, L.id); });
      list.append(b);
    });
    const card = openSheet([
      h('div.sheet-head', null, h('div.card-ic', { html: G.icon }), h('h2', { text: G.name })),
      h('div.rules', { html: G.rules }),
      list,
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

  function confirmSheet(text, yes, onYes) {
    openSheet([
      h('p.confirm', { text }),
      h('div.sheet-actions', null,
        h('button.btn', { type: 'button', text: 'Annulla', on: { click: closeOverlay } }),
        h('button.btn.primary', { type: 'button', text: yes, on: { click: () => { closeOverlay(); onYes(); } } })),
    ]);
  }

  /* ---------- Partita ---------- */
  function startGame(id, level, fresh) {
    const G = Z.GAMES[id];
    const key = `save:${id}:${level}`;
    const saved = !fresh && Z.store.get(key, null);
    const L = Z.LEVELS.find(x => x.id === level);

    screen.innerHTML = '';
    screen.className = 'game';
    const themeName = h('span.theme-name');
    const bar = h('header.gbar', null,
      h('button.icon-btn', { type: 'button', title: 'Menu', 'aria-label': 'Torna al menu', html: Z.ICONS.back, on: { click: home } }),
      h('div.gtitle', null, h('b', { text: G.name }), h('span', null, h('span.lv-pill', { text: L.label }), themeName)),
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
      level, board: wrap, controls,
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

    function fit() {
      if (!view) return;
      const r = wrap.getBoundingClientRect();
      const W = Math.max(120, r.width - 8), H = Math.max(120, r.height - 8);
      const a = view.aspect || 1;
      let w = Math.min(W, 680), hh = w / a;
      if (hh > H) { hh = H; w = hh * a; }
      view.el.style.width = Math.floor(w) + 'px';
      view.el.style.height = Math.floor(hh) + 'px';
    }

    function begin() {
      wrap.innerHTML = '';
      controls.innerHTML = '';
      const theme = Z.themeById(P.theme);
      applyTheme(theme);
      Z.store.set('homeTheme', theme.id);
      themeName.textContent = theme.name;
      view = G.view(ctx);
      view.el.classList.add('board');
      wrap.append(view.el);
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
      wrap.append(h('div.loading', null, h('div.spinner'), h('p', { text: 'Preparo un nuovo rompicapo…' })));
      updateTools();
      setTimeout(() => {
        let p = null;
        for (let t = 0; t < 5 && !p; t++) p = G.generate(level);
        P = p;
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
      Z.store.set(`done:${id}:${level}`, Z.store.get(`done:${id}:${level}`, 0) + 1);
      updateTools();
      view.el.classList.add('solved');
      petals();
      setTimeout(() => {
        if (game !== api) return;
        const card = openSheet([
          h('div.win-ic', { html: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" class="lg-a"/><path d="M20 33l8 8 16-17" class="win-ck"/></svg>' }),
          h('h2', { text: 'Completato' }),
          h('p.phrase', { text: Z.pick(PHRASES) }),
          h('p.count', { text: `${G.name} · ${L.label} · ${Z.store.get(`done:${id}:${level}`, 0)} risolti` }),
          h('div.sheet-actions', null,
            h('button.btn', { type: 'button', text: 'Menu', on: { click: home } }),
            h('button.btn.primary', { type: 'button', text: 'Prossimo rompicapo', on: { click: () => { closeOverlay(); newPuzzle(); } } })),
        ], 'win');
        overlay.onclick = null;
        card.focus && card.focus();
      }, 1100);
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
        if (!mod && (e.key === 'h' || e.key === 'H')) { bHint.click(); return; }
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

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('sw.js').catch(() => { /* facoltativo */ });
  }

  /* Collegamento diretto: index.html#sudoku/normal */
  const m = /^#(\w+)\/(easy|normal|hard)$/.exec(location.hash);
  if (m && Z.GAMES[m[1]]) startGame(m[1], m[2]);
  else home();
})();
