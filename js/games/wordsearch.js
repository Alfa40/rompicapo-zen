/* Parole nascoste — trova le parole nella griglia di lettere; quelle che restano formano la chiave */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 10, choices: [{ v: 8, label: '8×8' }, { v: 10, label: '10×10' }, { v: 12, label: '12×12' }, { v: 14, label: '14×14' }] },
    { id: 'dir', label: 'Direzioni', def: 2, choices: [
      { v: 1, label: 'Facile', help: 'Parole solo da sinistra a destra e dall\'alto in basso.' },
      { v: 2, label: 'Normale', help: 'Anche in diagonale.' },
      { v: 3, label: 'Difficile', help: 'In tutte le direzioni, anche al contrario.' },
    ] },
  ];
  const ALL8 = [[1, 0], [0, 1], [1, 1], [1, -1], [-1, 0], [0, -1], [-1, -1], [-1, 1]];
  const DIRS = { 1: ALL8.slice(0, 2), 2: ALL8.slice(0, 4), 3: ALL8 };
  const DIR_NAME = {
    '1,0': 'verso destra', '-1,0': 'verso sinistra, cioè al contrario', '0,1': 'verso il basso', '0,-1': 'verso l\'alto, cioè al contrario',
    '1,1': 'in diagonale, verso il basso a destra', '1,-1': 'in diagonale, verso l\'alto a destra',
    '-1,1': 'in diagonale, verso il basso a sinistra', '-1,-1': 'in diagonale, verso l\'alto a sinistra',
  };

  const THEMES = {
    'Animali': 'CANE GATTO CAVALLO MUCCA PECORA CAPRA MAIALE CONIGLIO LEPRE VOLPE LUPO ORSO CERVO CINGHIALE TASSO RICCIO SCOIATTOLO TALPA TOPO CRICETO LEONE TIGRE GIRAFFA ZEBRA ELEFANTE RINOCERONTE IPPOPOTAMO CAMMELLO CANGURO KOALA PANDA SCIMMIA GORILLA DELFINO BALENA FOCA PINGUINO AQUILA GUFO CIVETTA PASSERO RONDINE PICCHIO CORVO ANATRA GALLINA TACCHINO PAVONE CIGNO RANA ROSPO LUCERTOLA SERPENTE TARTARUGA COCCODRILLO FARFALLA APE FORMICA LUMACA GRILLO RAGNO',
    'Frutta e verdura': 'MELA PERA BANANA ARANCIA LIMONE MANDARINO FRAGOLA CILIEGIA ALBICOCCA PESCA SUSINA PRUGNA FICO UVA KIWI ANANAS MANGO MELONE ANGURIA LAMPONE MIRTILLO MORA NOCE NOCCIOLA MANDORLA CASTAGNA DATTERO MELOGRANO CAROTA PATATA POMODORO ZUCCHINA MELANZANA PEPERONE CIPOLLA AGLIO SEDANO LATTUGA SPINACI CAVOLO BROCCOLI CARCIOFO FINOCCHIO ZUCCA RAPA PISELLI FAGIOLI CECI LENTICCHIE ASPARAGO RAVANELLO BIETOLA RUCOLA BASILICO PREZZEMOLO',
    'Città italiane': 'ROMA MILANO NAPOLI TORINO PALERMO GENOVA BOLOGNA FIRENZE BARI CATANIA VENEZIA VERONA MESSINA PADOVA TRIESTE BRESCIA PARMA MODENA PERUGIA LIVORNO CAGLIARI FOGGIA RAVENNA RIMINI SALERNO FERRARA SASSARI LATINA MONZA BERGAMO PESCARA TRENTO VICENZA TERNI BOLZANO NOVARA PIACENZA ANCONA UDINE AREZZO LECCE PISA SIENA LUCCA COMO COSENZA AOSTA POTENZA MATERA CAMPOBASSO TARANTO',
    'Natura': 'MARE MONTAGNA COLLINA FIUME LAGO BOSCO FORESTA PRATO CAMPO VALLE SPIAGGIA SCOGLIO ONDA ISOLA VULCANO CASCATA SORGENTE RUSCELLO GROTTA DESERTO DUNA GHIACCIAIO NEVE PIOGGIA NUVOLA VENTO TEMPORALE FULMINE TUONO ARCOBALENO SOLE LUNA STELLA CIELO ALBA TRAMONTO NEBBIA BRINA RUGIADA FOGLIA RAMO RADICE TRONCO FIORE ERBA MUSCHIO SASSO ROCCIA SABBIA TERRA',
    'La casa': 'CUCINA SALOTTO CAMERA BAGNO CANTINA SOFFITTA BALCONE TERRAZZO GIARDINO PORTA FINESTRA TETTO CAMINO SCALA DIVANO POLTRONA SEDIA TAVOLO LETTO ARMADIO CASSETTO SPECCHIO LAMPADA TAPPETO TENDA CUSCINO COPERTA LENZUOLO FORNO FRIGORIFERO LAVATRICE PENTOLA PADELLA PIATTO BICCHIERE FORCHETTA COLTELLO CUCCHIAIO TAZZA TEIERA SCOPA SECCHIO MENSOLA LIBRERIA QUADRO OROLOGIO CHIAVE CAMPANELLO',
    'Musica e arte': 'PIANOFORTE CHITARRA VIOLINO VIOLONCELLO CONTRABBASSO ARPA FLAUTO CLARINETTO OBOE FAGOTTO TROMBA TROMBONE SASSOFONO TAMBURO BATTERIA TRIANGOLO FISARMONICA ORGANO MANDOLINO NOTA ACCORDO MELODIA RITMO CANZONE CORO ORCHESTRA CONCERTO OPERA SINFONIA PENNELLO TELA COLORE PITTURA SCULTURA MARMO DISEGNO MATITA AFFRESCO MOSAICO MUSEO TEATRO DANZA BALLETTO POESIA ROMANZO',
    'Sport e giochi': 'CALCIO TENNIS NUOTO CICLISMO PALLAVOLO PALLACANESTRO RUGBY GOLF SCI PATTINAGGIO ATLETICA MARATONA CORSA SALTO LANCIO GINNASTICA SCHERMA JUDO KARATE PUGILATO VELA CANOA REMO SURF EQUITAZIONE ARRAMPICATA ESCURSIONE YOGA BOCCE BILIARDO SCACCHI DAMA PALLONE RETE ARBITRO SQUADRA PARTITA CANESTRO RACCHETTA MEDAGLIA COPPA PODIO STADIO PALESTRA',
    'In cucina': 'PASTA PIZZA RISOTTO LASAGNA GNOCCHI RAVIOLI TORTELLINI SPAGHETTI POLENTA MINESTRA ZUPPA BRODO PANE FOCACCIA GRISSINI FORMAGGIO MOZZARELLA PARMIGIANO BURRO OLIO ACETO SALE PEPE ZUCCHERO FARINA UOVO LATTE PANNA GELATO TORTA BISCOTTO CROSTATA CANNOLO CORNETTO CIOCCOLATO MIELE MARMELLATA SUCCO PROSCIUTTO SALAME FRITTATA INSALATA ARROSTO',
    'Mestieri': 'MEDICO INFERMIERE MAESTRA PROFESSORE CUOCO FORNAIO PASTICCERE MACELLAIO CONTADINO PESCATORE MURATORE FALEGNAME IDRAULICO ELETTRICISTA MECCANICO PITTORE SARTO BARBIERE PARRUCCHIERE POSTINO POMPIERE POLIZIOTTO AVVOCATO GIUDICE NOTAIO ARCHITETTO INGEGNERE FARMACISTA DENTISTA VETERINARIO PILOTA AUTISTA MARINAIO GIARDINIERE FIORAIO LIBRAIO GIORNALISTA FOTOGRAFO ATTORE CANTANTE MUSICISTA SCRITTORE CAMERIERE BARISTA COMMESSO',
  };

  /* chiavi: le lettere che restano, lette in ordine (una per ogni lunghezza da 4 a 30, spesso più d'una) */
  const KEYS = `PACE SOLE CALMA GIOIA BRAVO QUIETE OTTIMO EVVIVA SORRISO RESPIRA ARMONIA FIDUCIA STUPORE SILENZIO PAZIENZA
    SERENITA PERFETTO CORAGGIO ALLEGRIA DOLCEZZA BENFATTO MAGNIFICO SPLENDIDO CURIOSITA EQUILIBRIO BRAVISSIMO FANTASTICO
    ECCELLENTE GENTILEZZA MERAVIGLIA COMPLIMENTI BELLASCOPERTA OTTIMOLAVORO MENTELIMPIDA CUORELEGGERO PICCOLIPASSI
    RESPIRAEPENSA CHICERCATROVA GOCCIAAGOCCIA BUONAGIORNATA PASSODOPOPASSO CONCENTRAZIONE ILSILENZIOEDORO ILTEMPOEUNFIUME
    CHIVAPIANOVASANO UNPASSOALLAVOLTA UNACOSAALLAVOLTA PAROLADOPOPAROLA MEGLIOTARDICHEMAI OGNIGIORNOUNPASSO
    LETTERADOPOLETTERA SEISTATOBRAVISSIMO NONCEROSASENZASPINE TUTTELEPAROLETROVATE RIDEBENECHIRIDEULTIMO
    ACQUACHETAROMPEIPONTI CHIDORMENONPIGLIAPESCI LAPRATICARENDEPERFETTI CHIVAALMULINOSINFARINA OGNIPAROLAHAILSUOPOSTO
    HAITROVATOTUTTELEPAROLE OCCHIATTENTIEMENTECALMA PATTICHIARIAMICIZIALUNGA LEPAROLESONOTUTTETROVATE
    CHIHATEMPONONASPETTITEMPO CHITROPPOVUOLENULLASTRINGE TRADUELITIGANTIILTERZOGODE CHIBENCOMINCIAEAMETADELLOPERA
    LAPAZIENZAELACHIAVEDITUTTO NONTUTTIIMALIVENGONOPERNUOCERE OGNIGIORNOSIIMPARAQUALCOSA LAVORANDOINSIEMESIVALONTANO
    UNOCCHIOATTENTOVEDEOGNICOSA CERCAVIEPAROLEHAITROVATOANCHE LEPAROLENASCOSTENONHANNOSEGRETI GOCCIAAGOCCIASISCAVALAPIETRA`
    .split(/\s+/).filter(Boolean);
  const KEY_BY_LEN = {};
  for (const k of KEYS) (KEY_BY_LEN[k.length] = KEY_BY_LEN[k.length] || []).push(k);

  const rev = w => w.split('').reverse().join('');
  /* due parole non possono stare una dentro l'altra: si troverebbero due volte */
  const clash = (a, b) => a.includes(b) || b.includes(a) || a.includes(rev(b)) || b.includes(rev(a));

  /* tutte le posizioni (insieme di caselle) in cui la parola si legge, in qualunque direzione */
  function occurrences(g, n, w) {
    const seen = new Set();
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (g[y * n + x] !== w[0]) continue;
      for (const [dx, dy] of ALL8) {
        const ex = x + dx * (w.length - 1), ey = y + dy * (w.length - 1);
        if (ex < 0 || ey < 0 || ex >= n || ey >= n) continue;
        let k = 1;
        while (k < w.length && g[(y + dy * k) * n + x + dx * k] === w[k]) k++;
        if (k === w.length) { const a = y * n + x, b = ey * n + ex; seen.add(Math.min(a, b) + ':' + Math.max(a, b)); }
      }
    }
    return seen.size;
  }

  const cellsOf = (n, p) => Z.range(p.len).map(k => (p.y + p.dy * k) * n + p.x + p.dx * k);

  function generate(opt) {
    const n = opt.size, N = n * n, dirs = DIRS[opt.dir] || DIRS[2];
    const T = Math.max(5, Math.min(30, Math.round(N * 0.16)));
    for (let att = 0; att < 400; att++) {
      const theme = Z.pick(Object.keys(THEMES));
      const pool = THEMES[theme].split(' ').filter(w => w.length >= 3 && w.length <= n)
        .map(w => ({ w, r: w.length + Math.random() * 4 })).sort((a, b) => b.r - a.r).map(o => o.w);
      const g = new Array(N).fill('');
      const placed = [];
      let free = N;
      for (const w of pool) {
        if (free <= T) break;
        if (placed.some(p => clash(p.w, w))) continue;
        const cand = [];
        for (const [dx, dy] of dirs) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const ex = x + dx * (w.length - 1), ey = y + dy * (w.length - 1);
          if (ex < 0 || ey < 0 || ex >= n || ey >= n) continue;
          let ov = 0, ok = true;
          for (let k = 0; k < w.length && ok; k++) {
            const c = g[(y + dy * k) * n + x + dx * k];
            if (c === w[k]) ov++; else if (c) ok = false;
          }
          if (ok && ov < w.length) cand.push({ x, y, dx, dy, ov });
        }
        if (!cand.length) continue;
        /* prima si sceglie la direzione (così non escono quasi tutte orizzontali), poi la posizione */
        const ds = [...new Set(cand.map(q => q.dx + ',' + q.dy))];
        const dd = Z.pick(ds), inDir = cand.filter(q => q.dx + ',' + q.dy === dd);
        const best = Math.max(...inDir.map(q => q.ov));
        const c = Z.pick(Math.random() < 0.6 && best > 0 ? inDir.filter(q => q.ov === best) : inDir);
        const p = { w, x: c.x, y: c.y, dx: c.dx, dy: c.dy, len: w.length };
        for (const i of cellsOf(n, p)) { if (!g[i]) free--; g[i] = w[cellsOf(n, p).indexOf(i)]; }
        placed.push(p);
      }
      if (free > T || free < 4 || !KEY_BY_LEN[free]) continue;
      for (const key of Z.shuffle(KEY_BY_LEN[free].slice())) {
        const h = g.slice();
        let k = 0;
        for (let i = 0; i < N; i++) if (!h[i]) h[i] = key[k++];
        if (!placed.every(p => occurrences(h, n, p.w) === 1)) continue;
        placed.sort((a, b) => a.w < b.w ? -1 : 1);
        return { n, dir: opt.dir, topic: theme, g: h.join(''), words: placed, key };
      }
    }
    return null;
  }

  function hint(P, st) {
    const n = P.n;
    const left = P.words.map((p, i) => i).filter(i => !st.f[i]);
    if (!left.length) return null;
    const i = Z.pick(left), p = P.words[i];
    const s = Z.clone(st);
    s.f[i] = 1;
    /* la lettera della parola più rara nella griglia è la più facile da cercare */
    const count = L => P.g.split('').filter(c => c === L).length;
    let rare = p.w[0];
    for (const L of p.w) if (count(L) < count(rare)) rare = L;
    let why = `<b>${p.w}</b> comincia alla riga ${p.y + 1}, colonna ${p.x + 1} e prosegue ${DIR_NAME[p.dx + ',' + p.dy]}. `;
    why += `Per trovarla conviene partire dalla lettera più rara della parola, la <b>${rare}</b>: nella griglia ce ne sono solo ${count(rare)}, e intorno a ciascuna si controlla se continua la parola. `;
    why += left.length > 1 ? `Restano ${left.length - 1} parole.` : `Era l'ultima: le lettere rimaste formano la chiave <b>${P.key}</b>.`;
    return { state: s, focus: cellsOf(n, p), why };
  }

  Z.register({
    options: OPTIONS,
    id: 'wordsearch',
    name: 'Parole nascoste',
    hue: 100,
    tagline: 'Cerca le parole tra le lettere.',
    rules: `<p>Nella griglia sono nascoste tutte le parole dell'elenco, in fila dritta: in orizzontale, in verticale e, secondo la difficoltà, in diagonale o al contrario.</p>
      <p><b>Trascina il dito</b> dalla prima all'ultima lettera di una parola per segnarla. Le parole possono incrociarsi e condividere lettere.</p>
      <p>Quando le hai trovate tutte, le <b>lettere rimaste</b>, lette in ordine da sinistra a destra e dall'alto in basso, formano la <b>chiave</b>.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><text x="20" y="27" class="ic-t">A</text><text x="32" y="27" class="ic-t">M</text><text x="44" y="27" class="ic-t">O</text><text x="20" y="47" class="ic-t">R</text><text x="32" y="47" class="ic-t">E</text><text x="44" y="47" class="ic-t">L</text><rect x="12" y="13" width="40" height="19" rx="9.5" class="ic-st" fill="none"/></svg>`,
    generate,
    _check(P) {
      if (!P) return 'non generato';
      const free = P.g.length - new Set(P.words.flatMap(p => cellsOf(P.n, p))).size;
      if (free !== P.key.length) return 'chiave sbagliata';
      for (const p of P.words) {
        if (cellsOf(P.n, p).map(i => P.g[i]).join('') !== p.w) return 'parola fuori posto: ' + p.w;
        if (occurrences(P.g, P.n, p.w) !== 1) return 'NON unica: ' + p.w;
      }
      return '';
    },
    _test: { KEYS, KEY_BY_LEN, THEMES },
    init: P => ({ f: P.words.map(() => 0) }),
    solved: (P, s) => s.f.every(Boolean),
    hint,
    view(ctx) {
      const P = ctx.puzzle, n = P.n;
      let cur = null, drag = null;
      const el = Z.h('div.ws');
      el.style.setProperty('--n', n);
      const svg = Z.s('svg', { class: 'ws-caps', viewBox: `0 0 ${n} ${n}`, 'aria-hidden': 'true' });
      const capsG = Z.s('g', null, svg);
      const tmp = Z.s('line', { class: 'ws-cap ws-tmp' }, svg);
      const grid = Z.h('div.ws-grid');
      const cells = Z.range(n * n).map(i => { const c = Z.h('span.ws-c', { text: P.g[i] }); grid.append(c); return c; });
      el.append(svg, grid);

      const line = (ln, a, b) => {
        const ax = a % n + 0.5, ay = ((a / n) | 0) + 0.5, bx = b % n + 0.5, by = ((b / n) | 0) + 0.5;
        ln.setAttribute('x1', ax); ln.setAttribute('y1', ay); ln.setAttribute('x2', bx); ln.setAttribute('y2', by);
      };
      const cellAt = e => {
        const r = el.getBoundingClientRect();
        const fx = (e.clientX - r.left) / r.width * n, fy = (e.clientY - r.top) / r.height * n;
        return { fx, fy, x: Math.max(0, Math.min(n - 1, Math.floor(fx))), y: Math.max(0, Math.min(n - 1, Math.floor(fy))) };
      };
      /* la fine della riga va su una delle 8 direzioni e resta nella griglia */
      const endFrom = (s, e) => {
        const sx = s % n, sy = (s / n) | 0;
        const vx = e.fx - (sx + 0.5), vy = e.fy - (sy + 0.5);
        const len = Math.round(Math.max(Math.abs(vx), Math.abs(vy)));
        if (!len) return s;
        const a = Math.round(Math.atan2(vy, vx) / (Math.PI / 4));
        const dx = Math.round(Math.cos(a * Math.PI / 4)), dy = Math.round(Math.sin(a * Math.PI / 4));
        let k = len;
        while (k > 0 && (sx + dx * k < 0 || sx + dx * k >= n || sy + dy * k < 0 || sy + dy * k >= n)) k--;
        return (sy + dy * k) * n + sx + dx * k;
      };
      const stop = () => { drag = null; tmp.classList.remove('on'); };
      el.addEventListener('pointerdown', e => {
        if (!cur || (e.pointerType === 'mouse' && e.button !== 0)) return;
        e.preventDefault();
        const c = cellAt(e), s = c.y * n + c.x;
        drag = { s, e: s, id: e.pointerId };
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignorato */ }
        line(tmp, s, s);
        tmp.classList.add('on');
      });
      el.addEventListener('pointermove', e => {
        if (!drag || e.pointerId !== drag.id) return;
        drag.e = endFrom(drag.s, cellAt(e));
        line(tmp, drag.s, drag.e);
      });
      el.addEventListener('pointerup', e => {
        if (!drag || e.pointerId !== drag.id) return;
        const { s, e: t } = drag;
        stop();
        if (s === t) return;
        const i = P.words.findIndex((p, k) => {
          if (cur.f[k]) return false;
          const c = cellsOf(n, p);
          return (c[0] === s && c[c.length - 1] === t) || (c[0] === t && c[c.length - 1] === s);
        });
        if (i < 0) return;
        const ns = Z.clone(cur);
        ns.f[i] = 1;
        ctx.commit(ns);
      });
      el.addEventListener('pointercancel', stop);

      /* elenco delle parole e chiave */
      const head = Z.h('div.ws-head');
      const list = Z.h('div.ws-list');
      const items = P.words.map(p => { const b = Z.h('span.ws-w', { text: p.w }); list.append(b); return b; });
      const keyEl = Z.h('div.ws-key');
      ctx.controls.append(Z.h('div.ws-ctl', null, head, list, keyEl));

      /* modalità «Frecce»: «Inizio parola» sulla prima lettera, poi le frecce fino all'ultima e «Fine parola» */
      let from = -1;
      const aligned = (a, b) => { const dx = b % n - a % n, dy = ((b / n) | 0) - ((a / n) | 0); return !dx || !dy || Math.abs(dx) === Math.abs(dy); };
      const take = (s, t) => {
        if (s === t) return;
        const i = P.words.findIndex((p, k) => {
          if (cur.f[k]) return false;
          const c = cellsOf(n, p);
          return (c[0] === s && c[c.length - 1] === t) || (c[0] === t && c[c.length - 1] === s);
        });
        if (i < 0) { Z.flashEl(cells[t]); return; }
        const ns = Z.clone(cur);
        ns.f[i] = 1;
        ctx.commit(ns);
      };
      return {
        el, aspect: 1,
        cursor: () => Z.gridCursor(ctx, {
          w: n, h: n, el: i => cells[i],
          tip: 'Vai sulla prima lettera di una parola e tocca «Inizio parola».',
          keys: [{ label: (i, on) => (on ? 'Fine parola' : 'Inizio parola'), icon: Z.ICONS.pen, pen: true,
            tip: 'Vai sull\'ultima lettera (in diagonale: una freccia alla volta, a scaletta) e tocca «Fine parola».',
            act(j, prev) {
              if (!cur) return false;
              if (prev < 0) from = j;
              if (aligned(from, j)) { line(tmp, from, j); tmp.classList.add('on'); } else tmp.classList.remove('on');
              return true;
            },
            stop(j) { tmp.classList.remove('on'); if (from >= 0 && aligned(from, j)) take(from, j); from = -1; } }],
        }),
        render(s) {
          cur = s;
          capsG.innerHTML = '';
          P.words.forEach((p, i) => {
            items[i].classList.toggle('found', !!s.f[i]);
            if (!s.f[i]) return;
            const c = cellsOf(n, p);
            const ln = Z.s('line', { class: 'ws-cap', style: `--c:${(i * 67) % 360}` }, capsG);
            line(ln, c[0], c[c.length - 1]);
          });
          const done = s.f.filter(Boolean).length, all = done === P.words.length;
          head.textContent = `Tema: ${P.topic} · ${done} di ${P.words.length}`;
          const used = new Set(P.words.flatMap(p => cellsOf(n, p)));
          cells.forEach((c, i) => c.classList.toggle('ws-k', all && !used.has(i)));
          keyEl.innerHTML = all ? `Chiave: <b>${P.key}</b>` : 'Le lettere che restano formeranno la chiave.';
        },
        flash(list) { (list || []).forEach(i => Z.flashEl(cells[i])); },
      };
    },
  });
})();
