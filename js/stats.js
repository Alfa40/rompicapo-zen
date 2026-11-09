/* Rompicapo Zen — Percorso: i dati di come giochi, separati per ogni rompicapo.
   Durante la partita non si vede niente: ogni mossa viene confrontata in silenzio con la soluzione (unica) e se ne
   tiene il tempo. Le partite finite diventano un riepilogo (stat:<gioco>); le ultime si possono rivedere mossa per
   mossa (replay:<gioco>). Il resoconto e il Percorso si sbloccano gioco per gioco dopo UNLOCK partite finite.
   Gira anche nel worker (js/worker.js): lì servono solo le parti senza pagina (Z.Stats.job). */
(function () {
  'use strict';
  const Z = window.Zen;
  const UNLOCK = 5;            /* partite finite per sbloccare un gioco */
  const KEEP_GAMES = 120;      /* riepiloghi tenuti per gioco */
  const KEEP_REPLAYS = 6;      /* partite da rivedere tenute per gioco */
  const IDLE_CAP = 180000;     /* una pausa conta al massimo 3 minuti (telefono appoggiato) */
  const SLIP_MS = 3000;        /* una mossa corretta entro 3 s è un tocco sbagliato: non conta */
  const PAUSE_MIN = 20000;

  /* ---------- quanto uno stato è vicino alla soluzione: ok = cose giuste, bad = cose sbagliate ---------- */
  const byVal = (P, s) => {
    let ok = 0, bad = 0;
    for (let i = 0; i < s.v.length; i++) if (s.v[i]) { if (s.v[i] === P.sol[i]) ok++; else bad++; }
    return { ok, bad };
  };
  const PROGRESS = {
    sudoku: byVal, futoshiki: byVal, calcudoku: byVal, crossword: byVal, incastro: byVal,
    hashi(P, s) { let ok = 0, bad = 0; s.b.forEach((v, i) => { ok += Math.min(v, P.sol[i]); bad += Math.max(0, v - P.sol[i]); }); return { ok, bad }; },
    flow(P, s) { let ok = 0, bad = 0; s.p.forEach((q, c) => { const set = new Set(P.sol[c]); for (const i of q) { if (set.has(i)) ok++; else bad++; } }); return { ok, bad }; },
    stars(P, s) {
      const S = new Set(P.sol); let ok = 0, bad = 0;
      s.c.forEach((v, i) => { if (v) { if ((v === 1) === S.has(i)) ok++; else bad++; } });
      return { ok, bad };
    },
    blocks: (P, s) => ({ ok: s.removed.filter(Boolean).length, bad: 0 }),
    wordsearch: (P, s) => ({ ok: s.f.filter(Boolean).length, bad: 0 }),
    anagram: (P, s) => ({ ok: P.words.reduce((a, p, i) => a + [...s.o[i]].filter((c, k) => c === p.w[k]).length, 0), bad: 0 }),
  };
  const progressOf = id => PROGRESS[id] || (Z.GAMES[id] && Z.GAMES[id].progress) || null;
  function judge(id, P, a, b) {
    const f = progressOf(id);
    if (!f) return 'neu';
    let x, y;
    try { x = f(P, a); y = f(P, b); } catch (e) { return 'neu'; }
    if (y.bad > x.bad) return 'err';
    if (y.ok > x.ok) return 'ok';
    if (y.bad < x.bad) return 'fix';
    if (y.ok < x.ok) return 'away';
    return 'neu';
  }

  /* giochi in cui il Suggerimento sceglie a caso: il ragionamento è quello della mossa stessa */
  const WS_DIR = p => !p.dy ? (p.dx > 0 ? 'row' : 'rowBack') : !p.dx ? (p.dy > 0 ? 'col' : 'colBack') : 'diag';
  const MOVE_TAG = {
    wordsearch(P, a, b) { const i = b.f.findIndex((v, k) => v && !a.f[k]); return i >= 0 ? WS_DIR(P.words[i]) : null; },
    anagram(P, a, b) { const i = b.o.findIndex((w, k) => w !== a.o[k]); if (i < 0) return null; const n = P.words[i].w.length; return n <= 5 ? 'short' : n <= 7 ? 'mid' : 'long'; },
  };

  /* nomi dei ragionamenti (per il resoconto) e un consiglio per allenarli */
  /* griglie di numeri: dai passi più semplici ai ragionamenti avanzati (Z.latinSolver in numgrid.js);
     «guess» resta solo per i rompicapo salvati con le versioni vecchie */
  const NUM_BASE = {
    naked: ['trovare il solo numero possibile in una casella', 'Quando ti blocchi, scegli una casella e togli uno per uno i numeri che non possono andarci: a volte ne resta uno solo.'],
    hidden: ['trovare il solo posto possibile per un numero', 'Prendi un numero e cercagli posto in una riga o in una colonna: se c’è una sola casella possibile, va lì.'],
  };
  const NUM_ADV = {
    pair: ['usare coppie e terne di candidati', 'Scrivi le note: due caselle della stessa riga con gli stessi due soli numeri li «prenotano», e spariscono dalle altre caselle.'],
    wing: ['i ragionamenti a incastro (X-wing, Y-wing)', 'Quando un numero in due righe ha solo due posti, sulle stesse due colonne, quelle colonne non lo possono avere altrove.'],
    guess: ['i punti difficili, con poche mosse sicure', 'Nei punti difficili scrivi le note: due caselle con gli stessi due candidati spesso sbloccano tutto.'],
  };
  const TAGS = {
    sudoku: Object.assign({}, NUM_BASE, { locked: ['i candidati bloccati in un riquadro', 'Se in un riquadro un numero può stare solo su una riga, quella riga non lo può avere fuori dal riquadro.'] }, NUM_ADV),
    futoshiki: Object.assign({}, NUM_BASE, { sign: ['usare i segni maggiore e minore', 'Un numero più piccolo di un vicino non può essere il massimo, uno più grande non può essere 1: e i limiti passano da una casella all’altra.'] }, NUM_ADV),
    calcudoku: Object.assign({}, NUM_BASE, {
      one: ['partire dalle gabbie di una casella', 'Le gabbie di una sola casella dicono già il numero: scrivile subito.'],
      cage: ['trovare le combinazioni delle gabbie', 'Parti dalle gabbie piccole: con due caselle e un risultato le combinazioni possibili sono poche.'],
    }, NUM_ADV),
    stars: {
      place: ['trovare l\'ultimo posto libero di una regione', 'Conta i posti liberi rimasti in ogni regione, riga e colonna: dove ne resta uno solo, la stella va lì.'],
      touch: ['ricordare che le stelle non si toccano', 'Dopo ogni stella metti subito i puntini nelle 8 caselle attorno: ti aiutano a vedere gli spazi rimasti.'],
      full: ['chiudere le righe e le regioni già complete', 'Quando una riga, colonna o regione ha già le sue stelle, riempi il resto di puntini.'],
      imagine: ['immaginare una stella e vederne le conseguenze', 'Prova a immaginare una stella in una casella: se una regione resterebbe senza spazio, lì va un puntino.'],
      advanced: ['le regioni chiuse dentro poche righe', 'Cerca regioni che stanno tutte dentro le stesse righe o colonne: quelle righe sono riservate a loro.'],
    },
    hashi: {
      only: ['le isole che hanno una sola strada', 'Comincia dalle isole con un solo vicino possibile: i loro ponti sono obbligati.'],
      count: ['contare i ponti che servono a un\'isola', 'Confronta il numero di un\'isola con le direzioni libere: un 4 con due vicini, per esempio, vuole due ponti doppi.'],
      connect: ['tenere tutte le isole collegate', 'Evita i ponti che chiuderebbero un gruppo di isole separato dal resto.'],
    },
    cipher: {
      word: ['riconoscere le parole quasi complete', 'Guarda prima le parole a cui manca una sola lettera: spesso c\'è una sola parola possibile.'],
      guessword: ['indovinare una parola dalla sua forma', 'Le parole corte (articoli, preposizioni) sono le più facili da indovinare: partire da lì aiuta.'],
      freq: ['partire dalle lettere più frequenti', 'Il numero che compare più spesso è quasi sempre una vocale: E, A, I oppure O.'],
    },
    crossword: {
      cross: ['usare le lettere degli incroci', 'Prima di una definizione difficile, riempi le parole che la incrociano: le lettere in più aiutano molto.'],
      only: ['trovare la parola che entra in uno spazio solo', 'Conta le lettere: spesso una parola dell\'elenco ha una sola lunghezza possibile.'],
      clue: ['risolvere le definizioni', 'Comincia dalle definizioni che conosci meglio e lascia le altre per dopo.'],
    },
    flow: {
      forced: ['vedere i percorsi obbligati', 'Cerca i pallini con una sola casella libera accanto: da lì il percorso è obbligato.'],
      border: ['usare i bordi', 'I percorsi lungo i bordi lasciano spazio agli altri colori nel centro.'],
      fill: ['riempire tutte le caselle', 'Ricorda che ogni casella va riempita: un percorso che isola un angolo è sempre sbagliato.'],
    },
    maze: {
      fork: ['scegliere la strada giusta ai bivi', 'Ai bivi prova a guardare avanti con gli occhi, oppure parti dall\'uscita e cammina al contrario.'],
      corridor: ['seguire i corridoi', 'Nei corridoi senza bivi puoi andare avanti tranquillo: le scelte vere sono solo ai bivi.'],
    },
    pipes: {
      edge: ['sistemare i pezzi sul bordo', 'Comincia dagli angoli e dai bordi: lì un tubo non può puntare fuori dalla griglia.'],
      near: ['usare i pezzi vicini già sistemati', 'Un pezzo vicino già giusto dice se qui serve un tubo che lo incontri oppure no.'],
      flow: ['evitare gli anelli chiusi', 'La rete non ha anelli: se un pezzo chiuderebbe un giro, va girato in un altro verso.'],
    },
    lights: {
      chase: ['inseguire le luci riga per riga', 'Spegni le luci della prima riga toccando le lanterne subito sotto, e così via verso il basso.'],
      calc: ['scegliere le lanterne giuste', 'Conta solo quali lanterne tocchi, non l\'ordine: toccarne una due volte la annulla.'],
    },
    blocks: {
      free: ['vedere i blocchi già liberi', 'Prima di spostare, cerca i blocchi che hanno già la strada libera fino alla loro porta.'],
      move: ['spostare un blocco per liberarne un altro', 'Se nessun blocco esce, cerca quello che ferma il passaggio e chiediti dove può spostarsi.'],
      reset: ['non bloccare i blocchi a vicenda', 'Prima di una mossa guarda dove si fermerà il blocco: non deve chiudere la strada agli altri.'],
    },
    wordsearch: {
      row: ['le parole in orizzontale', 'Scorri le righe una alla volta cercando la prima lettera della parola.'],
      rowBack: ['le parole scritte al contrario', 'Per le parole al contrario cerca l\'ultima lettera e leggi verso sinistra.'],
      col: ['le parole in verticale', 'Scorri le colonne dall\'alto in basso, cercando le prime due lettere vicine.'],
      colBack: ['le parole in verticale al contrario', 'Cerca le ultime due lettere della parola una sopra l\'altra.'],
      diag: ['le parole in diagonale', 'In diagonale aiuta partire dalla lettera più rara della parola e guardare i quattro angoli attorno.'],
    },
    anagram: {
      short: ['le parole corte', 'Con poche lettere prova le combinazioni con le vocali in mezzo.'],
      mid: ['le parole medie', 'Cerca i gruppi di lettere che stanno spesso insieme: CH, GN, SC, -ONE, -ATO.'],
      long: ['le parole lunghe', 'Nelle parole lunghe trova prima la fine (-ZIONE, -MENTO, -ATO) e poi il resto.'],
    },
  };
  TAGS.incastro = TAGS.crossword;
  /* solitari di carte (js/games/cards.js) */
  const FOUND = ['portare le carte sulle pile dei semi', 'Quando una carta può salire sulla pila del suo seme, di solito conviene: libera spazio sul tavolo.'];
  const DRAW = ['capire quando girare il mazzo', 'Prima di girare il mazzo controlla con calma tutte le mosse sul tavolo.'];
  const NEAR = {
    play: ['trovare la carta vicina', 'Cerca le carte di un valore in più o in meno di quella girata: il colore e il seme non contano.'],
    plan: ['scegliere la catena più lunga', 'Quando puoi prendere più carte, guarda cosa viene dopo ciascuna e scegli quella che ti porta più lontano.'],
    draw: DRAW,
  };
  Object.assign(TAGS, {
    klondike: {
      found: FOUND,
      reveal: ['scoprire le carte coperte', 'Dai la precedenza alle mosse che girano una carta coperta, soprattutto nelle colonne più alte.'],
      waste: ['rimettere in gioco gli scarti', 'Prima di girare il mazzo guarda se la carta in cima agli scarti può scendere su una colonna.'],
      king: ['usare bene le colonne vuote', 'In una colonna vuota va solo un Re: scegli quello che libera più carte.'],
      shift: ['spostare gruppi per liberare carte', 'Spostare un gruppo da una colonna all’altra può liberare proprio la carta che ti serve.'],
      draw: DRAW,
    },
    freecell: {
      found: FOUND,
      build: ['costruire scale ordinate', 'Metti le carte in scala, colore diverso e un valore in meno: le scale si spostano più facilmente.'],
      cell: ['usare le celle con giudizio', 'Le celle sono poche: mettici una carta solo se libera qualcosa di utile, e svuotale presto.'],
      empty: ['sfruttare le colonne vuote', 'Una colonna vuota raddoppia le carte che puoi spostare insieme: non riempirla troppo presto.'],
    },
    pyramid: {
      king: ['togliere i Re', 'Il Re vale 13 da solo: appena è libero, toglilo.'],
      pair: ['trovare le coppie che fanno 13', 'Ripassa le coppie: A+Q, 2+J, 3+10, 4+9, 5+8, 6+7. Guarda solo le carte libere.'],
      waste: ['usare la carta degli scarti', 'La carta in cima agli scarti può fare coppia con una della piramide: guardala sempre prima di girare il mazzo.'],
      draw: DRAW,
    },
    tripeaks: NEAR,
    golf: NEAR,
  });

  /* ---------- utilità ---------- */
  const clone = o => JSON.parse(JSON.stringify(o));
  function hash(str) { let x = 2166136261; for (let i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); } return (x >>> 0).toString(36); }
  const median = a => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y), m = b.length >> 1; return b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2; };
  /* differenza tra due stati: elenco di [percorso, valore] (senza valore = cancellato) */
  function diff(a, b, path = [], out = []) {
    if (a === b) return out;
    const oa = a && typeof a === 'object', ob = b && typeof b === 'object';
    if (oa && ob && Array.isArray(a) === Array.isArray(b) && (!Array.isArray(a) || a.length === b.length)) {
      for (const k of Object.keys(b)) diff(a[k], b[k], path.concat(k), out);
      for (const k of Object.keys(a)) if (!(k in b)) out.push([path.concat(k)]);
      return out;
    }
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push([path, b === undefined ? null : clone(b)]);
    return out;
  }
  function patch(s, d) {
    let r = clone(s);
    for (const [p, v] of d || []) {
      if (!p.length) { r = clone(v); continue; }
      let o = r;
      for (let k = 0; k < p.length - 1; k++) o = o[p[k]];
      const last = p[p.length - 1];
      if (v === undefined && Array.isArray(o) === false) delete o[last]; else o[last] = clone(v);
    }
    return r;
  }
  const overlap = (d1, d2) => (d1 || []).some(([p]) => (d2 || []).some(([q]) => {
    const n = Math.min(p.length, q.length);
    for (let k = 0; k < n; k++) if (String(p[k]) !== String(q[k])) return false;
    return true;
  }));
  const store = typeof document !== 'undefined' ? Z.store : null;

  /* tempo "attivo": quando l'app è nascosta l'orologio si ferma */
  let hiddenAt = 0, hiddenTot = 0;
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt) { hiddenTot += Date.now() - hiddenAt; hiddenAt = 0; }
    });
  }
  const clock = () => Date.now() - hiddenTot - (hiddenAt ? Date.now() - hiddenAt : 0);

  const games = id => store.get('stat:' + id, []);
  const finished = id => games(id).filter(g => g.done);
  /* un gioco si sblocca con UNLOCK partite finite oppure col quiz (js/quiz.js) */
  const unlocked = id => finished(id).length >= UNLOCK || !!store.get('quiz:' + id, null);
  function pauseLimit(id) {
    const meds = finished(id).slice(-10).map(g => g.med).filter(Boolean);
    return Math.min(90000, Math.max(PAUSE_MIN, median(meds) * 4));
  }

  /* ---------- registratore di una partita ---------- */
  function recorder(id, P, s0, src) {
    const G = Z.GAMES[id], key = 'rec:' + id;
    let R = store.get(key, null);
    if (R && R.pid !== P.pid && R.steps && R.steps.length) {
      /* partita lasciata a metà e sostituita da una nuova: resta come non finita */
      const list = games(id); list.push(summarize(id, R, false, R.opt)); store.set('stat:' + id, list.slice(-KEEP_GAMES));
    }
    if (!R || R.pid !== P.pid) R = { pid: P.pid, src: src || 'menu', opt: P.opt || null, s0: clone(s0), steps: [], seen: [hash(JSON.stringify(s0))], dur: 0, first: 0 };
    let last = clock(), prev = null; /* prev: ultimo passo di questa sessione, per riconoscere i tocchi corretti subito */
    const limit = pauseLimit(id);
    const save = () => {
      if (store.set(key, R)) return;
      for (const st of R.steps) delete st.d; /* spazio finito: si rinuncia a rivederla */
      R.noReplay = true;
      store.set(key, R);
    };
    function step(kind, a, b, hintTag) {
      const now = clock(), dt = Math.min(IDLE_CAP, now - last);
      last = now;
      R.dur += dt;
      if (!R.first && kind !== 'u' && kind !== 'r') R.first = R.dur;
      const st = { t: Math.round(dt / 100), k: kind, e: kind === 'x' ? 'err' : (a && b ? judge(id, P, a, b) : 'neu') };
      if (a && b && !R.noReplay) st.d = diff(a, b);
      if (dt > limit) st.p = 1;
      if (b && (kind === 'm' || kind === 'h')) {
        const hs = hash(JSON.stringify(b));
        if (kind === 'm' && R.seen.includes(hs) && R.seen[R.seen.length - 2] !== hs) st.r = 1;
        R.seen.push(hs);
      }
      /* tocco sbagliato corretto subito: la mossa prima non conta e questa si giudica dallo stato di prima */
      if (prev && !prev.st.s && dt < SLIP_MS && prev.st.k === 'm') {
        if (kind === 'u') { prev.st.s = 1; st.s = 1; }
        else if (kind === 'm' && prev.st.e !== 'ok' && overlap(prev.st.d, st.d)) {
          prev.st.s = 1; delete st.r;
          st.e = judge(id, P, prev.a, b);
          a = prev.a;
        }
      }
      if (MOVE_TAG[id] && kind === 'm' && a && b) st.g = MOVE_TAG[id](P, a, b) || undefined;
      if ((kind === 'h' || kind === 'n') && hintTag && hintTag !== 'wrong') st.g = hintTag;
      R.steps.push(st);
      prev = { st, a };
      if (!MOVE_TAG[id] && !st.g && isDoubt(st) && a) {
        /* che ragionamento serviva in quel momento? (lo chiede al Suggerimento, senza mostrarlo) */
        const before = a;
        setTimeout(() => {
          try { const r = G.hint(P, before); if (r && r.tag && r.tag !== 'wrong') { st.g = r.tag; save(); } } catch (e) { /* niente */ }
        }, 30);
      }
      save();
    }
    return {
      move: (a, b) => step('m', a, b),
      hint: (a, b, tag) => step('h', a, b, tag),
      undo: (a, b) => step('u', a, b),
      redo: (a, b) => step('r', a, b),
      miss: () => step('x', null, null),
      nudge: tag => step('n', null, null, tag),
      get count() { return R.steps.length; },
      finish(done) {
        store.del(key);
        if (!R.steps.length) return null;
        const sum = summarize(id, R, done, P.opt);
        const list = games(id); list.push(sum);
        store.set('stat:' + id, list.slice(-KEEP_GAMES));
        addWeak(id, sum.tags, null);
        if (!R.noReplay) {
          let reps = store.get('replay:' + id, []);
          reps.push({ pid: R.pid, d: sum.d, P, s0: R.s0, steps: R.steps });
          reps = reps.slice(-KEEP_REPLAYS);
          while (reps.length && !store.set('replay:' + id, reps)) reps.shift();
        }
        if (done) needOf(id, P);
        if (R.src === 'percorso') stepPath(id, sum);
        return sum;
      },
    };
  }
  const isDoubt = st => !st.s && (st.k === 'h' || st.k === 'n' || st.k === 'u' || st.k === 'x' || st.r || st.e === 'err' || st.e === 'away' || (st.p && st.e !== 'ok'));

  function summarize(id, R, done, opt) {
    const S = R.steps.filter(st => !st.s);
    const mv = S.filter(st => st.k === 'm');
    const c = (f) => S.filter(f).length;
    const med = median(mv.map(st => st.t * 100));
    const slow = st => MOVE_TAG[id] && st.k === 'm' && st.t * 100 > Math.max(2 * med, 8000);
    const tags = {};
    for (const st of S) if (st.g && (isDoubt(st) || slow(st))) tags[st.g] = (tags[st.g] || 0) + 1;
    return {
      d: Date.now(), pid: R.pid, src: R.src, done: !!done, opt: opt || null,
      dur: R.dur, first: R.first, n: mv.length, med,
      ok: c(st => st.k === 'm' && st.e === 'ok'), err: c(st => st.k === 'm' && st.e === 'err') + c(st => st.k === 'x'),
      away: c(st => st.k === 'm' && st.e === 'away'), fix: c(st => st.k === 'm' && st.e === 'fix'),
      undo: c(st => st.k === 'u'), redo: c(st => st.k === 'r'), hint: c(st => st.k === 'h'), nudge: c(st => st.k === 'n'), re: c(st => st.r),
      pz: c(st => st.p), pzOk: c(st => st.p && st.k === 'm' && st.e === 'ok'), slip: R.steps.length - S.length, tags,
    };
  }

  /* punti deboli per ragionamento: quante volte ti ha messo in dubbio / quante volte serviva (le partite vecchie pesano meno) */
  function addWeak(id, doubt, need) {
    const W = store.get('weak:' + id, { doubt: {}, need: {} });
    const fade = o => { for (const k in o) o[k] *= 0.92; };
    if (doubt) { fade(W.doubt); for (const k in doubt) W.doubt[k] = (W.doubt[k] || 0) + doubt[k]; }
    if (need) { fade(W.need); for (const k in need) W.need[k] = (W.need[k] || 0) + need[k]; }
    store.set('weak:' + id, W);
  }
  /* ragionamenti che servono per risolvere un rompicapo da capo (col Suggerimento) */
  function tagsToSolve(id, P) {
    const G = Z.GAMES[id], need = {};
    let s = G.init(P), k = 0;
    while (!G.solved(P, s) && k++ < (G.hintCap || 3000)) {
      const r = G.hint(P, s);
      if (!r) break;
      if (r.tag && r.tag !== 'wrong') need[r.tag] = (need[r.tag] || 0) + 1;
      s = r.state;
    }
    return need;
  }
  /* ---------- worker: ragionamenti che servono e rompicapo su misura, senza bloccare la pagina ---------- */
  let worker = null, jobN = 0;
  const waiting = {};
  function work(msg) {
    return new Promise(resolve => {
      try {
        if (worker === null) {
          worker = new Worker('js/worker.js');
          worker.onmessage = e => { const d = e.data; if (d && d.jobId && waiting[d.jobId]) { waiting[d.jobId](d); delete waiting[d.jobId]; } };
          worker.onerror = () => { worker = false; for (const k in waiting) { waiting[k](job(waiting[k].msg)); delete waiting[k]; } };
        }
      } catch (e) { worker = false; }
      if (!worker) { setTimeout(() => resolve(job(msg)), 30); return; } /* senza worker (es. aperto da file) */
      const jobId = ++jobN;
      waiting[jobId] = resolve;
      waiting[jobId].msg = msg;
      worker.postMessage(Object.assign({ jobId }, msg));
    });
  }
  function needOf(id, P) { work({ job: 'need', id, P }).then(d => { if (d.need) addWeak(id, null, d.need); }); }
  function job(d) {
    if (d.job === 'need') return { jobId: d.jobId, job: 'need', id: d.id, need: tagsToSolve(d.id, d.P) };
    if (d.job === 'make') return Object.assign({ jobId: d.jobId }, make(d));
    if (d.job === 'exercise') return Object.assign({ jobId: d.jobId, job: 'exercise' }, exercise(d) || { none: true });
    if (d.job === 'mini') return Object.assign({ jobId: d.jobId, job: 'mini' }, mini(d));
    return { jobId: d.jobId, job: d.job, error: 'sconosciuto' };
  }
  /* genera qualche rompicapo e tiene quello che fa usare di più i ragionamenti difficili per te */
  function make(d) {
    const G = Z.GAMES[d.id], t0 = Date.now();
    let best = null;
    for (let k = 0; k < d.n && (k === 0 || Date.now() - t0 < d.ms); k++) {
      let P = null;
      for (let t = 0; t < 5 && !P; t++) P = G.generate(d.opt);
      if (!P) continue;
      const need = tagsToSolve(d.id, P);
      let tot = 0, sc = 0;
      for (const t in need) { tot += need[t]; sc += need[t] * (d.w[t] || 0); }
      sc = tot ? sc / tot : 0;
      if (!best || sc > best.sc) best = { P, sc, need };
    }
    return { job: 'make', id: d.id, P: best && best.P, need: best && best.need };
  }

  /* ---------- Quiz: esercizi mirati («trova la mossa») per un ragionamento ----------
     Si gioca un rompicapo vero col Suggerimento finché il prossimo passo richiede proprio quel ragionamento: quella
     situazione è l'esercizio. Si completa quando lo stato fa progressi fino a goal (una mossa giusta; per alcuni giochi
     tutta la parola o il percorso). */
  const FULL = new Set(['crossword', 'incastro', 'anagram', 'flow', 'maze']);
  const ANA_TAG = p => (p.w.length <= 5 ? 'short' : p.w.length <= 7 ? 'mid' : 'long');
  function exercise(d) {
    const G = Z.GAMES[d.id], f = progressOf(d.id), t0 = Date.now();
    const gen = opt => { let P = null; for (let t = 0; t < 3 && !P; t++) P = G.generate(opt); if (P) P.opt = opt; return P; };
    for (let o = 0; o < d.opts.length; o++) {
      const opt = d.opts[o], until = t0 + d.ms * (o + 1) / d.opts.length;
      while (Date.now() < until) {
        const P = gen(opt);
        if (!P) continue;
        if (d.id === 'wordsearch' || d.id === 'anagram') {
          /* tutte le parole già fatte tranne una del tipo voluto */
          const ks = P.words.map((p, i) => i).filter(i => (d.id === 'wordsearch' ? WS_DIR(P.words[i]) : ANA_TAG(P.words[i])) === d.tag);
          if (!ks.length) continue;
          const k = ks[Math.floor(Math.random() * ks.length)], st = G.init(P);
          if (d.id === 'wordsearch') st.f = st.f.map((_, i) => (i === k ? 0 : 1));
          else st.o = P.words.map((p, i) => (i === k ? p.start : p.w));
          const fin = clone(st);
          if (d.id === 'wordsearch') fin.f[k] = 1; else fin.o[k] = P.words[k].w;
          return { P, s: st, tag: d.tag, goal: f(P, fin).ok };
        }
        let st = G.init(P), n = 0;
        const found = [];
        while (!G.solved(P, st) && n++ < (G.hintCap || 3000)) {
          const r = G.hint(P, st);
          if (!r) break;
          if (r.tag === d.tag) found.push({ s: clone(st), r });
          st = r.state;
        }
        if (!found.length) continue;
        const x = found[Math.floor(Math.random() * found.length)];
        const goal = FULL.has(d.id) ? f(P, x.r.state).ok : exProgress(d.id, d.tag, P, x.s).ok + 1;
        return { P, s: x.s, tag: d.tag, goal };
      }
    }
    return null;
  }
  /* mini rompicapo finale: piccolo e completo */
  function mini(d) {
    const G = Z.GAMES[d.id];
    let P = null;
    /* le smazzate dei solitari sono casuali: per il quiz se ne cerca una che si possa vincere */
    for (let t = 0; t < 12; t++) {
      const Q = G.generate(d.opt);
      if (!Q) continue;
      P = Q;
      if (!G.winnable || G.winnable(Q)) break;
    }
    if (P) P.opt = d.opt;
    return { P, s: P ? G.init(P) : null };
  }
  /* progressi di uno stato (per il quiz) */
  const progress = (id, P, st) => { const f = progressOf(id); try { return f ? f(P, st) : { ok: 0, bad: 0 }; } catch (e) { return { ok: 0, bad: 0 }; } };
  /* nelle Stelle un esercizio chiede una stella (posto obbligato) oppure un puntino (gli altri ragionamenti) */
  const STAR_TAGS = new Set(['place']);
  function exProgress(id, tag, P, st) {
    if (id !== 'stars') return progress(id, P, st);
    const S2 = new Set(P.sol), want = STAR_TAGS.has(tag) ? 1 : 2;
    let ok = 0, bad = 0;
    st.c.forEach((v, i) => { if (v) { if ((v === 1) === S2.has(i)) { if (v === want) ok++; } else bad++; } });
    return { ok, bad };
  }

  /* ---------- Percorso: scala di difficoltà e livello del giocatore (per gioco) ---------- */
  const RUNGS = 10;
  const idxOf = (dd, v) => Math.max(0, dd.choices.findIndex(c => c.v === v));
  /* posizione (0..RUNGS-1) di una scelta di opzioni sulla scala */
  function rungOf(id, o) {
    const ds = (Z.GAMES[id].options || []).filter(dd => dd.choices.length > 1);
    if (!o || !ds.length) return 0;
    const f = ds.reduce((a, dd) => a + idxOf(dd, o[dd.id]) / (dd.choices.length - 1), 0) / ds.length;
    return f * (RUNGS - 1);
  }
  /* opzioni per un gradino: tutte salgono insieme; la griglia al massimo un passo più grande di quelle già giocate */
  function optsAt(id, r) {
    const G = Z.GAMES[id], o = Z.defaultOpts(G), f = Math.max(0, Math.min(1, r / (RUNGS - 1)));
    const played = finished(id).map(g => g.opt).filter(Boolean);
    for (const dd of G.options || []) {
      let i = Math.round(f * (dd.choices.length - 1));
      if (dd.id === 'size') {
        const top = played.length ? Math.max(...played.map(x => idxOf(dd, x.size))) : idxOf(dd, dd.def);
        i = Math.min(i, top + 1);
      }
      o[dd.id] = dd.choices[i].v;
    }
    for (const dd of G.options || []) {
      let i = idxOf(dd, o[dd.id]);
      while (i > 0 && dd.choices[i].need && !dd.choices[i].need(o)) i--;
      /* anche la prima scelta può avere un vincolo (es. Stelle «Semplici» solo con una stella per riga) */
      while (i < dd.choices.length - 1 && dd.choices[i].need && !dd.choices[i].need(o)) i++;
      o[dd.id] = dd.choices[i].v;
    }
    return o;
  }
  /* com'è andata una partita: 1 = senza nessun dubbio, 0 = solo dubbi */
  const quality = g => Math.max(0, Math.min(1, 1 - (g.err + g.away + g.undo + g.re + g.hint * 1.5 + (g.nudge || 0) * 0.5) / Math.max(1, g.n + g.hint)));
  function pathOf(id) {
    let p = store.get('path:' + id, null);
    if (!p) {
      /* primo passo: dalla difficoltà delle ultime partite e da come sono andate */
      const last = finished(id).slice(-5);
      const r = median(last.map(g => rungOf(id, g.opt)));
      const q = median(last.map(quality));
      p = { r: Math.max(0, Math.min(RUNGS - 1, r + (q > 0.85 ? 1 : q < 0.5 ? -1 : 0))), n: 0 };
    }
    return p;
  }
  function stepPath(id, g) {
    const p = pathOf(id), q = quality(g);
    p.r += !g.done ? -0.5 : q > 0.85 ? 1 : q > 0.7 ? 0.5 : q < 0.45 ? -0.5 : 0;
    p.r = Math.max(0, Math.min(RUNGS - 1, p.r));
    p.n++;
    p.q = (p.q || []).concat(Math.round(q * 100)).slice(-20);
    store.set('path:' + id, p);
  }
  /* il ragionamento su cui conviene insistere (se ce n'è uno chiaramente più difficile degli altri) */
  function weakWeights(id) {
    const W = store.get('weak:' + id, null), w = {};
    if (!W) return { w, focus: null };
    let best = null, sum = 0, n = 0;
    for (const t in W.need) {
      if (W.need[t] < 2) continue;
      w[t] = (W.doubt[t] || 0) / W.need[t];
      sum += w[t]; n++;
      if (!best || w[t] > w[best]) best = t;
    }
    const focus = best && n > 1 && (W.doubt[best] || 0) >= 2 && w[best] > Math.max(0.15, (sum / n) * 1.2) ? best : null;
    return { w, focus };
  }
  /* prossimo passo: { opt, P, focus, harder } */
  async function nextStep(id) {
    const p = pathOf(id);
    const harder = p.n > 0 && Math.random() < 0.25 && p.r < RUNGS - 1;
    const opt = optsAt(id, Math.round(p.r) + (harder ? 1 : 0));
    const { w, focus } = weakWeights(id);
    const d = await work({ job: 'make', id, opt, w, n: Object.keys(w).length ? 6 : 1, ms: 2500 });
    let P = d.P;
    if (!P) { const G = Z.GAMES[id]; for (let t = 0; t < 5 && !P; t++) P = G.generate(opt); }
    if (P) P.opt = opt;
    return { opt, P, focus, harder, r: p.r };
  }

  /* fine del quiz: il profilo del gioco parte dai risultati (res: { tag: punteggio 0..1 }, ordinati dal più facile) */
  function quizDone(id, res, mini) {
    const tags = Object.keys(TAGS[id] || {}).filter(t => t in res);
    const W = store.get('weak:' + id, { doubt: {}, need: {} });
    for (const t of tags) { W.need[t] = (W.need[t] || 0) + 2; W.doubt[t] = (W.doubt[t] || 0) + 2 * (1 - res[t]); }
    store.set('weak:' + id, W);
    let num = 0, den = 0;
    tags.forEach((t, j) => { num += res[t] * (j + 1); den += j + 1; });
    const f = den ? num / den : 0.3;
    const r = Math.max(0, Math.min(RUNGS - 1, 0.5 + f * 5 + (mini && mini.ok && !mini.err ? 1 : 0)));
    const p = store.get('path:' + id, null) || { n: 0 };
    p.r = r;
    store.set('path:' + id, p);
    store.set('quiz:' + id, { d: Date.now(), res, mini: mini || null });
  }

  Z.Stats = { recorder, job, work, judge, diff, patch, games, finished, unlocked, isDoubt, nextStep, pathOf, quality, optsAt, progress, exProgress, quizDone, FULL, UNLOCK, TAGS, RUNGS, newPid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7) };
})();
