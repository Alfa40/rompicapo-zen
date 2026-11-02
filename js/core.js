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

  /* Archiviazione (sempre protetta) */
  Z.store = {
    get(k, d) {
      try { const v = localStorage.getItem('zen:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; }
    },
    set(k, v) { try { localStorage.setItem('zen:' + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem('zen:' + k); } catch (e) { /* ignorato */ } },
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
    cross: '<svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7L7 17"/></svg>',
  };
})();
