/* Stelle (Star Battle) — regioni generate e ritoccate fino a soluzione unica */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 10, choices: [{ v: 7, label: '7×7' }, { v: 8, label: '8×8' }, { v: 9, label: '9×9' }, { v: 10, label: '10×10' }, { v: 11, label: '11×11' }] },
    { id: 'k', label: 'Stelle', def: 2, choices: [
      { v: 1, label: '1 per riga' }, { v: 2, label: '2 per riga', help: 'Due stelle per riga, colonna e regione: serve una griglia da almeno 8×8.', need: o => o.size >= 8 },
    ] },
    { id: 'tec', label: 'Ragionamenti', def: 2, choices: [
      { v: 1, label: 'Semplici', help: 'Posti obbligati e caselle attorno alle stelle. Solo con una stella per riga.', need: o => o.k === 1 || o.size < 8 },
      { v: 2, label: 'Medi', help: 'Anche «immagina una stella qui» e regioni chiuse in una riga.' },
      { v: 3, label: 'Avanzati', help: 'Anche gruppi di regioni chiusi in più righe. Mai tentativi a caso.' },
    ] },
  ];

  function rowSets(n, k) {
    const out = [];
    (function rec(start, cur) {
      if (cur.length === k) { out.push(cur.slice()); return; }
      for (let c = start; c < n; c++) {
        if (cur.length && c - cur[cur.length - 1] < 2) continue;
        cur.push(c); rec(c + 1, cur); cur.pop();
      }
    })(0, []);
    return out;
  }
  const touches = (a, b) => a.some(x => b.some(y => Math.abs(x - y) <= 1));

  function genStars(n, k, sets) {
    const colCnt = new Array(n).fill(0), rows = [];
    let steps = 0;
    const rec = r => {
      if (++steps > 200000) return false;
      if (r === n) return colCnt.every(c => c === k);
      for (const s of Z.shuffle(sets.slice())) {
        if (s.some(c => colCnt[c] >= k)) continue;
        if (r > 0 && touches(rows[r - 1], s)) continue;
        s.forEach(c => colCnt[c]++);
        const rem = n - r - 1;
        if (colCnt.every(c => k - c <= rem)) { rows[r] = s; if (rec(r + 1)) return true; }
        s.forEach(c => colCnt[c]--);
      }
      return false;
    };
    return rec(0) ? rows : null;
  }

  function nb4(n, i) {
    const x = i % n, y = (i / n) | 0, r = [];
    if (x > 0) r.push(i - 1); if (x < n - 1) r.push(i + 1); if (y > 0) r.push(i - n); if (y < n - 1) r.push(i + n);
    return r;
  }

  function genRegions(n, k, stars) {
    const N = n * n, reg = new Int16Array(N).fill(-1), isStar = new Uint8Array(N);
    stars.forEach(i => { isStar[i] = 1; });
    if (k === 1) stars.forEach((s, r) => { reg[s] = r; });
    else {
      const un = Z.shuffle(stars.slice());
      let id = 0;
      while (un.length) {
        const a = un.pop();
        un.sort((p, q) => (Math.abs(p % n - a % n) + Math.abs(((p / n) | 0) - ((a / n) | 0))) - (Math.abs(q % n - a % n) + Math.abs(((q / n) | 0) - ((a / n) | 0))));
        let joined = false;
        for (let t = 0; t < un.length && !joined; t++) {
          const b = un[t];
          /* BFS da a verso b attraverso celle libere non stella */
          const prev = new Int16Array(N).fill(-2);
          prev[a] = -1;
          const q = [a];
          while (q.length && prev[b] === -2) {
            const c = q.shift();
            for (const d of nb4(n, c)) {
              if (prev[d] !== -2 || reg[d] >= 0) continue;
              if (isStar[d] && d !== b) continue;
              prev[d] = c; q.push(d);
            }
          }
          if (prev[b] === -2) continue;
          for (let c = b; c !== -1; c = prev[c]) reg[c] = id;
          un.splice(t, 1);
          joined = true;
        }
        if (!joined) return null;
        id++;
      }
    }
    for (;;) {
      const free = [];
      for (let i = 0; i < N; i++) if (reg[i] < 0 && nb4(n, i).some(j => reg[j] >= 0)) free.push(i);
      if (!free.length) break;
      const i = Z.pick(free);
      reg[i] = reg[Z.pick(nb4(n, i).filter(j => reg[j] >= 0))];
    }
    return Array.from(reg);
  }

  /* Risolutore riga per riga con maschere di bit; restituisce fino a "limit" soluzioni (null se troppo lungo) */
  function solve(n, k, reg, limit, sets) {
    const masks = sets.map(st => st.reduce((m, c) => m | (1 << c), 0));
    const near = masks.map(m => m | (m << 1) | (m >> 1));
    const regOf = sets.map(() => null);
    const colCnt = new Int8Array(n), regCnt = new Int8Array(n), rows = [], sols = [];
    /* celle di ogni regione nelle righe da r in poi, e per regione la prima riga dopo cui non ha più celle */
    const after = Z.range(n + 1).map(() => new Int16Array(n));
    for (let r = n - 1; r >= 0; r--) {
      after[r].set(after[r + 1]);
      for (let c = 0; c < n; c++) after[r][reg[r * n + c]]++;
    }
    /* righe "minime" ancora necessarie per riempire le regioni: ogni riga ospita al massimo k stelle */
    let nodes = 0, full = 0;
    const LIMIT = 400000;
    const rec = (r, prevNear) => {
      if (sols.length >= limit || ++nodes > LIMIT) return;
      if (r === n) { sols.push(rows.slice()); return; }
      const rem = n - r - 1;
      const rowRegs = reg.slice(r * n, r * n + n);
      for (let si = 0; si < masks.length; si++) {
        const m = masks[si];
        if ((m & full) || (m & prevNear)) continue;
        const cs = sets[si];
        let ok = true;
        for (const c of cs) { const R = rowRegs[c]; if (++regCnt[R] > k) ok = false; if (++colCnt[c] === k) full |= 1 << c; }
        if (ok) {
          const af = after[r + 1];
          let need = 0;
          for (let R = 0; R < n; R++) {
            const miss = k - regCnt[R];
            if (miss > af[R]) { ok = false; break; }
            need += miss;
          }
          if (ok && need > rem * k) ok = false;
          for (let c = 0; c < n && ok; c++) if (k - colCnt[c] > rem) ok = false;
        }
        if (ok) { rows[r] = cs; rec(r + 1, near[si]); }
        for (const c of cs) { regCnt[rowRegs[c]]--; if (colCnt[c]-- === k) full &= ~(1 << c); }
        if (sols.length >= limit || nodes > LIMIT) return;
      }
    };
    rec(0, 0);
    return nodes > LIMIT ? null : sols;
  }


  function connectedWithout(n, reg, R, skip) {
    const cells = [];
    for (let i = 0; i < n * n; i++) if (reg[i] === R && i !== skip) cells.push(i);
    if (!cells.length) return false;
    const seen = new Set([cells[0]]), q = [cells[0]];
    while (q.length) {
      const c = q.pop();
      for (const d of nb4(n, c)) if (d !== skip && reg[d] === R && !seen.has(d)) { seen.add(d); q.push(d); }
    }
    return seen.size === cells.length;
  }

  /* rompicapo con una sola soluzione (le regioni si ritoccano finché non è unica) */
  function genUnique(opt) {
    const n = opt.size, k = n < 8 ? 1 : opt.k, sets = rowSets(n, k);
    for (let att = 0; att < 200; att++) {
      const rows = genStars(n, k, sets);
      if (!rows) continue;
      const stars = [];
      rows.forEach((s, r) => s.forEach(c => stars.push(r * n + c)));
      const reg = genRegions(n, k, stars);
      if (!reg) continue;
      const isStar = new Set(stars);
      for (let it = 0; it < 150; it++) {
        const sols = solve(n, k, reg, 2, sets);
        if (!sols) break;
        if (sols.length === 1) return { n, k, reg, sol: stars.slice().sort((a, b) => a - b) };
        const alt = sols.find(s => s.some((cs, r) => cs.join() !== rows[r].join()));
        const altStars = [];
        alt.forEach((s, r) => s.forEach(c => altStars.push(r * n + c)));
        let moved = false;
        for (const c of Z.shuffle(altStars.filter(i => !isStar.has(i)))) {
          const R1 = reg[c];
          const opts = Z.shuffle(nb4(n, c).map(j => reg[j]).filter(R => R !== R1));
          if (!opts.length || !connectedWithout(n, reg, R1, c)) continue;
          reg[c] = opts[0];
          moved = true;
          break;
        }
        if (!moved) break;
      }
    }
    return null;
  }

  /* ---------- Risolutore «umano» ----------
     Stato: 0 libera, 1 stella, 2 vuota (puntino). Solo ragionamenti che una persona può fare, un passo alla volta:
     livello 1: posti obbligati, caselle attorno a una stella, righe/colonne/regioni già complete;
     livello 2: «immagina una stella qui» (le conseguenze immediate lasciano una zona senza posto) e
                una regione chiusa dentro una riga o colonna (e viceversa);
     livello 3: gruppi di regioni chiusi dentro più righe o colonne, e «immagina» seguendo la catena di conseguenze.
     Se risolve tutta la griglia, la soluzione è anche unica. */
  function makeSolver(P) {
    const n = P.n, k = P.k, N = n * n;
    const rows = Z.range(n).map(r => ({ kind: 'row', name: `la riga ${r + 1}`, cells: Z.range(n).map(c => r * n + c) }));
    const cols = Z.range(n).map(c => ({ kind: 'col', name: `la colonna ${c + 1}`, cells: Z.range(n).map(r => r * n + c) }));
    const regs = Z.range(n).map(R => ({ kind: 'reg', name: 'la regione che si illumina', cells: Z.range(N).filter(i => P.reg[i] === R) }));
    const units = [...rows, ...cols, ...regs];
    const unitsOf = Z.range(N).map(i => [rows[(i / n) | 0], cols[i % n], regs[P.reg[i]]]);
    const touch = (a, b) => Math.abs(((a / n) | 0) - ((b / n) | 0)) <= 1 && Math.abs(a % n - b % n) <= 1;
    const around = Z.range(N).map(i => Z.range(N).filter(j => j !== i && touch(i, j)));
    const need = (c, U) => { let s = k; for (const i of U.cells) if (c[i] === 1) s--; return s; };
    const free = (c, U) => U.cells.filter(i => c[i] === 0);
    const fits = (fr, m) => m <= 0 || (m === 1 ? fr.length > 0 : fr.some((a, x) => fr.some((b, y) => y > x && !touch(a, b))));
    const stars = (c, m) => (m === 1 ? 'la sua stella' : m === k ? `le sue ${k} stelle` : 'la stella che le manca');
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    /* una zona impossibile: troppe stelle, stelle che si toccano, o non c'è più posto */
    function broken(c) {
      for (let i = 0; i < N; i++) if (c[i] === 1 && around[i].some(j => c[j] === 1)) return unitsOf[i][0];
      for (const U of units) { const m = need(c, U); if (m < 0 || !fits(free(c, U), m)) return U; }
      return null;
    }
    const lineList = (W, word) => (W.length === 1 ? W[0].name : `le ${word} ${Z.fmtList(W.map(U => +U.name.split(' ').pop()))}`);

    /* livello 1 */
    function basic(c) {
      for (const U of units) {
        const m = need(c, U), fr = free(c, U);
        if (m > 0 && fr.length === m) return {
          lv: 1, tag: 'place', set: fr.map(i => [i, 1]), focus: fr, area: U.cells,
          tip: Z.say(`Guarda ${U.name}: quante stelle le mancano, e quanti posti liberi le restano?`, `Conta i posti liberi in ${U.name}: sono proprio quanti ne servono?`) +
            ' Quando i posti liberi sono esattamente quante le stelle che mancano, la scelta è obbligata.',
          why: `In ${U.name} ${m === 1 ? 'manca una stella' : 'mancano ' + m + ' stelle'} e ${fr.length === 1 ? 'resta un solo posto libero' : 'restano solo ' + fr.length + ' posti liberi'} (le altre caselle sono già escluse): ${fr.length === 1 ? 'la stella va lì' : 'le stelle vanno lì'}.`,
        };
      }
      for (let i = 0; i < N; i++) {
        if (c[i] !== 1) continue;
        const fr = around[i].filter(j => c[j] === 0);
        if (fr.length) return {
          lv: 1, tag: 'touch', set: fr.map(j => [j, 2]), focus: fr, area: [i],
          tip: `Guarda la stella in ${Z.cellName(i, n)}: cosa puoi dire delle caselle che la circondano? Segnarle aiuta a vedere dove restano posti liberi.`,
          why: 'Le stelle non possono toccarsi, nemmeno in diagonale: tutte le caselle attorno a questa stella sono vuote. Le ho segnate con un puntino.',
        };
      }
      for (const U of units) {
        const fr = free(c, U);
        if (need(c, U) === 0 && fr.length) return {
          lv: 1, tag: 'full', set: fr.map(j => [j, 2]), focus: fr, area: U.cells,
          tip: `${cap(U.name)} ha già ${k === 1 ? 'la sua stella' : 'tutte le sue stelle'}: cosa vuol dire per le altre caselle? Segnarle con un puntino rende la griglia più chiara.`,
          why: `${cap(U.name)} ha già ${k === 1 ? 'la sua stella' : 'le sue ' + k + ' stelle'}: le altre caselle sono vuote. Le ho segnate con un puntino.`,
        };
      }
      return null;
    }
    /* «immagina una stella qui»: conseguenze immediate (o a catena) e una zona resta senza posto */
    /* conseguenze di un'ipotesi: prima quelle immediate, poi (deep) le mosse obbligate a catena */
    function suppose(c, i, v, deep) {
      const t = c.slice();
      t[i] = v;
      if (v === 1) {
        for (const j of around[i]) if (t[j] === 0) t[j] = 2;
        for (const U of unitsOf[i]) if (need(t, U) === 0) for (const j of U.cells) if (t[j] === 0) t[j] = 2;
      }
      let U = broken(t);
      for (let it = 0; deep && it < 300 && !U; it++) {
        const d = basic(t) || confine(t, 1, 1);
        if (!d) break;
        for (const [j, x] of d.set) t[j] = x;
        U = broken(t);
      }
      return U && { U, m: need(t, U) };
    }
    function imagine(c, deep) {
      for (const v of deep ? [1, 2] : [1]) for (let i = 0; i < N; i++) {
        if (c[i] !== 0) continue;
        const r = suppose(c, i, v, deep);
        if (!r) continue;
        const { U, m } = r, where = Z.cellName(i, n);
        const end = `${U.name} ${m < 0 ? 'avrebbe troppe stelle' : 'non avrebbe più spazio per ' + stars(c, Math.max(1, m))}.`;
        if (v === 2) return {
          lv: 3, tag: 'imagine', set: [[i, 1]], focus: [i], area: [i, ...U.cells],
          tip: `Prova a immaginare che in ${Z.cellName(i, n)} non ci sia una stella: seguendo le mosse che diventano obbligate, cosa succederebbe a ${U.name}?`,
          why: `Immagina che in ${where} non ci sia una stella: seguendo le mosse obbligate che ne vengono, ${end} Quindi lì ci va proprio una stella.`,
        };
        return {
          lv: deep ? 3 : 2, tag: 'imagine', set: [[i, 2]], focus: [i], area: [i, ...U.cells],
          tip: `Prova a immaginare una stella in ${where}: le caselle attorno diventerebbero vuote${deep ? ', e da lì altre mosse diventerebbero obbligate' : ''}. Cosa succederebbe a ${U.name}?`,
          why: `Immagina una stella in ${where}: le caselle attorno diventerebbero vuote` +
            (deep ? ' e, seguendo le mosse obbligate che ne vengono, ' : ' e ') + end + ' Quindi lì non può esserci una stella: ci va un puntino.',
        };
      }
      return null;
    }
    /* regioni chiuse dentro m righe (o colonne) consecutive */
    function confine(c, m1, m2) {
      for (const [dir, word] of [[rows, 'righe'], [cols, 'colonne']]) for (let m = m1; m <= m2; m++) for (let a = 0; a + m <= n; a++) {
        const W = dir.slice(a, a + m), inW = new Set(W.flatMap(U => U.cells));
        let quota = 0;
        for (const U of W) quota += need(c, U);
        if (quota <= 0) continue;
        const touching = regs.filter(R => need(c, R) > 0 && free(c, R).some(i => inW.has(i)));
        const inside = touching.filter(R => free(c, R).every(i => inW.has(i)));
        const sum = L => L.reduce((s, R) => s + need(c, R), 0);
        const lines = lineList(W, word), one = inside.length === 1;
        if (inside.length && sum(inside) === quota) {
          const own = new Set(inside.flatMap(R => R.cells));
          const out = [...inW].filter(i => c[i] === 0 && !own.has(i));
          if (out.length) return {
            lv: m === 1 ? 2 : 3, tag: 'advanced', set: out.map(i => [i, 2]), focus: out, area: [...own].filter(i => inW.has(i) || c[i] === 0),
            tip: `Guarda ${one ? 'la regione che si illumina' : 'le regioni che si illuminano'}: ${one ? 'i suoi posti liberi stanno' : 'i loro posti liberi stanno'} tutti dentro ${lines}. Cosa vuol dire per le altre caselle di ${m === 1 ? 'quella ' + (word === 'righe' ? 'riga' : 'colonna') : 'quelle ' + word}?`,
            why: `${one ? 'La regione che si illumina ha' : 'Le regioni che si illuminano hanno'} tutti i posti liberi dentro ${lines}, e ${one ? 'le servono' : 'servono loro'} proprio le ${quota === 1 ? 'stella che manca' : quota + ' stelle che mancano'} ${m === 1 ? 'lì' : 'a quelle ' + word}. Quindi nelle altre caselle di ${m === 1 ? 'quella ' + (word === 'righe' ? 'riga' : 'colonna') : 'quelle ' + word} non ci sono stelle.`,
          };
        }
        if (touching.length && touching.length > inside.length && sum(touching) === quota) {
          const out = touching.flatMap(R => free(c, R).filter(i => !inW.has(i)));
          if (out.length) {
            const one2 = touching.length === 1;
            return {
              lv: m === 1 ? 2 : 3, tag: 'advanced', set: out.map(i => [i, 2]), focus: out, area: [...inW],
              tip: `Guarda ${lines}: ${quota === 1 ? 'manca una stella' : 'mancano ' + quota + ' stelle'}. Quali regioni possono dargliele?`,
              why: `A ${lines} ${quota === 1 ? 'manca una stella' : 'mancano ' + quota + ' stelle'}, e possono dargliele solo ${one2 ? 'una regione, che ne ha bisogno' : touching.length + ' regioni, che ne hanno bisogno'} proprio di ${quota}. Quindi ${one2 ? 'quella regione mette' : 'quelle regioni mettono'} lì tutte le stelle che le mancano: le loro caselle fuori da ${lines} sono vuote.`,
            };
          }
        }
      }
      return null;
    }
    function step(c, L) {
      return basic(c) || (L >= 2 && (confine(c, 1, 1) || imagine(c, false))) || (L >= 3 && (confine(c, 2, n - 1) || imagine(c, true))) || null;
    }
    const done = c => { let s = 0; for (let i = 0; i < N; i++) if (c[i] === 1) s++; return s === n * k && !broken(c); };
    return {
      step,
      solve(L) {
        const c = new Array(N).fill(0);
        for (const i of P.given || []) c[i] = 1;
        let hard = 1;
        for (let it = 0; it < 4 * N; it++) {
          if (done(c)) return { ok: true, hard, c };
          const d = step(c, L);
          if (!d) return { ok: false, hard, c };
          for (const [i, v] of d.set) c[i] = v;
          if (d.lv > hard) hard = d.lv;
          if (broken(c)) return { ok: false, hard, c };
        }
        return { ok: false, hard, c };
      },
    };
  }
  const solvers = new WeakMap();
  const solverOf = P => { let s = solvers.get(P); if (!s) { s = makeSolver(P); solvers.set(P, s); } return s; };

  /* Si tengono solo rompicapo risolvibili ragionando al livello scelto (Ragionamenti), preferendo quelli che lo
     usano davvero: mai tentativi a caso. */
  let fallbackUsed = 0;
  function generate(opt) {
    let L = Math.min(3, Math.max(1, opt.tec || 2));
    const t0 = Z.now();
    let best = null, last = null;
    for (let t = 0; t < 5000; t++) {
      const el = Z.now() - t0;
      if (best && (best.hard === L || el > 2000)) break;
      if (el > 5000) { fallbackUsed++; break; }
      /* se a questo livello non se ne trova uno in fretta, si accetta anche il livello sopra */
      if (!best && el > 700 * (4 - L) && L < 3) L++;
      const P = genUnique(opt);
      if (!P) continue;
      last = P;
      const r = makeSolver(P).solve(L);
      if (r.ok && (!best || r.hard > best.hard)) best = { P, hard: r.hard };
    }
    if (best) return best.P;
    /* non trovata in tempo: si mettono alcune stelle già al loro posto dove il ragionamento si ferma */
    const P = last || genUnique(opt);
    if (!P) return null;
    P.given = [];
    const n = P.n;
    for (let k = 0; k < P.sol.length; k++) {
      const r = makeSolver(P).solve(3);
      if (r.ok) return P;
      const open = P.sol.filter(i => r.c[i] === 0);
      if (!open.length) break;
      /* la stella che toglie più dubbi: con più caselle incerte nella sua riga e colonna */
      const doubt = i => Z.range(n * n).filter(j => r.c[j] === 0 && (((j / n) | 0) === ((i / n) | 0) || j % n === i % n)).length;
      P.given.push(open.reduce((a, b) => (doubt(b) > doubt(a) ? b : a)));
    }
    fallbackUsed++;
    return P;
  }

  const HUES = [8, 40, 75, 140, 175, 205, 240, 275, 310, 340];

  /* ---------- Suggerimento spiegato ---------- */
  const star1 = k => (k === 1 ? 'una stella' : k + ' stelle');
  function hint(P, st) {
    const n = P.n, k = P.k, N = n * n, s = Z.clone(st), sol = new Set(P.sol);
    const wrong = [];
    s.c.forEach((v, i) => { if ((v === 1 && !sol.has(i)) || (v === 2 && sol.has(i))) wrong.push(i); });
    if (wrong.length) {
      const i = Z.pick(wrong), was = s.c[i], r0 = (i / n) | 0, c0 = i % n;
      const what = was === 1 ? 'La stella' : 'Il puntino', g = was === 1 ? 'a' : 'o';
      let because = '';
      if (was === 1) {
        const near = Z.range(N).find(j => j !== i && s.c[j] === 1 && Math.abs(((j / n) | 0) - r0) <= 1 && Math.abs(j % n - c0) <= 1);
        const rowS = Z.range(n).filter(x => s.c[r0 * n + x] === 1).length, colS = Z.range(n).filter(y => s.c[y * n + c0] === 1).length;
        const regS = Z.range(N).filter(j => P.reg[j] === P.reg[i] && s.c[j] === 1).length;
        if (near != null) because = `tocca la stella in ${Z.cellName(near, n)}, e le stelle non possono toccarsi nemmeno in diagonale.`;
        else if (rowS > k) because = `la riga ${r0 + 1} avrebbe più di ${star1(k)}.`;
        else if (colS > k) because = `la colonna ${c0 + 1} avrebbe più di ${star1(k)}.`;
        else if (regS > k) because = `la sua regione avrebbe più di ${star1(k)}.`;
      }
      s.c[i] = 0;
      return {
        state: s, focus: [i], area: Z.range(n).map(x => r0 * n + x),
        tag: 'wrong',
        tip: Z.say('C\'è qualcosa da ricontrollare nella riga che si illumina.', 'Ricontrolla con calma la riga che si illumina.') +
          ` Conta le stelle di ogni riga, colonna e regione (${k === 1 ? 'ne serve una' : 'ne servono ' + k} per ciascuna) e verifica che nessuna stella ne tocchi un'altra.`,
        why: `${what} in ${Z.cellName(i, n)} ` + (because || `sembrava possibile, ma porta a un problema più avanti: alla fine una riga, una colonna o una regione resterebbe senza spazio per ${k === 1 ? 'la sua stella' : 'le sue stelle'}.`) +
          ` L'ho tolt${g}, così riparti da una base sicura.` + (wrong.length > 1 ? ` Ci sono altre ${wrong.length - 1} caselle da ricontrollare.` : ''),
      };
    }
    /* il prossimo passo del risolutore «umano» (controllato con la soluzione) */
    const d = solverOf(P).step(s.c, 3);
    if (d && d.set.every(([i, v]) => (v === 1) === sol.has(i))) {
      for (const [i, v] of d.set) s.c[i] = v;
      return { state: s, focus: d.focus, area: d.area, tag: d.tag, tip: d.tip, why: d.why };
    }
    /* rompicapo di prima (salvati con le versioni vecchie) che la logica non risolve */
    const miss = P.sol.filter(i => s.c[i] !== 1);
    if (!miss.length) return null;
    const i = Z.pick(miss);
    s.c[i] = 1;
    return {
      state: s, focus: [i], area: [],
      tip: 'Non ci sono mosse dirette. Un trucco: cerca gruppi di regioni che stanno tutte dentro lo stesso numero di righe (o di colonne). Quelle righe sono riservate a loro, e nelle altre caselle di quelle righe non possono esserci stelle.',
      tag: 'advanced', why: `Non ci sono mosse dirette. Un trucco avanzato: se alcune regioni stanno tutte dentro lo stesso numero di righe (o colonne), quelle righe sono "riservate" a loro e nelle altre caselle di quelle righe non possono esserci stelle. Ecco una stella della soluzione, in ${Z.cellName(i, n)}.`,
    };
  }

  Z.register({
    options: OPTIONS,
    id: 'stars',
    name: 'Stelle',
    hue: 230,
    tagline: 'Stelle che non si sfiorano mai.',
    rules: Z.rules({
      goal: `Metti le <b>stelle</b> nella griglia, che è divisa in <b>regioni</b> colorate.`,
      rules: [
        `Ogni <b>riga</b>, ogni <b>colonna</b> e ogni <b>regione</b> ha <b>una stella</b>. Se hai scelto «2 per riga» nella difficoltà, ne ha <b>due</b>.`,
        `Due stelle <b>non si toccano</b>, nemmeno in diagonale: le otto caselle intorno a una stella restano vuote.`,
        `A volte qualche stella è <b>già messa</b>, con il bordo scuro: è giusta e non si toglie.`,
        `C'è sempre una sola soluzione, e ci si arriva ragionando.`,
      ],
      play: [
        `Tocca una casella <b>una volta</b> per mettere una stella, <b>due volte</b> per un puntino (il tuo promemoria: «qui non c'è una stella»), <b>tre volte</b> per svuotarla.`,
        `Trascina il dito sulle caselle per mettere tanti puntini insieme.`,
      ],
      start: `Cerca le regioni piccole o tutte su una riga: la loro stella non ha molte scelte. Quando sai dove va una stella, metti i puntini nelle caselle intorno e nel resto della sua riga, della sua colonna e della sua regione.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="10" class="ic-s"/><path d="M32 8v24H8M32 32h24" class="ic-l2"/><path d="M20 13l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" class="ic-a"/><path d="M44 37l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" class="ic-a"/></svg>`,
    generate,
    _fallbacks: () => fallbackUsed,
    _check(P) { const s = solve(P.n, P.k, P.reg, 2, rowSets(P.n, P.k)); return s && s.length === 1 ? '' : 'NON unico'; },
    init: P => { const c = new Array(P.n * P.n).fill(0); for (const i of P.given || []) c[i] = 1; return { c }; },
    solved(P, s) {
      const st = [];
      s.c.forEach((v, i) => { if (v === 1) st.push(i); });
      return st.length === P.sol.length && st.every((v, i) => v === P.sol[i]);
    },
    hint,
    view(ctx) {
      const P = ctx.puzzle, n = P.n, k = P.k, given = new Set(P.given || []);
      let cur = null;
      const el = Z.h('div.stars');
      el.style.setProperty('--n', n);
      const grid = Z.h('div.st-grid');
      el.append(grid);
      const off = Z.ri(0, 9);
      const cells = Z.range(n * n).map(i => {
        const c = Z.h('div.st-cell', { 'data-i': i });
        c.style.setProperty('--rh', HUES[(P.reg[i] * 3 + off) % HUES.length]);
        c.innerHTML = '<svg viewBox="0 0 24 24" class="st-star"><path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg><span class="st-dot"></span>';
        grid.append(c);
        return c;
      });
      grid.append(Z.outline(n, n, P.reg));
      let down = null;
      const cellFromEvent = e => {
        const t = document.elementFromPoint(e.clientX, e.clientY);
        const c = t && t.closest && t.closest('.st-cell');
        return c && el.contains(c) ? +c.dataset.i : -1;
      };
      el.addEventListener('contextmenu', e => e.preventDefault());
      el.addEventListener('pointerdown', e => {
        const i = cellFromEvent(e);
        if (i < 0 || !cur) return;
        e.preventDefault();
        down = { i, id: e.pointerId, drag: false, right: e.button === 2 };
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* ok */ }
        ctx.begin();
      });
      el.addEventListener('pointermove', e => {
        if (!down || e.pointerId !== down.id) return;
        const i = cellFromEvent(e);
        if (i < 0) return;
        if (!down.drag && i !== down.i) {
          down.drag = true;
          if (cur.c[down.i] === 0) { const s = Z.clone(cur); s.c[down.i] = 2; ctx.preview(s); }
        }
        if (down.drag && cur.c[i] === 0) { const s = Z.clone(cur); s.c[i] = 2; ctx.preview(s); }
      });
      el.addEventListener('pointerup', e => {
        if (!down || e.pointerId !== down.id) return;
        if (!down.drag && given.has(down.i)) Z.flashEl(cells[down.i]);
        else if (!down.drag) {
          const s = Z.clone(cur), i = down.i;
          s.c[i] = down.right ? (s.c[i] === 2 ? 0 : 2) : (s.c[i] + 1) % 3;
          ctx.preview(s);
        }
        down = null;
        ctx.end();
      });
      el.addEventListener('pointercancel', () => { if (down) { down = null; ctx.end(); } });

      function paint() {
        const bad = new Set();
        const st = [];
        cur.c.forEach((v, i) => { if (v === 1) st.push(i); });
        const rowC = {}, colC = {}, regC = {};
        for (const i of st) {
          const r = (i / n) | 0, c = i % n, R = P.reg[i];
          (rowC[r] = rowC[r] || []).push(i); (colC[c] = colC[c] || []).push(i); (regC[R] = regC[R] || []).push(i);
          for (const j of st) if (j !== i && Math.abs(((j / n) | 0) - r) <= 1 && Math.abs(j % n - c) <= 1) bad.add(i);
        }
        for (const g of [rowC, colC, regC]) for (const key in g) if (g[key].length > k) g[key].forEach(i => bad.add(i));
        cells.forEach((c, i) => {
          c.classList.toggle('star', cur.c[i] === 1);
          c.classList.toggle('given', given.has(i));
          c.classList.toggle('dot', cur.c[i] === 2);
          c.classList.toggle('bad', bad.has(i));
        });
      }
      /* comandi con le frecce */
      const put = (i, v) => { if (!cur || given.has(i)) return; const s = Z.clone(cur); s.c[i] = s.c[i] === v ? 0 : v; ctx.commit(s); };
      return {
        el, aspect: 1,
        render(s) { cur = s; paint(); },
        flash(list) { (list || []).forEach(i => Z.flashEl(cells[i])); },
        cursor: () => Z.gridCursor(ctx, {
          w: n, h: n, el: i => cells[i],
          tip: 'Sposta il riquadro con le frecce, poi scegli cosa mettere.',
          keys: [
            { label: 'Stella', icon: Z.ICONS.star, act: i => put(i, 1) },
            { label: 'Puntino', icon: Z.ICONS.dot, act: i => put(i, 2) },
            { label: 'Cancella', icon: Z.ICONS.erase, act: i => { if (cur && cur.c[i] && !given.has(i)) { const s = Z.clone(cur); s.c[i] = 0; ctx.commit(s); } } },
            { label: 'Puntini in fila', icon: Z.ICONS.pen, pen: true, tip: 'Muovendoti metti un puntino in ogni casella vuota. Tocca di nuovo per smettere.',
              act: i => { if (cur && cur.c[i] === 0) { const s = Z.clone(cur); s.c[i] = 2; ctx.commit(s); } } },
          ],
        }),
      };
    },
  });
})();
