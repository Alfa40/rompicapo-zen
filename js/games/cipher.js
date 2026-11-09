/* Frase cifrata — ogni lettera è diventata un numero: scopri il proverbio */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'giv', label: 'Lettere date', def: 2, choices: [
      { v: 1, label: 'Tante', help: 'Cinque lettere sono già scoperte.' },
      { v: 2, label: 'Poche', help: 'Tre lettere sono già scoperte.' },
      { v: 3, label: 'Una', help: 'Una sola lettera è scoperta.' },
    ] },
    { id: 'len', label: 'Frase', def: 2, choices: [
      { v: 1, label: 'Corta' }, { v: 2, label: 'Media' }, { v: 3, label: 'Lunga' },
    ] },
  ];

  /* proverbi e modi di dire (lettere senza accenti; l'apostrofo resta scritto) */
  const PHRASES = `CHI VA PIANO VA SANO E VA LONTANO
CHI DORME NON PIGLIA PESCI
MEGLIO TARDI CHE MAI
L'UNIONE FA LA FORZA
NON TUTTE LE CIAMBELLE RIESCONO COL BUCO
RIDE BENE CHI RIDE ULTIMO
CHI TROPPO VUOLE NULLA STRINGE
TRA I DUE LITIGANTI IL TERZO GODE
PATTI CHIARI AMICIZIA LUNGA
IL MATTINO HA L'ORO IN BOCCA
CHI CERCA TROVA
GOCCIA A GOCCIA SI SCAVA LA PIETRA
L'ABITO NON FA IL MONACO
CAN CHE ABBAIA NON MORDE
OCCHIO NON VEDE CUORE NON DUOLE
A CAVAL DONATO NON SI GUARDA IN BOCCA
CHI SEMINA VENTO RACCOGLIE TEMPESTA
LA FORTUNA AIUTA GLI AUDACI
TANTO VA LA GATTA AL LARDO CHE CI LASCIA LO ZAMPINO
CHI HA TEMPO NON ASPETTI TEMPO
UNA RONDINE NON FA PRIMAVERA
L'APPETITO VIEN MANGIANDO
PAESE CHE VAI USANZA CHE TROVI
ACQUA CHETA ROMPE I PONTI
MEGLIO UN UOVO OGGI CHE UNA GALLINA DOMANI
IMPARA L'ARTE E METTILA DA PARTE
CHI LA DURA LA VINCE
LA PRATICA RENDE PERFETTI
CHI TACE ACCONSENTE
ROSSO DI SERA BEL TEMPO SI SPERA
APRILE OGNI GOCCIA UN BARILE
LE BUGIE HANNO LE GAMBE CORTE
IL LUPO PERDE IL PELO MA NON IL VIZIO
CHI SI ACCONTENTA GODE
NON RIMANDARE A DOMANI QUELLO CHE PUOI FARE OGGI
SBAGLIANDO SI IMPARA
CHI NON RISICA NON ROSICA
NON DIRE GATTO SE NON CE L'HAI NEL SACCO
MEGLIO SOLI CHE MALE ACCOMPAGNATI
AL CUOR NON SI COMANDA
PRESTO E BENE RARO AVVIENE
L'OCCASIONE FA L'UOMO LADRO
IL BUON GIORNO SI VEDE DAL MATTINO
NON SI VIVE DI SOLO PANE
CHI DI SPADA FERISCE DI SPADA PERISCE
TUTTE LE STRADE PORTANO A ROMA
ROMA NON FU FATTA IN UN GIORNO
IL RISO FA BUON SANGUE
UNA MELA AL GIORNO TOGLIE IL MEDICO DI TORNO
LA NOTTE PORTA CONSIGLIO
CHI TROVA UN AMICO TROVA UN TESORO
DOPO LA PIOGGIA TORNA IL SERENO
CHI VA CON LO ZOPPO IMPARA A ZOPPICARE
ANCHE L'OCCHIO VUOLE LA SUA PARTE
CHI NASCE TONDO NON PUO MORIRE QUADRATO
L'ERBA VOGLIO NON CRESCE NEMMENO NEL GIARDINO DEL RE
NON SVEGLIARE IL CAN CHE DORME
LA GATTA FRETTOLOSA FA I GATTINI CIECHI
A OGNI UCCELLO IL SUO NIDO E BELLO
CHI SI LODA SI IMBRODA
IL BUON VINO FA BUON SANGUE
QUATTRO OCCHI VEDONO MEGLIO DI DUE
CHI RISPARMIA GUADAGNA
DI NOTTE TUTTI I GATTI SONO BIGI
OGNI MEDAGLIA HA IL SUO ROVESCIO
TRA IL DIRE E IL FARE C'E DI MEZZO IL MARE
CHI BEN COMINCIA E A META DELL'OPERA
LA LINGUA BATTE DOVE IL DENTE DUOLE
UNA CILIEGIA TIRA L'ALTRA
CHI VUOL ESSER LIETO SIA`.split('\n').map(s => s.trim()).filter(Boolean);

  const lettersOf = t => t.replace(/[^A-Z]/g, '');

  function generate(opt) {
    const [lo, hi] = [[0, 0], [10, 24], [22, 34], [32, 99]][opt.len];
    const pool = PHRASES.filter(t => lettersOf(t).length >= lo && lettersOf(t).length <= hi);
    const text = Z.pick(pool.length ? pool : PHRASES);
    const used = [...new Set(lettersOf(text))];
    const nums = Z.shuffle(Z.range(26).map(i => i + 1));
    const code = {};
    used.forEach((L, i) => { code[L] = nums[i]; });
    /* lettere già scoperte: le meno frequenti, così il resto resta da ragionare */
    const freq = L => lettersOf(text).split('').filter(c => c === L).length;
    const k = [0, 5, 3, 1][opt.giv];
    const given = Z.shuffle(used.slice()).sort((a, b) => freq(a) - freq(b)).slice(0, Math.min(k, used.length - 2)).map(L => code[L]);
    return { text, code, given };
  }

  /* numero → lettera giusta */
  const decode = P => Object.fromEntries(Object.entries(P.code).map(([L, n]) => [n, L]));

  function hint(P, st) {
    const dec = decode(P), s = Z.clone(st);
    const wrong = Object.keys(st.m).filter(n => st.m[n] && st.m[n] !== dec[n]);
    if (wrong.length) {
      const n = wrong[0];
      s.m[n] = dec[n];
      return {
        state: s, focus: [+n], area: [+n], tag: 'wrong',
        tip: `C’è una lettera da cambiare. Leggi ad alta voce le parole con il numero <b>${n}</b>: sono parole vere?`,
        why: `Con la ${st.m[n]} al posto del numero <b>${n}</b> le parole non si capiscono. Il numero <b>${n}</b> è la <b>${dec[n]}</b>: l’ho cambiata io, ora le parole si leggono!`,
      };
    }
    const missing = Object.keys(dec).filter(n => st.m[n] !== dec[n]);
    if (!missing.length) return null;
    const words = P.text.split(/[ ']/).filter(Boolean);
    const shape = w => w.split('').map(c => (st.m[P.code[c]] === c ? c : '_')).join(' ');
    /* la parola quasi completa: con le lettere scoperte si capisce subito */
    let best = null;
    for (const w of words) {
      const miss = [...new Set(w.split('').filter(c => st.m[P.code[c]] !== c))];
      const known = w.length - w.split('').filter(c => st.m[P.code[c]] !== c).length;
      if (!miss.length || !known) continue;
      const sc = known / w.length;
      if (!best || sc > best.sc) best = { w, L: miss[0], sc, one: miss.length === 1 };
    }
    let L, why, tag;
    if (best) {
      L = best.L;
      tag = best.one ? 'word' : 'guessword';
      why = best.one
        ? `Guarda la parola «${shape(best.w)}»: manca una lettera sola. Può essere solo <b>${best.w}</b>! Quindi il numero <b>${P.code[L]}</b> è la <b>${L}</b>.`
        : `La parola «${shape(best.w)}» ha già tante lettere. Leggendola viene in mente <b>${best.w}</b>! Quindi il numero <b>${P.code[L]}</b> è la <b>${L}</b>.`;
    } else {
      /* nessun aiuto dalle parole: il numero più frequente è quasi sempre una vocale */
      const all = lettersOf(P.text).split('');
      const cnt = c => all.filter(x => x === c).length;
      L = missing.map(n => dec[n]).sort((a, b) => cnt(b) - cnt(a))[0];
      tag = 'freq';
      why = `Il numero <b>${P.code[L]}</b> è quello che si vede più spesso nella frase: ${cnt(L)} volte! Le lettere che usiamo di più sono le vocali, come E, A, I, O. Qui è la <b>${L}</b>.`;
    }
    const tip = tag === 'word' ? Z.say(`Guarda la parola «${shape(best.w)}»: le manca una lettera sola. Che parola è?`, `Nella parola «${shape(best.w)}» manca solo una lettera. Prova a dirla ad alta voce!`)
      : tag === 'guessword' ? `La parola «${shape(best.w)}» ha già tante lettere. Leggila ad alta voce: che parola può essere?`
      : 'Conta quante volte vedi ogni numero. Quello che vedi più spesso è quasi sempre una vocale: E, A, I oppure O.';
    s.m[P.code[L]] = L;
    return { state: s, focus: [P.code[L]], area: tag === 'freq' ? [] : [P.code[L]], why, tag, tip };
  }

  Z.register({
    options: OPTIONS,
    id: 'cipher',
    name: 'Frase cifrata',
    hue: 250,
    tagline: 'Ogni numero nasconde una lettera.',
    rules: Z.rules({
      goal: `Scopri il <b>proverbio</b> nascosto.`,
      rules: [
        `Ogni lettera del proverbio è stata cambiata con un <b>numero</b>, scritto sotto la sua casella.`,
        `Lettere uguali hanno sempre lo stesso numero; lettere diverse hanno numeri diversi.`,
        `Qualche lettera è già scoperta per cominciare. Gli spazi e gli apostrofi restano dove sono.`,
      ],
      play: [
        `Tocca una casella e scrivi la lettera con la tastiera: compare in tutte le caselle con lo stesso numero.`,
        `Per cambiarla, riscrivila sopra o cancellala.`,
      ],
      start: `Parti dalle parole corte: una lettera sola di solito è E, A, O o I; due lettere possono essere IL, LA, DI, CHI, NON… In italiano quasi tutte le parole finiscono con una vocale, e la lettera più frequente è spesso la E o la A.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="14" width="14" height="18" rx="3" class="ic-a"/><rect x="25" y="14" width="14" height="18" rx="3" class="ic-s ic-st"/><rect x="42" y="14" width="14" height="18" rx="3" class="ic-s ic-st"/><text x="15" y="27" class="ic-t ic-w">A</text><text x="15" y="47" class="ic-t ic-sm">7</text><text x="32" y="47" class="ic-t ic-sm">12</text><text x="49" y="47" class="ic-t ic-sm">3</text></svg>`,
    generate,
    _check(P) {
      const nums = Object.values(P.code);
      return new Set(nums).size === nums.length && P.given.length < nums.length ? '' : 'codice non valido';
    },
    init: P => {
      const dec = decode(P), m = {};
      for (const n of Object.keys(dec)) m[n] = '';
      for (const n of P.given) m[n] = dec[n];
      return { m };
    },
    solved: (P, s) => Object.entries(decode(P)).every(([n, L]) => s.m[n] === L),
    progress(P, s) { const d = decode(P); let ok = 0, bad = 0; for (const n in d) { if (s.m[n] === d[n]) ok++; else if (s.m[n]) bad++; } return { ok, bad }; },
    hint,
    view(ctx) {
      const P = ctx.puzzle, dec = decode(P), giv = new Set(P.given.map(String));
      let cur = null, sel = null, at = -1;
      /* righe di al massimo COLS caselle, senza spezzare le parole */
      const COLS = 11;
      const words = P.text.split(' ');
      const lines = [[]];
      for (const w of words) {
        const L = lines[lines.length - 1];
        const need = (L.length ? L.length + 1 : 0) + w.length;
        if (need > COLS && L.length) lines.push([]);
        const T = lines[lines.length - 1];
        if (T.length) T.push(' ');
        T.push(...w.split(''));
      }
      const el = Z.h('div.cf');
      el.style.setProperty('--cols', COLS);
      const box = Z.h('div.cf-lines');
      const cells = [];
      for (const ln of lines) {
        const row = Z.h('div.cf-row');
        for (const ch of ln) {
          if (ch === ' ') { row.append(Z.h('span.cf-gap')); continue; }
          if (ch === "'") { row.append(Z.h('span.cf-apo', { text: '’' })); continue; }
          const n = P.code[ch];
          const l = Z.h('span.cf-l');
          const c = Z.h('span.cf-c', null, l, Z.h('span.cf-n', { text: n }));
          c.dataset.n = n;
          const k = cells.length;
          c.addEventListener('pointerdown', e => { e.preventDefault(); sel = String(n); at = k; paint(); });
          row.append(c);
          cells.push({ c, l, n: String(n), row: lines.indexOf(ln) });
        }
        box.append(row);
      }
      el.append(box);
      const rows = lines.length;
      const order = [...new Set(cells.map(c => c.n))];

      const info = Z.h('div.cf-info');
      ctx.controls.append(Z.h('div.cw-ctl', null, info, Z.letterPad(type, erase)));

      function type(L) {
        if (!cur) return;
        if (!sel) sel = order.find(n => !cur.m[n]) || order[0];
        if (giv.has(sel)) return;
        const s = Z.clone(cur);
        /* una lettera vale per un numero solo: se era altrove, lì si toglie */
        for (const n in s.m) if (s.m[n] === L && !giv.has(n)) s.m[n] = '';
        s.m[sel] = L;
        ctx.commit(s);
        sel = order.find(n => !cur.m[n]) || sel;
        paint();
      }
      function erase() {
        if (!cur || !sel || giv.has(sel) || !cur.m[sel]) return;
        const s = Z.clone(cur);
        s.m[sel] = '';
        ctx.commit(s);
      }
      function paint() {
        if (!cur) return;
        for (const { c, l, n } of cells) {
          l.textContent = cur.m[n] || '';
          c.classList.toggle('given', giv.has(n));
          c.classList.toggle('sel', n === sel);
        }
        if (sel && (at < 0 || cells[at].n !== sel)) at = cells.findIndex(o => o.n === sel);
        if (at >= 0) ctx.mark(cells[at].c, true);
        const found = Object.values(cur.m).filter(Boolean).length, all = Object.keys(dec).length;
        info.innerHTML = sel
          ? `Numero <b>${sel}</b> · ${cur.m[sel] ? `ora è la <b>${cur.m[sel]}</b>` : 'scrivi la lettera'} · lettere ${found} di ${all}`
          : `Tocca una casella e scrivi una lettera · lettere ${found} di ${all}`;
      }
      return {
        el, aspect: COLS / (rows * 1.55 + 0.3), letters: true,
        render(s) { cur = s; paint(); },
        /* modalità «Frecce»: destra/sinistra vanno alla casella vicina, su/giù alla riga sopra o sotto */
        cursor() {
          const go = d => {
            if (at < 0) at = 0;
            else if (d === 'l' || d === 'r') at = Math.max(0, Math.min(cells.length - 1, at + (d === 'r' ? 1 : -1)));
            else {
              const row = cells[at].row + (d === 'd' ? 1 : -1), x = cells[at].c.getBoundingClientRect().left;
              let best = -1, bd = 1e9;
              cells.forEach((o, k) => { if (o.row === row) { const dd = Math.abs(o.c.getBoundingClientRect().left - x); if (dd < bd) { bd = dd; best = k; } } });
              if (best >= 0) at = best;
            }
            sel = cells[at].n;
            paint();
          };
          return { el: Z.arrowPad({ compact: true, onDir: go }).el };
        },
        flash(list) { const set = new Set((list || []).map(String)); cells.forEach(o => { if (set.has(o.n)) Z.flashEl(o.c); }); },
        onKey(e) {
          if (e.ctrlKey || e.metaKey || e.altKey) return false;
          if (/^[a-zA-Z]$/.test(e.key)) { type(e.key.toUpperCase()); return true; }
          if (e.key === 'Backspace' || e.key === 'Delete') { erase(); return true; }
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            const i = order.indexOf(sel), k = e.key === 'ArrowRight' ? 1 : -1;
            sel = order[(i + k + order.length) % order.length]; paint(); return true;
          }
          return false;
        },
      };
    },
  });
})();
