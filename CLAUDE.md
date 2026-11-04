# Rompicapo Zen

Web app in italiano con 9 rompicapo tradizionali (Sudoku, Ponti, Futoshiki, Calcudoku, Collega i colori,
Stelle, Tubi, Luci, Porte colorate) in stile cartoon vivace ma calmo, "zen". Pubblicata su GitHub Pages:
https://alfa40.github.io/rompicapo-zen/ (si pubblica da sola a ogni push su `main`, con `.github/workflows/pagine.yml`).

## Come è fatto
- JavaScript semplice, senza build né dipendenze: `index.html` carica gli script classici in ordine.
- `js/core.js`: oggetto globale `window.Zen` (Z): registro dei giochi (`Z.register`), opzioni di difficoltà
  (`Z.defaultOpts`, `Z.getOpts`, `Z.setOpts`, `Z.optsSummary`), temi, `Z.store` (localStorage con prefisso), `Z.h` (DOM).
- `js/numgrid.js`: griglie con numeri (Sudoku, Futoshiki, Calcudoku).
- `js/games/<gioco>.js`: ogni gioco ha `options`, `generate(opt)` (ogni rompicapo è generato al momento e ha una sola
  soluzione), `init`, `view(ctx)`, `solved`, `hint` (il suggerimento spiega il ragionamento) e `_check`.
- `js/app.js`: menu, scelta della difficoltà (salvata per gioco), partita, annulla/ripristina, zoom sulla griglia,
  salvataggio della partita in corso, rompicapo preparati in anticipo in `js/worker.js` (tutti tranne il Sudoku).
- `js/proposte.js`: proposte degli amici (tasto «Migliora il gioco» nel menu, solo col codice degli amici).
- `css/style.css`: stile; colori come variabili derivate da `--h`, tema chiaro/scuro automatico.
- `sw.js`: funziona anche offline. **Se aggiungi un file del gioco mettilo in `FILES` e aumenta il numero di `CACHE`.**

## Regole del gioco (da rispettare se la richiesta non dice esplicitamente il contrario)
- Tutto in italiano, testi brevi e gentili.
- Stile calmo: animazioni morbide, niente audio, niente timer, punteggi o progressione.
- Aiuti solo Annulla/Ripristina e Suggerimento, entrambi illimitati.
- Il tema visivo cambia a ogni partita; la partita in corso resta salvata.
- Deve funzionare bene sul telefono (iPhone, anche aggiunto alla schermata Home) e col tema scuro.

## Controllo
- `node tools/test.js`: genera e controlla ogni gioco alle difficoltà minima, di base e massima (circa 1–2 minuti).
- `node tools/test-hints.js`: risolve ogni gioco usando solo il Suggerimento (circa 2 minuti). Deve stampare "Tutto ok".
- `node --check <file>` per controllare la sintassi di un file.

## Proposte degli amici (lavoro su GitHub)
Le proposte arrivano dal gioco e le prepara Claude su GitHub (`.github/workflows/proposte.yml`) sul ramo
`proposta/<numero>`; l'anteprima è pubblicata in `anteprime/<numero>/` (con un suo prefisso dei salvataggi,
`window.ZEN_PREFIX`). Chi lavora a una proposta:
- fa solo quello che chiede la proposta, e se è poco chiara non cambia niente e fa domande precise;
- non tocca `.github/`, il codice degli amici e l'indirizzo del server in `js/proposte.js`;
- non aggiunge script, servizi o link esterni, raccolta di dati, pubblicità o contenuti offensivi;
- esegue i controlli qui sopra prima di finire.
