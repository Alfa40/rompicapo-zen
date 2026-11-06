/* Rompicapo Zen — proposte degli amici per migliorare il gioco.
   Chi apre il gioco col link segreto (?amici=CODICE, oppure scrive il codice toccando 5 volte il logo) vede nel menu
   il tasto «Migliora il gioco»: scrive una proposta, Claude la prepara da solo su GitHub e ne pubblica un'anteprima
   (anteprime/<numero>/). Poi chiunque abbia il codice può provarla, chiedere modifiche o scartarla; pubblicarla nel
   gioco può solo il proprietario, col suo codice «capo-…» (?capo=CODICE o 5 tocchi sul logo; vale anche come codice
   degli amici).
   Il server è quello di Hustler Town (percorsi /rz/…, dati separati); il robot è .github/workflows/proposte.yml. */
(function () {
  'use strict';
  const Z = window.Zen, h = Z.h;
  const API = window.ZEN_API || 'https://hustler-town-server.onrender.com';
  /* impronta SHA-256 del codice degli amici (il codice vero non è nel codice del gioco) */
  const KEY_HASH = '592564b2e5388b009b3d4cb5d98bc1e2e9804a4a0334a2e3298edcd3baedb6eb';
  /* impronta del codice del proprietario: solo lui può pubblicare le anteprime nel gioco */
  const OWNER_HASH = '416e91c54d19eb46bf56512cb50b3fde210a9e3a514cc1876ca8b2354c6c8855';
  const PREVIEW = window.ZEN_PREVIEW || 0;

  async function sha256(s) {
    const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
    return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
  }
  const owner = () => Z.store.get('capo', '');
  const key = () => Z.store.get('amici', '') || owner();
  async function tryKey(k) {
    k = String(k || '').trim();
    if (!k || !crypto.subtle) return false;
    const hk = await sha256(k);
    if (hk === OWNER_HASH) { Z.store.set('capo', k); return true; }
    if (hk !== KEY_HASH) return false;
    Z.store.set('amici', k);
    return true;
  }
  function player() {
    let p = Z.store.get('player', '');
    if (!p) {
      p = 'p' + Array.from(crypto.getRandomValues(new Uint8Array(12)), x => x.toString(36).padStart(2, '0')).join('').slice(0, 20);
      Z.store.set('player', p);
    }
    return p;
  }
  /* indirizzo del gioco (anche dentro un'anteprima) e delle anteprime */
  const base = location.href.split(/[?#]/)[0].replace(/anteprime\/\d+\/.*$/, '').replace(/[^/]*$/, '');
  const previewUrl = id => `${base}anteprime/${id}/`;

  /* ---------- server ---------- */
  async function post(path, body, onSlow) {
    const slow = onSlow && setTimeout(onSlow, 3500);
    try {
      let last;
      for (let t = 0; t < 3; t++) {
        try {
          const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: key(), owner: owner() || undefined, ...body }) });
          const d = await r.json().catch(() => ({}));
          if (!r.ok) throw Object.assign(new Error(d.error || 'errore ' + r.status), { soft: r.status < 500, status: r.status });
          return d;
        } catch (e) {
          last = e;
          if (e.soft) throw e;
          await new Promise(res => setTimeout(res, 4000));
        }
      }
      throw last;
    } finally { clearTimeout(slow); }
  }

  /* ---------- stato delle proposte ---------- */
  let list = null, timer = 0, ui = null;
  const STATUS = {
    coda: p => p.queuePos ? (p.queuePos === 1 ? 'La prossima per Claude' : `In coda (${p.queuePos}ª)`) : 'In coda',
    lavoro: () => 'Claude ci sta lavorando…',
    pronta: () => owner() ? 'Anteprima pronta' : 'Anteprima pronta · da pubblicare',
    nulla: () => 'Claude ha bisogno di più dettagli',
    pubblicare: () => 'In pubblicazione…',
    pubblicata: () => 'Nel gioco',
    scartata: () => 'Scartata',
  };
  const when = t => {
    const d = Math.max(0, Date.now() - t) / 60000;
    if (d < 1) return 'adesso';
    if (d < 60) return `${Math.round(d)} min fa`;
    if (d < 60 * 24) return `${Math.round(d / 60)} h fa`;
    return new Date(t).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
  };

  async function refresh(onSlow) {
    const d = await post('/rz/list', {}, onSlow);
    list = d.proposals || [];
    return list;
  }
  const ready = () => (list || []).filter(p => p.status === 'pronta' || p.status === 'pubblicare');
  /* quante aspettano qualcuno che le provi */
  const toTry = () => (list || []).filter(p => p.status === 'pronta').length;

  /* ---------- valutazione dei suggerimenti (solo con il codice) ----------
     Le valutazioni vanno al server; ogni settimana diventano da sole una proposta per Claude («Suggerimenti
     migliorati»), che come le altre si pubblica solo col codice del proprietario. Senza rete restano in attesa. */
  const canRate = () => !PREVIEW && !!key();
  function rateHint(v) {
    const q = Z.store.get('hintq', []);
    q.push(Object.assign({ t: Date.now() }, v, { text: String(v.text || '').slice(0, 1200) }));
    Z.store.set('hintq', q.slice(-50));
    flushRates();
  }
  let flushing = false;
  async function flushRates() {
    if (flushing) return;
    flushing = true;
    try {
      for (;;) {
        const q = Z.store.get('hintq', []);
        if (!q.length) break;
        try { await post('/rz/hint', Object.assign({ player: player(), name: Z.store.get('nome', '') }, q[0])); }
        catch (e) { if (!e.soft || e.status === 404 || /sconosciut/.test(e.message)) throw e; } /* rifiutata dal server: si scarta (server non ancora aggiornato: si riprova) */
        Z.store.set('hintq', Z.store.get('hintq', []).slice(1));
      }
    } catch (e) { /* riproverà alla prossima valutazione */ }
    flushing = false;
  }

  /* ---------- tasto nel menu ---------- */
  function homeButton() {
    if (PREVIEW) return previewBanner();
    if (!key()) return null;
    const count = h('span.prop-count');
    const b = h('button.prop-btn', { type: 'button' },
      h('span.prop-ic', { html: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/></svg>' }),
      h('span', null, h('b', { text: 'Migliora il gioco' }), h('small', { text: 'Proponi una modifica a Claude o prova le anteprime' })),
      count);
    b.addEventListener('click', () => open());
    const show = () => { const n = toTry(); count.textContent = n ? String(n) : ''; count.hidden = !n; };
    count.hidden = true;
    if (list) show();
    refresh().then(show).catch(() => { /* il server dorme: si vedrà aprendo */ });
    return b;
  }

  function previewBanner() {
    return h('div.prev-banner', null,
      h('b', { text: `Anteprima della proposta n. ${PREVIEW}` }),
      h('span', { text: 'Le partite qui sono separate dal gioco vero.' }),
      h('a.btn', { href: base, text: 'Torna al gioco' }));
  }

  /* 5 tocchi sul logo: scrivi il codice degli amici (serve nell'app aggiunta alla schermata Home) */
  let taps = 0, tapT = 0;
  function logoTap() {
    if (PREVIEW) return;
    const now = Date.now();
    taps = now - tapT < 700 ? taps + 1 : 1;
    tapT = now;
    if (taps < 5) return;
    taps = 0;
    const input = h('input.prop-input', { type: 'text', placeholder: 'Codice degli amici', autocomplete: 'off', autocapitalize: 'off' });
    const msg = h('p.prop-msg');
    const go = async () => {
      if (await tryKey(input.value)) { Z.ui.closeOverlay(); Z.ui.home(); }
      else msg.textContent = 'Codice non valido.';
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    Z.ui.openSheet([
      h('div.sheet-head', null, h('h2', { text: 'Codice degli amici' })),
      h('p.rules', { text: 'Con il codice puoi proporre modifiche al gioco e provare le anteprime.' }),
      input, msg,
      h('div.sheet-actions', null,
        h('button.btn', { type: 'button', text: 'Annulla', on: { click: Z.ui.closeOverlay } }),
        h('button.btn.primary', { type: 'button', text: 'Conferma', on: { click: go } })),
    ]);
    setTimeout(() => input.focus(), 50);
  }

  /* ---------- finestra: Proposte e Anteprime ---------- */
  function open(tab = 'prop') {
    let cur = tab;
    const tabs = h('div.prop-tabs', { role: 'tablist' });
    const body = h('div.prop-body');
    const note = h('p.prop-msg');
    const card = Z.ui.openSheet([
      h('div.sheet-head', null, h('h2', { text: 'Migliora il gioco' })),
      tabs, note, body,
      h('div.sheet-actions', null, h('button.btn', { type: 'button', text: 'Chiudi', on: { click: Z.ui.closeOverlay } })),
    ], 'prop-sheet');
    const drawTabs = () => {
      tabs.innerHTML = '';
      const n = toTry();
      for (const [id, label] of [['prop', 'Proposte'], ['ant', 'Anteprime' + (n ? ` (${n})` : '')]]) {
        tabs.append(h('button.prop-tab' + (cur === id ? '.on' : ''), {
          type: 'button', role: 'tab', 'aria-selected': String(cur === id), text: label,
          on: { click: () => { cur = id; draw(); } },
        }));
      }
    };
    const draw = () => {
      drawTabs();
      body.innerHTML = '';
      if (cur === 'prop') body.append(...proposalsTab(load));
      else body.append(...previewsTab(load));
    };
    const load = async quiet => {
      if (!quiet && !list) body.append(h('p.prop-wait', { text: 'Carico le proposte…' }));
      try {
        await refresh(() => { note.textContent = 'Sto svegliando il server: può volerci un minuto…'; });
        note.textContent = '';
      } catch (e) {
        note.textContent = 'Non riesco a collegarmi al server: ' + e.message + '. Riprova tra poco.';
      }
      if (card.isConnected && !card.querySelector('textarea:focus')) draw();
    };
    ui = { draw, load };
    draw();
    load();
    clearInterval(timer);
    timer = setInterval(() => { if (!card.isConnected) { clearInterval(timer); ui = null; return; } load(true); }, 20000);
  }

  function proposalsTab(load) {
    const name = h('input.prop-input', { type: 'text', maxlength: 20, placeholder: 'Il tuo nome', value: Z.store.get('nome', '') });
    const text = h('textarea.prop-text', { rows: 4, maxlength: 2000, placeholder: 'Cosa vorresti cambiare o aggiungere? Più dettagli scrivi, meglio Claude capisce.' });
    text.value = Z.store.get('bozza', '');
    text.addEventListener('input', () => Z.store.set('bozza', text.value));
    const msg = h('p.prop-msg');
    const send = h('button.btn.primary', { type: 'button', text: 'Invia a Claude' });
    send.addEventListener('click', async () => {
      const t = text.value.trim();
      if (t.length < 5) { msg.textContent = 'Scrivi qualcosa in più.'; return; }
      Z.store.set('nome', name.value.trim());
      send.disabled = true;
      msg.textContent = 'Invio…';
      try {
        await post('/rz/send', { player: player(), name: name.value.trim(), text: t }, () => { msg.textContent = 'Sto svegliando il server: può volerci un minuto…'; });
        text.value = ''; Z.store.del('bozza');
        msg.textContent = 'Inviata! Claude la prepara appena tocca a lei: quando è pronta la trovi in Anteprime.';
        await load(true);
      } catch (e) { msg.textContent = 'Non inviata: ' + e.message; }
      send.disabled = false;
    });
    const out = [
      h('div.prop-form', null,
        h('label.opt-label', { text: 'La tua proposta' }), text,
        h('div.prop-row', null, name, send), msg,
        h('p.opt-help', { text: 'Claude la prepara da solo e ne fa un\'anteprima da provare. A pubblicarla nel gioco ci pensa il proprietario del gioco.' })),
    ];
    if (!list) return out;
    const open = list.filter(p => ['coda', 'lavoro', 'nulla'].includes(p.status));
    const done = list.filter(p => ['pubblicata', 'scartata'].includes(p.status));
    if (open.length) out.push(h('h3.opt-title', { text: 'In preparazione' }), ...open.map(p => item(p, load)));
    const n = toTry();
    if (n) out.push(h('p.opt-help', { text: `${n === 1 ? 'Un\'anteprima è pronta' : n + ' anteprime sono pronte'} da provare: le trovi in Anteprime.` }));
    if (done.length) {
      const box = h('details.prop-arch', null, h('summary', { text: `Archivio (${done.length})` }), ...done.map(p => item(p, load)));
      out.push(box);
    }
    return out;
  }

  function previewsTab(load) {
    if (!list) return [];
    const r = ready();
    if (!r.length) return [h('p.prop-empty', { text: 'Nessuna anteprima da provare, per ora. Quando Claude finisce una proposta, compare qui.' })];
    return r.map(p => item(p, load, true));
  }

  /* una proposta: testo, stato, messaggio di Claude e (se pronta) le azioni */
  function item(p, load, full) {
    const el = h('div.prop-item.st-' + p.status);
    el.append(
      h('div.prop-top', null, h('span.prop-n', { text: 'n. ' + p.id }), h('span.prop-st', { text: STATUS[p.status] ? STATUS[p.status](p) : p.status })),
      h('p.prop-txt', { text: p.text }),
      h('p.prop-by', { text: `${p.name || 'Anonimo'} · ${when(p.t)}` }));
    if (p.change && (p.status === 'coda' || p.status === 'lavoro')) el.append(h('p.prop-change', { text: 'Modifiche chieste: ' + p.change }));
    if (p.comment && (full || p.status === 'nulla')) {
      el.append(h('details.prop-claude', { open: p.status === 'nulla' }, h('summary', { text: 'Cosa dice Claude' }), h('p', { text: p.comment })));
    }
    if (p.err) el.append(h('p.prop-err', { text: p.err }));
    if (p.log && p.log.length > 1 && full) {
      el.append(h('details.prop-log', null, h('summary', { text: 'Storia' }),
        ...p.log.map(l => h('p', { text: `${when(l.t)} — ${l.who} ${l.what}` }))));
    }
    const msg = h('p.prop-msg');
    const act = (action, extra = {}) => async () => {
      msg.textContent = '…';
      try {
        await post('/rz/decide', { player: player(), name: Z.store.get('nome', ''), id: p.id, action, ...extra });
        msg.textContent = action === 'publish' ? 'Fatto! Tra qualche minuto è nel gioco per tutti.' : action === 'reject' ? 'Scartata.' : 'Richiesta inviata: Claude aggiorna l\'anteprima appena tocca a lei.';
        setTimeout(() => load(true), 600);
      } catch (e) { msg.textContent = 'Non riuscito: ' + e.message; }
    };
    const changeBox = label => {
      const t = h('textarea.prop-text', { rows: 3, maxlength: 2000, placeholder: 'Cosa deve cambiare Claude?' });
      const b = h('button.btn', { type: 'button', text: label });
      b.addEventListener('click', () => {
        if (t.value.trim().length < 3) { msg.textContent = 'Scrivi cosa cambiare.'; return; }
        act('change', { text: t.value.trim() })();
      });
      return h('div.prop-changebox', null, t, b);
    };
    if (p.status === 'pronta') {
      const ask = h('button.btn', { type: 'button', text: 'Chiedi modifiche' });
      const box = h('div');
      ask.addEventListener('click', () => { box.replaceChildren(changeBox('Invia le modifiche')); ask.remove(); });
      el.append(
        h('div.prop-actions', null,
          h('a.btn.primary', { href: previewUrl(p.id), target: '_blank', rel: 'noopener', text: 'Prova l\'anteprima' }),
          owner() ? h('button.btn.primary', { type: 'button', text: 'Pubblica nel gioco', on: { click: () => confirmIn(el, 'Pubblicarla nel gioco per tutti?', 'Pubblica', act('publish')) } }) : null),
        owner() ? null : h('p.opt-help', { text: 'Provala e, se serve, chiedi modifiche: a pubblicarla nel gioco ci pensa il proprietario.' }),
        h('div.prop-actions', null, ask,
          h('button.btn.prop-no', { type: 'button', text: 'Scarta', on: { click: () => confirmIn(el, 'Scartare questa proposta?', 'Scarta', act('reject')) } })),
        box);
    } else if (p.status === 'nulla') {
      el.append(changeBox('Rispondi a Claude'),
        h('div.prop-actions', null, h('button.btn.prop-no', { type: 'button', text: 'Scarta', on: { click: () => confirmIn(el, 'Scartare questa proposta?', 'Scarta', act('reject')) } })));
    } else if (p.status === 'coda' && !p.change) {
      el.append(h('div.prop-actions', null, h('button.btn.prop-no', { type: 'button', text: 'Ritira', on: { click: () => confirmIn(el, 'Ritirare questa proposta?', 'Ritira', act('reject')) } })));
    }
    el.append(msg);
    return el;
  }
  function confirmIn(el, text, yes, onYes) {
    const box = h('div.prop-confirm', null, h('p', { text }),
      h('div.prop-actions', null,
        h('button.btn', { type: 'button', text: 'Annulla', on: { click: () => box.remove() } }),
        h('button.btn.primary', { type: 'button', text: yes, on: { click: () => { box.remove(); onYes(); } } })));
    el.append(box);
    box.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  /* ?amici=CODICE (o ?capo=CODICE) nel link: si ricorda il codice e lo si toglie dall'indirizzo */
  const ready$ = (async () => {
    const m = /[?&](?:amici|capo)=([^&#]+)/.exec(location.search);
    if (!m || PREVIEW) return false;
    const ok = await tryKey(decodeURIComponent(m[1]));
    history.replaceState(null, '', location.pathname + location.hash);
    return ok;
  })();

  Z.Proposte = { homeButton, logoTap, open, ready: ready$, canRate, rateHint };
})();
