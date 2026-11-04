/* Anagrammi — rimetti in ordine le lettere, aiutandoti con la definizione */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'cnt', label: 'Parole', def: 5, choices: [{ v: 3, label: '3' }, { v: 5, label: '5' }, { v: 7, label: '7' }] },
    { id: 'len', label: 'Lunghezza', def: 2, choices: [
      { v: 1, label: 'Corte', help: 'Parole di 4 o 5 lettere.' },
      { v: 2, label: 'Medie', help: 'Parole di 6 o 7 lettere.' },
      { v: 3, label: 'Lunghe', help: 'Parole di 8 lettere o più.' },
    ] },
  ];
  const RANGE = { 1: [4, 5], 2: [6, 7], 3: [8, 11] };
  const sortKey = w => w.split('').sort().join('');

  /* il dizionario con le definizioni è quello del cruciverba (crossword.js) */
  let byKey = null;
  const dict = () => {
    if (!byKey) {
      byKey = {};
      for (const w of Z.DICT.WORDS) (byKey[sortKey(w)] = byKey[sortKey(w)] || []).push(w);
    }
    return Z.DICT;
  };

  function scramble(w) {
    for (let t = 0; t < 200; t++) {
      const s = Z.shuffle(w.split('')).join('');
      /* niente parole vere e almeno metà delle lettere fuori posto */
      const same = s.split('').filter((c, i) => c === w[i]).length;
      if (s !== w && !dict().CLUE[s] && same <= w.length / 2) return s;
    }
    return w.split('').reverse().join('');
  }

  function generate(opt) {
    const D = dict(), [a, b] = RANGE[opt.len];
    /* solo parole che non hanno altri anagrammi nel dizionario: la soluzione è una sola */
    const pool = D.WORDS.filter(w => w.length >= a && w.length <= b && byKey[sortKey(w)].length === 1
      && new Set(w).size > 1);
    const words = Z.shuffle(pool.slice()).slice(0, opt.cnt);
    return { words: words.map(w => ({ w, clue: D.CLUE[w], start: scramble(w) })) };
  }

  function hint(P, st) {
    const left = P.words.map((x, i) => i).filter(i => st.o[i] !== P.words[i].w);
    if (!left.length) return null;
    /* la parola con più lettere già al posto giusto */
    const okCount = i => st.o[i].split('').filter((c, k) => c === P.words[i].w[k]).length;
    const i = left.sort((x, y) => okCount(y) / P.words[y].w.length - okCount(x) / P.words[x].w.length)[0];
    const p = P.words[i], s = Z.clone(st);
    s.o[i] = p.w;
    const k = okCount(i);
    let why = `«${p.clue}»: con le lettere ${p.start.split('').sort().join(' ')} si forma <b>${p.w}</b>. `;
    why += k ? `Avevi già ${k} lettere al posto giusto. ` : '';
    why += 'Un metodo: cerca i gruppi di lettere che in italiano stanno spesso insieme (CH, GL, GN, SC, -ONE, -INO, -ATO) e prova a metterli in fondo o all\'inizio.';
    return { state: s, focus: [i], why };
  }

  Z.register({
    options: OPTIONS,
    id: 'anagram',
    name: 'Anagrammi',
    hue: 330,
    tagline: 'Lettere in disordine, parole da ritrovare.',
    rules: `<p>Ogni riga è una parola con le lettere <b>mescolate</b>; sopra c'è la sua <b>definizione</b>.</p>
      <p>Tocca una lettera e poi un'altra della stessa parola per <b>scambiarle di posto</b>. Quando la parola è giusta si colora.</p>
      <p>Ogni gruppo di lettere forma una sola parola del dizionario del gioco.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="6" y="22" width="16" height="20" rx="4" class="ic-s ic-st"/><rect x="24" y="22" width="16" height="20" rx="4" class="ic-a"/><rect x="42" y="22" width="16" height="20" rx="4" class="ic-s ic-st"/><text x="14" y="36" class="ic-t">O</text><text x="32" y="36" class="ic-t ic-w">R</text><text x="50" y="36" class="ic-t">A</text><path d="M14 16c6-6 30-6 36 0M50 48c-6 6-30 6-36 0" class="ic-l2"/></svg>`,
    generate,
    _check(P) {
      dict();
      for (const p of P.words) {
        if (sortKey(p.start) !== sortKey(p.w) || p.start === p.w) return 'anagramma sbagliato: ' + p.w;
        if (byKey[sortKey(p.w)].length !== 1) return 'NON unico: ' + p.w;
      }
      return new Set(P.words.map(p => p.w)).size === P.words.length ? '' : 'parole ripetute';
    },
    init: P => ({ o: P.words.map(p => p.start) }),
    solved: (P, s) => P.words.every((p, i) => s.o[i] === p.w),
    hint,
    view(ctx) {
      const P = ctx.puzzle;
      let cur = null, sel = null;
      const cols = Math.max(7, ...P.words.map(p => p.w.length));
      const el = Z.h('div.an');
      el.style.setProperty('--rows', P.words.length);
      el.style.setProperty('--cols', cols);
      const rows = P.words.map((p, i) => {
        const tiles = Z.range(p.w.length).map(k => {
          const t = Z.h('button.an-t', { type: 'button' });
          t.addEventListener('pointerdown', e => {
            e.preventDefault();
            if (!cur || cur.o[i] === p.w) return;
            if (!sel || sel.i !== i) { sel = { i, k }; paint(); return; }
            if (sel.k === k) { sel = null; paint(); return; }
            const s = Z.clone(cur), a = s.o[i].split('');
            [a[sel.k], a[k]] = [a[k], a[sel.k]];
            s.o[i] = a.join('');
            sel = null;
            ctx.commit(s);
          });
          return t;
        });
        const r = Z.h('div.an-row', null, Z.h('div.an-clue', { text: p.clue }), Z.h('div.an-tiles', null, ...tiles));
        el.append(r);
        return { r, tiles };
      });
      function paint() {
        if (!cur) return;
        P.words.forEach((p, i) => {
          const ok = cur.o[i] === p.w;
          rows[i].r.classList.toggle('ok', ok);
          rows[i].tiles.forEach((t, k) => {
            t.textContent = cur.o[i][k];
            t.classList.toggle('sel', !!sel && sel.i === i && sel.k === k);
          });
        });
      }
      return {
        el, aspect: cols / (P.words.length * 1.9),
        render(s) { cur = s; if (sel && cur.o[sel.i] === P.words[sel.i].w) sel = null; paint(); },
        flash(list) { (list || []).forEach(i => Z.flashEl(rows[i].r)); },
      };
    },
  });
})();
