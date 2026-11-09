/* Rompicapo Zen — Quiz di un gioco: esercizi mirati «trova la mossa» (uno per ragionamento, dal più facile) e un
   mini rompicapo finale, senza suggerimenti. Ogni esercizio si può completare o saltare; una mossa sbagliata torna
   indietro da sola e si può riprovare. Alla fine: resoconto gentile e Percorso del gioco sbloccato (Z.Stats.quizDone).
   Gli esercizi si preparano nel worker (Z.Stats: job 'exercise' e 'mini'). */
(function () {
  'use strict';
  const Z = window.Zen, h = Z.h, S = Z.Stats;
  const MAX = 11; /* esercizi «trova la mossa» al massimo (+ il mini rompicapo) */
  const MIN = 8;
  const SLOW = 90000;
  /* ragionamenti che non si possono preparare come esercizio */
  const SKIP = { lights: ['calc'], sudoku: ['guess'], futoshiki: ['guess'], calcudoku: ['guess'], blocks: ['reset'], maze: ['corridor'], crossword: ['only'], incastro: ['clue'],
    klondike: ['draw', 'shift'], freecell: ['cell', 'empty'], pyramid: ['draw'], tripeaks: ['draw'], golf: ['draw'] };
  const NEAR = { play: 'Prendi una carta vicina a quella girata.', plan: 'Prendi una carta vicina a quella girata: ce n’è più di una.' };
  const CARD_TASK = {
    klondike: { found: 'Porta una carta sulla pila del suo seme.', reveal: 'Fai una mossa che gira una carta coperta.', waste: 'Rimetti in gioco la carta degli scarti.', king: 'Metti un Re nella colonna vuota.' },
    freecell: { found: 'Porta una carta sulla pila del suo seme.', build: 'Fai scendere una carta su un’altra, in scala.' },
    pyramid: { king: 'Togli un Re.', pair: 'Togli due carte della piramide che fanno 13.', waste: 'Fai coppia con la carta degli scarti.' },
    tripeaks: NEAR, golf: NEAR,
  };
  const TASK = {
    crossword: 'Scrivi una parola sicura.', incastro: 'Metti una parola sicura al suo posto.', anagram: 'Ricomponi la parola che resta.',
    flow: 'Completa un percorso sicuro.', maze: 'Trova la strada giusta fino al prossimo bivio.', wordsearch: 'Trova la parola che manca.',
    blocks: 'Fai uscire un blocco.', lights: 'Tocca una lanterna che fa parte della soluzione.', pipes: 'Gira un pezzo nel verso giusto.',
    hashi: 'Metti un ponte sicuro.', stars: 'Fai una mossa sicura: una stella o un puntino.', cipher: 'Scopri una lettera sicura.',
  };
  const task = (id, t) => (CARD_TASK[id] ? CARD_TASK[id][t] || 'Fai una mossa utile.' : id === 'stars' ? (t === 'place' ? 'Metti una stella sicura.' : 'Metti un puntino sicuro: una casella dove la stella non può stare.')
    : TASK[id] || 'Trova una mossa sicura: un numero che sei certo vada lì.');
  const SKIP_IC = '<svg viewBox="0 0 24 24"><path d="M6 6l7 6-7 6M16 6v12"/></svg>';

  function start(id) {
    const G = Z.GAMES[id], T = S.TAGS[id] || {};
    const tags = Object.keys(T).filter(t => !(SKIP[id] || []).includes(t));
    const res = {};            /* tag → elenco di punteggi (1 giusto subito, 0.5 con errori o lento, 0 saltato) */
    const missing = new Set(); /* ragionamenti per cui non si è trovato un esercizio */
    const taught = new Set();  /* ragionamenti già spiegati con un esercizio guidato */
    let count = 0, lessons = 0, quit = false, keyOff = null;
    Z.ui.closeOverlay();
    Z.ui.leave();
    Z.ui.applyTheme(Z.themeById(Z.nextTheme()));
    const screen = Z.ui.screen;
    screen.style.removeProperty('--h');

    /* quale ragionamento chiedere adesso (null = basta, si passa al mini rompicapo).
       Ogni ragionamento nuovo comincia con un esercizio guidato (learn): spiegato, con la zona che si illumina, su
       una griglia piccola e quasi finita; poi lo stesso ragionamento da soli. Solo questi ultimi danno il punteggio. */
    function pick() {
      if (count >= MAX) return null;
      const avail = tags.filter(t => !missing.has(t));
      for (const t of avail) if (!res[t]) return { t, learn: !taught.has(t) };
      for (const t of avail) if (res[t].length === 1 && (res[t][0] < 1 || count < MIN)) return { t };
      for (const t of avail) if (res[t].length === 2 && res[t][0] !== res[t][1] && count < MAX) return { t };
      return null;
    }
    /* difficoltà: i guidati sempre dai gradini più bassi, gli altri salgono piano coi ragionamenti più avanzati */
    function opts(t, learn) {
      const j = Math.max(0, tags.indexOf(t)), base = learn ? 0 : Math.round(j / Math.max(1, tags.length - 1) * 3);
      return (learn ? [0, 1, 3, 6] : [base, base + 2, base + 4]).map(r => S.optsAt(id, Math.min(S.RUNGS - 1, r)));
    }
    function waiting(text) {
      screen.innerHTML = '';
      screen.className = 'game quiz';
      screen.append(bar(''), h('div.board-wrap', null, h('div.loading', null, h('div.spinner'), h('p', { text }))));
    }
    function bar(sub) {
      return h('header.gbar', null,
        h('button.icon-btn', { type: 'button', 'aria-label': 'Esci dal quiz', html: Z.ICONS.back, on: { click: leave } }),
        h('div.gtitle', null, h('b', { text: 'Quiz · ' + G.name }), h('span', { text: sub })),
        h('span.rp-sp'));
    }
    function leave() {
      quit = true;
      if (keyOff) keyOff();
      Z.Percorso.list();
    }

    async function nextOne() {
      if (quit) return;
      const q = pick();
      if (!q) { miniStep(); return; }
      const t = q.t, learn = !!q.learn;
      waiting(learn ? 'Preparo un esempio da guardare insieme…' : 'Preparo il prossimo esercizio…');
      const d = await S.work({ job: 'exercise', id, tag: t, opts: opts(t, learn), ms: learn ? 4000 : 3000, easy: learn });
      if (quit) return;
      if (!d || d.none || !d.P) {
        /* senza esempio guidato si prova comunque l'esercizio normale */
        if (learn) taught.add(t); else missing.add(t);
        nextOne();
        return;
      }
      const ex = { P: d.P, s: d.s, tag: t, goal: d.goal, task: task(id, t), tip: d.tip, why: d.why, area: d.area, focus: d.focus };
      if (learn) {
        taught.add(t);
        lessons++;
        play(Object.assign(ex, { learn: true, label: `Impara · ${lessons}` }), () => nextOne());
        return;
      }
      count++;
      play(Object.assign(ex, { label: `Esercizio ${count}` }), score => {
        (res[t] = res[t] || []).push(score);
        nextOne();
      });
    }
    async function miniStep() {
      waiting('Preparo il mini rompicapo finale…');
      const d = await S.work({ job: 'mini', id, opt: S.optsAt(id, 0) });
      if (quit) return;
      if (!d || !d.P) { finish(null); return; }
      play({ P: d.P, s: d.s, mini: true, label: 'Ultimo: un mini rompicapo', task: 'Risolvilo fino in fondo, con calma.' }, (score, info) => finish(info));
    }

    /* un esercizio: il gioco vero (G.view) con un ctx che controlla ogni mossa */
    function play(ex, done) {
      const P = ex.P;
      let cur = Z.clone(ex.s), hist = [], gs = null, errs = 0, over = false, flip = 0;
      const t0 = Date.now();
      screen.innerHTML = '';
      screen.className = 'game quiz';
      const wrap = h('div.board-wrap');
      const controls = h('div.controls');
      const msg = h('p.qz-msg', { role: 'status', 'aria-live': 'polite' });
      const ctx = {
        board: wrap, controls, get puzzle() { return P; }, get state() { return cur; },
        commit(ns) { if (!over) move(cur, ns); },
        preview(ns) { if (over) return; cur = ns; view.render(cur); },
        begin() { gs = JSON.stringify(cur); },
        end() { if (gs !== null && gs !== JSON.stringify(cur) && !over) move(JSON.parse(gs), cur); gs = null; },
        mark() {}, miss() { if (!over) wrong(); },
      };
      const view = G.view(ctx);
      Z.Quiz.now = { ctx, get P() { return P; }, get s() { return cur; }, ex }; /* per le prove automatiche */
      view.el.classList.add('board');
      wrap.append(view.el);
      const bUndo = h('button.tool', { type: 'button', html: Z.ICONS.undo + '<span>Annulla</span>', on: { click: () => {
        if (over || !hist.length) return;
        cur = hist.pop(); view.render(cur); bUndo.disabled = !hist.length;
      } } });
      bUndo.disabled = true;
      const bSkip = h('button.tool', { type: 'button', html: SKIP_IC + '<span>Salta</span>', on: { click: () => {
        if (over) return;
        over = true;
        end(0, { skipped: true });
      } } });
      /* esercizio guidato: cos'è il ragionamento, dove guardare (la zona si illumina) e, se serve, la mossa spiegata */
      let learn = null;
      const glow = list => { if (view.flash && list && list.length && wrap.isConnected) view.flash(list); };
      if (ex.learn) {
        const name = T[ex.tag] ? T[ex.tag][0] : '';
        const here = h('p.qz-here', { html: ex.tip || 'Guarda la zona che si illumina: lì c’è la mossa.' });
        const bWhere = h('button.btn.qz-small', { type: 'button', text: 'Dove guardo?', on: { click: () => glow(ex.area || ex.focus) } });
        const bShow = h('button.btn.qz-small', { type: 'button', text: 'Mostrami la mossa', on: { click: () => {
          if (ex.why) here.innerHTML = ex.why;
          here.classList.add('why');
          bShow.remove();
          glow(ex.focus || ex.area);
        } } });
        learn = { here, el: h('section.qz-learn', null,
          h('p.qz-kind', { text: 'Un ragionamento nuovo' }),
          name ? h('h3', { text: name[0].toUpperCase() + name.slice(1) }) : null,
          T[ex.tag] ? h('p', { text: T[ex.tag][1] }) : null,
          here,
          h('div.qz-btns', null, bWhere, ex.why ? bShow : null)) };
      }
      screen.append(bar(ex.label), learn ? learn.el : null, h('p.qz-task', { text: ex.learn ? 'Prova tu: ' + ex.task[0].toLowerCase() + ex.task.slice(1) : ex.task }),
        wrap, msg, controls, h('nav.toolbar.qz-tools', null, bUndo, bSkip));
      if (learn) { setTimeout(() => glow(ex.area || ex.focus), 500); setTimeout(() => glow(ex.area || ex.focus), 2300); }
      function move(a, b) {
        const e = S.judge(id, P, a, b);
        hist.push(a); bUndo.disabled = false;
        cur = b; view.render(cur);
        if (e === 'err' || e === 'away') {
          wrong();
          /* torna indietro da sola, con calma */
          over = true;
          setTimeout(() => { if (!wrap.isConnected) return; cur = hist.pop() || a; bUndo.disabled = !hist.length; view.render(cur); over = false; }, 650);
          return;
        }
        const pr = S.exProgress(id, ex.tag, P, cur);
        if (ex.mini ? G.solved(P, cur) : pr.ok >= ex.goal && pr.bad === 0) {
          over = true;
          const ms = Date.now() - t0;
          msg.className = 'qz-msg ok';
          msg.textContent = Z.say('Giusto!', 'Esatto!', 'Ben fatto!', 'Proprio così!');
          if (ex.mini) view.el.classList.add('solved');
          if (learn) {
            /* nel guidato si legge con calma il perché, poi si va avanti quando si vuole */
            if (ex.why) { learn.here.innerHTML = ex.why; learn.here.classList.add('why'); }
            learn.el.querySelector('.qz-btns').replaceChildren(h('button.btn.primary.qz-small', { type: 'button', text: 'Avanti: ora prova da solo', on: { click: () => end(1, { ok: true }) } }));
            return;
          }
          setTimeout(() => end(errs ? 0.5 : ms > SLOW ? 0.5 : 1, { ok: true, err: errs, ms }), ex.mini ? 1300 : 900);
        } else if (msg.classList.contains('no')) { msg.className = 'qz-msg'; msg.textContent = ''; }
      }
      function wrong() {
        errs++;
        msg.className = 'qz-msg no';
        msg.textContent = ex.learn ? Z.say('Non è questa: guarda la zona che si illumina.', 'Quasi: rileggi il consiglio e guarda dove si illumina.')
          : Z.say('Non è questa: riprova con calma.', 'Questa mossa non va: prova a guardare meglio.', 'Non ancora: riprova, hai tutto il tempo.');
        if (ex.learn) setTimeout(() => glow(ex.area || ex.focus), 700);
        clearTimeout(flip);
      }
      function end(score, info) {
        if (keyOff) keyOff();
        done(score, Object.assign({ tag: ex.tag }, info));
      }
      /* tastiera (per chi gioca dal computer) */
      const onKey = e => { if (!over && view.onKey && view.onKey(e)) e.preventDefault(); };
      document.addEventListener('keydown', onKey);
      keyOff = () => { document.removeEventListener('keydown', onKey); keyOff = null; };
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
      view.render(cur);
    }

    /* resoconto finale */
    function finish(miniInfo) {
      const score = {};
      for (const t in res) score[t] = res[t].reduce((a, b) => a + b, 0) / res[t].length;
      const mini = miniInfo ? { ok: !!miniInfo.ok, err: miniInfo.err || 0, ms: miniInfo.ms || 0 } : null;
      S.quizDone(id, score, mini);
      Z.ui.applyTheme(Z.themeById(Z.store.get('homeTheme', 'giardino')));
      screen.innerHTML = '';
      screen.className = 'home percorso';
      const good = tags.filter(t => score[t] === 1), mid = tags.filter(t => score[t] > 0 && score[t] < 1), bad = tags.filter(t => score[t] === 0);
      const li = t => h('li', { text: T[t][0][0].toUpperCase() + T[t][0].slice(1) });
      const sec = (title, list) => (list.length ? [h('h3', { text: title }), h('ul', null, ...list.map(li))] : []);
      const tipT = bad[0] || mid[0];
      screen.append(
        h('header.topbar.pc-top', null,
          h('button.icon-btn', { type: 'button', 'aria-label': 'Torna al Percorso', html: Z.ICONS.back, on: { click: () => Z.Percorso.list() } }),
          h('div.pc-title', null, h('h1', { text: 'Quiz completato' }), h('p.sub', { text: G.name }))),
        h('section.pc-words', { style: { '--h': G.hue } },
          h('div.pc-wh', null, h('div.card-ic', { html: G.icon }), h('h2', { text: 'Com\'è andata' })),
          h('p', { text: good.length === tags.length ? 'Hai risolto tutti gli esercizi al primo colpo: complimenti, il Percorso partirà da un passo impegnativo.'
            : good.length ? 'Hai già delle buone basi: il Percorso partirà da qui e ti farà allenare quello che serve.'
            : 'Nessun problema: il Percorso partirà dalle basi e ti accompagnerà un passo alla volta.' }),
          ...sec('Sai già', good), ...sec('Con qualche dubbio', mid), ...sec('Da allenare', bad),
          tipT ? h('p.pc-focus', null, h('b', { text: 'Un consiglio: ' }), T[tipT][1]) : null,
          mini ? h('p.pc-help', { text: mini.ok ? `Mini rompicapo risolto${mini.err ? ' (con ' + mini.err + (mini.err === 1 ? ' mossa da rifare' : ' mosse da rifare') + ')' : ' senza errori'}.` : 'Mini rompicapo saltato: va benissimo, lo ritroverai nel Percorso.' }) : null),
        h('section.pc-go', { style: { '--h': G.hue } },
          h('button.btn.primary', { type: 'button', text: 'Inizia il Percorso', on: { click: () => Z.Percorso.next(id) } }),
          h('p', { text: 'Il Percorso di ' + G.name + ' ora è sbloccato.' })));
    }

    nextOne();
  }

  Z.Quiz = { start };
})();
