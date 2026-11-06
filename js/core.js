/* Rompicapo Zen — utilità condivise */
(function () {
  'use strict';
  const Z = (window.Zen = window.Zen || {});

  Z.GAMES = {};
  Z.ORDER = [];
  Z.register = g => { Z.GAMES[g.id] = g; Z.ORDER.push(g.id); };

  /* Difficoltà personalizzata: ogni gioco dichiara le sue opzioni; la scelta resta salvata per quel gioco */
  Z.defaultOpts = G => Object.fromEntries((G.options || []).map(o => [o.id, o.def]));
  Z.getOpts = id => {
    const G = Z.GAMES[id], o = Object.assign(Z.defaultOpts(G), Z.store.get('opts:' + id, {}));
    for (const d of G.options || []) if (!d.choices.some(c => c.v === o[d.id])) o[d.id] = d.def;
    return o;
  };
  Z.setOpts = (id, o) => Z.store.set('opts:' + id, o);
  Z.optsSummary = (G, o) => (G.options || []).map(d => (d.choices.find(c => c.v === o[d.id]) || {}).label).filter(Boolean).join(' · ');

  /* Temi: ne viene scelto uno nuovo a ogni partita */
  Z.THEMES = [
    { id: 'giardino', name: 'Giardino zen', h: 150, h2: 95, motif: 'leaf' },
    { id: 'ciliegio', name: 'Ciliegio', h: 340, h2: 25, motif: 'petal' },
    { id: 'mare', name: 'Mare calmo', h: 200, h2: 175, motif: 'wave' },
    { id: 'tramonto', name: 'Bosco al tramonto', h: 22, h2: 285, motif: 'firefly' },
    { id: 'lavanda', name: 'Campo di lavanda', h: 265, h2: 320, motif: 'petal' },
    { id: 'notte', name: 'Notte stellata', h: 228, h2: 260, motif: 'star' },
    { id: 'deserto', name: 'Dune dorate', h: 38, h2: 12, motif: 'cloud' },
    { id: 'laguna', name: 'Laguna', h: 178, h2: 210, motif: 'wave' },
    { id: 'menta', name: 'Tè alla menta', h: 160, h2: 45, motif: 'leaf' },
    { id: 'corallo', name: 'Barriera corallina', h: 8, h2: 190, motif: 'wave' },
    { id: 'aurora', name: 'Aurora', h: 290, h2: 165, motif: 'star' },
    { id: 'autunno', name: 'Foglie d\'autunno', h: 28, h2: 50, motif: 'leaf' },
    { id: 'nuvole', name: 'Sopra le nuvole', h: 210, h2: 330, motif: 'cloud' },
    { id: 'bambu', name: 'Bosco di bambù', h: 105, h2: 160, motif: 'leaf' },
    { id: 'lucciole', name: 'Prato di lucciole', h: 75, h2: 240, motif: 'firefly' },
    { id: 'peonia', name: 'Peonie', h: 320, h2: 280, motif: 'petal' },
  ];
  Z.themeById = id => Z.THEMES.find(t => t.id === id) || Z.THEMES[0];
  Z.nextTheme = function () {
    const last = Z.store.get('lastTheme', null);
    const opts = Z.THEMES.filter(t => t.id !== last);
    const t = Z.pick(opts);
    Z.store.set('lastTheme', t.id);
    return t.id;
  };

  /* Casualità */
  Z.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  Z.pick = a => a[Math.floor(Math.random() * a.length)];
  /* una frase a caso tra quelle date (i suggerimenti non ripetono sempre le stesse parole) */
  Z.say = (...a) => Z.pick(a);
  /* Regole di un gioco in quattro parti (scopo, regole, comandi, primo passo): la prima partita le mostra una alla volta */
  Z.rules = r => [['Lo scopo', r.goal], ['Le regole', r.rules], ['Come si gioca', r.play], ['Per cominciare', r.start]]
    .filter(x => x[1]).map(([t, v]) => `<section class="rl"><h4>${t}</h4>` +
      (Array.isArray(v) ? `<ul>${v.map(x => `<li>${x}</li>`).join('')}</ul>` : `<p>${v}</p>`) + '</section>').join('');
  Z.shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  Z.range = n => Array.from({ length: n }, (_, i) => i);
  Z.popcount = m => { let c = 0; while (m) { m &= m - 1; c++; } return c; };
  Z.clone = o => JSON.parse(JSON.stringify(o));
  Z.now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

  /* Quadrato latino casuale n×n */
  Z.randomLatin = function (n) {
    for (;;) {
      const g = new Array(n * n).fill(0), rows = new Array(n).fill(0), cols = new Array(n).fill(0);
      let steps = 0;
      const rec = i => {
        if (i === n * n) return true;
        if (++steps > 20000) return false;
        const r = (i / n) | 0, c = i % n;
        for (const v of Z.shuffle(Z.range(n).map(x => x + 1))) {
          const b = 1 << v;
          if ((rows[r] | cols[c]) & b) continue;
          g[i] = v; rows[r] |= b; cols[c] |= b;
          if (rec(i + 1)) return true;
          rows[r] ^= b; cols[c] ^= b;
        }
        g[i] = 0;
        return false;
      };
      if (rec(0)) return g;
    }
  };

  /* Archiviazione (sempre protetta). Nelle anteprime delle proposte il prefisso è diverso (ZEN_PREFIX, messo dal
     robot che le pubblica), così non toccano le partite del gioco vero. */
  const PFX = window.ZEN_PREFIX || 'zen:';
  Z.store = {
    get(k, d) {
      try { const v = localStorage.getItem(PFX + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) { try { localStorage.setItem(PFX + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(PFX + k); } catch (e) { /* ignorato */ } },
  };

  /* DOM */
  Z.h = function (tag, props, ...kids) {
    const parts = tag.split('.');
    const e = document.createElement(parts[0] || 'div');
    if (parts.length > 1) e.className = parts.slice(1).join(' ');
    if (props) for (const k in props) {
      const v = props[k];
      if (k === 'on') { for (const ev in v) e.addEventListener(ev, v[ev]); }
      else if (k === 'style' && typeof v === 'object') { for (const s in v) e.style.setProperty(s, v[s]); }
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    for (const c of kids.flat()) {
      if (c == null || c === false) continue;
      e.append(c.nodeType ? c : document.createTextNode(String(c)));
    }
    return e;
  };
  Z.s = function (tag, attrs, parent) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };
  /* Coordinate del puntatore nello spazio utente di un SVG */
  Z.svgPoint = function (svg, e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  };

  /* Contorni spessi tra regioni diverse (riquadri, gabbie, regioni) */
  Z.outline = function (w, h, id) {
    const svg = Z.s('svg', { class: 'outline', viewBox: `0 0 ${w} ${h}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
    let d = '';
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (x < w - 1 && id[i] !== id[i + 1]) d += `M${x + 1} ${y}V${y + 1}`;
      if (y < h - 1 && id[i] !== id[i + w]) d += `M${x} ${y + 1}H${x + 1}`;
    }
    Z.s('path', { d, class: 'ol-in', 'vector-effect': 'non-scaling-stroke' }, svg);
    Z.s('rect', { x: 0, y: 0, width: w, height: h, class: 'ol-out', 'vector-effect': 'non-scaling-stroke' }, svg);
    return svg;
  };

  /* Riavvia un'animazione CSS di evidenziazione */
  Z.flashEl = function (el) {
    if (!el) return;
    el.classList.remove('flash');
    void el.getBoundingClientRect();
    el.classList.add('flash');
    setTimeout(() => el.classList.remove('flash'), 1500);
  };

  /* ---------- Comandi con le frecce (modalità «Frecce» della partita) ---------- */
  Z.DIRS = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
  /* tenendo premuto un tasto, si ripete */
  const repeatBtn = (b, fn) => {
    let t = null;
    const stop = () => { clearTimeout(t); clearInterval(t); t = null; };
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      stop();
      fn();
      t = setTimeout(() => { t = setInterval(fn, 110); }, 380);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop));
    b.addEventListener('click', e => { if (e.detail === 0) fn(); }); /* tastiera */
  };
  /* o.onDir(d) con d = 'u' | 'd' | 'l' | 'r'; o.keys: [{ label, icon, act, on() }]; o.compact: frecce in fila */
  Z.arrowPad = function (o) {
    const el = Z.h('div.apad' + (o.compact ? '.compact' : ''));
    const arrows = Z.h('div.apad-arrows');
    for (const [d, lab] of [['u', 'Su'], ['l', 'Sinistra'], ['r', 'Destra'], ['d', 'Giù']]) {
      const b = Z.h('button.key.apad-a.' + d, { type: 'button', 'aria-label': lab, html: Z.ICONS.back });
      repeatBtn(b, () => o.onDir(d));
      arrows.append(b);
    }
    el.append(arrows);
    const keys = (o.keys || []).map(k => {
      const b = Z.h('button.key.apad-k', { type: 'button' });
      b.addEventListener('click', () => k.act());
      return b;
    });
    if (keys.length) el.append(Z.h('div.apad-keys', null, ...keys));
    const tip = Z.h('p.apad-tip');
    if (!o.compact) el.append(tip);
    const refresh = () => {
      (o.keys || []).forEach((k, i) => {
        const label = typeof k.label === 'function' ? k.label() : k.label;
        keys[i].innerHTML = (k.icon || '') + '<span>' + label + '</span>';
        keys[i].classList.toggle('on', !!(k.on && k.on()));
      });
      const t = o.tip ? o.tip() : '';
      tip.textContent = t || '';
      tip.hidden = !t;
    };
    refresh();
    return { el, refresh };
  };

  /* Cursore su una griglia (o su isole/blocchi): le frecce lo spostano, la vista lo segue.
     o: { w, h, el(i), start, ok(i), step(i, d), fix(i), keys: [{ label, icon, act(i) -> nuovo i?,
          dir: true (tasto che aspetta una freccia: act(i, d)), pen: true (acceso/spento: act(i, from, d) a ogni passo) }] } */
  Z.gridCursor = function (ctx, o) {
    let i = o.start || 0, armed = -1, pen = -1;
    if (o.ok && !o.ok(i)) { const k = Z.range(o.w * o.h).find(o.ok); i = k === undefined ? 0 : k; }
    const move = (j, d) => {
      if (o.step) return o.step(j, d);
      const [dx, dy] = Z.DIRS[d];
      let x = j % o.w, y = (j / o.w) | 0;
      for (;;) {
        x += dx; y += dy;
        if (x < 0 || y < 0 || x >= o.w || y >= o.h) return j;
        const k = y * o.w + x;
        if (!o.ok || o.ok(k)) return k;
      }
    };
    const show = () => { ctx.mark(o.el(i)); pad.refresh(); };
    const keys = o.keys.map((k, n) => ({
      label: typeof k.label === 'function' ? () => k.label(i, pen === n) : k.label,
      icon: k.icon,
      on: () => armed === n || pen === n,
      act() {
        if (k.dir) { armed = armed === n ? -1 : n; pad.refresh(); return; }
        armed = -1;
        if (k.pen) {
          if (pen === n) { pen = -1; if (k.stop) k.stop(i); show(); return; }
          if (k.act(i, -1, null) === false) { Z.flashEl(o.el(i)); show(); return; }
          pen = n; show(); return;
        }
        const r = k.act(i);
        if (typeof r === 'number') i = r;
        show();
      },
    }));
    const pad = Z.arrowPad({
      keys,
      tip: () => (armed >= 0 ? (o.keys[armed].tip || 'Scegli la direzione con una freccia.') : pen >= 0 ? (o.keys[pen].tip || '') : (o.tip || '')),
      onDir(d) {
        if (armed >= 0) {
          const k = o.keys[armed];
          armed = -1;
          const r = k.act(i, d);
          if (typeof r === 'number') i = r;
          show();
          return;
        }
        const j = move(i, d);
        if (j === i) return;
        if (pen >= 0) {
          const r = o.keys[pen].act(j, i, d);
          if (r === false) { Z.flashEl(o.el(j)); return; }
          if (r === 'stop') pen = -1;
        }
        i = j;
        show();
      },
    });
    return {
      el: pad.el,
      render() { if (o.fix) i = o.fix(i); show(); },
      off() { pen = -1; armed = -1; ctx.mark(null); },
    };
  };

  /* Tastiera di lettere sullo schermo (cruciverba, incastro, frase cifrata) */
  Z.letterPad = function (type, back) {
    const kb = Z.h('div.cw-kb');
    for (const row of ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']) {
      const r = Z.h('div.cw-row');
      for (const L of row) r.append(Z.h('button.key.cw-k', { type: 'button', text: L, on: { click: () => type(L) } }));
      if (row[0] === 'Z') r.append(Z.h('button.key.tool.cw-k.wide', { type: 'button', 'aria-label': 'Cancella', html: Z.ICONS.erase, on: { click: back } }));
      kb.append(r);
    }
    return kb;
  };

  Z.ICONS = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    undo: '<svg viewBox="0 0 24 24"><path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-4"/></svg>',
    redo: '<svg viewBox="0 0 24 24"><path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h4"/></svg>',
    hint: '<svg viewBox="0 0 24 24"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
    fresh: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/></svg>',
    help: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6"/><path d="M12 17.2v.1"/></svg>',
    pencil: '<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/></svg>',
    erase: '<svg viewBox="0 0 24 24"><path d="M20 19H9l-5-5 9-9 7 7-6 6"/><path d="M8 10l6 6"/></svg>',
    sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
    auto: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/></svg>',
    fill: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor"/></svg>',
    arrows: '<svg viewBox="0 0 24 24"><path d="M12 3v18M3 12h18"/><path d="M9 6l3-3 3 3M9 18l3 3 3-3M6 9l-3 3 3 3M18 9l3 3-3 3"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12"/><path d="M11 11.5v-7a1.5 1.5 0 0 1 3 0V12"/><path d="M14 11.5V6.5a1.5 1.5 0 0 1 3 0V14"/><path d="M8 12.5a1.5 1.5 0 0 0-3 0V15a6 6 0 0 0 6 6h1a5 5 0 0 0 5-5v-2"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/></svg>',
    dot: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>',
    rotate: '<svg viewBox="0 0 24 24"><path d="M19 12a7 7 0 1 1-2-4.9"/><path d="M19 4v4h-4"/></svg>',
    rotateBack: '<svg viewBox="0 0 24 24"><path d="M5 12a7 7 0 1 0 2-4.9"/><path d="M5 4v4h4"/></svg>',
    tap: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="8"/></svg>',
    bridge: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="3"/><circle cx="19" cy="12" r="3"/><path d="M8 10.5h8M8 13.5h8"/></svg>',
    move: '<svg viewBox="0 0 24 24"><rect x="7" y="7" width="10" height="10" rx="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>',
    pen: '<svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19z"/></svg>',
    swap: '<svg viewBox="0 0 24 24"><path d="M5 9h13l-3-3M19 15H6l3 3"/></svg>',
    cross: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  };
})();
