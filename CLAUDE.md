# Rompicapo Zen

Web app in italiano con 15 rompicapo tradizionali (Sudoku, Ponti, Futoshiki, Calcudoku, Collega i colori,
Stelle, Tubi, Luci, Porte colorate, Cruciverba, Incastro, Parole nascoste, Labirinto, Frase cifrata, Anagrammi) e 5 solitari di carte (Solitario classico, FreeCell, Piramide, TriPeaks, Golf) in stile cartoon vivace ma calmo, "zen". Pubblicata su GitHub Pages:
https://alfa40.github.io/rompicapo-zen/ (si pubblica da sola a ogni push su `main`, con `.github/workflows/pagine.yml`).

## Come è fatto
- JavaScript semplice, senza build né dipendenze: `index.html` carica gli script classici in ordine.
- `js/core.js`: oggetto globale `window.Zen` (Z): registro dei giochi (`Z.register`), opzioni di difficoltà
  (`Z.defaultOpts`, `Z.getOpts`, `Z.setOpts`, `Z.optsSummary`), temi, `Z.store` (localStorage con prefisso), `Z.h` (DOM).
- `js/numgrid.js`: griglie con numeri (Sudoku, Futoshiki, Calcudoku) e `Z.latinSolver`, il risolutore «umano» condiviso.
- **Rompicapo logici, mai a tentativi**: Sudoku, Futoshiki, Calcudoku, Stelle, Ponti, Tubi e Collega i colori hanno un
  risolutore che usa solo ragionamenti da persona, a livelli (opzione «Ragionamenti» o «Tecniche»). Il generatore tiene
  solo rompicapo che questo risolutore completa al livello scelto (così sono anche unici) e il Suggerimento spiega il
  passo che lui trova. Dove il ragionamento si ferma, il generatore aggiunge un aiuto visibile e bloccato: pezzi fissati
  nei Tubi (`P.fixed`), stelle già messe nelle Stelle (`P.given`), tratti di filo già disegnati in Collega i colori
  (`P.links`, che `solved` controlla). Luci: si tocca solo dalla seconda riga in giù, così «inseguire le luci»
  dall'alto risolve sempre. Porte colorate: `plan` cerca una sequenza di uscite e spostamenti che liberano un blocco.
  Se aggiungi una regola o un gioco logico, segui lo stesso schema e controlla che il Suggerimento non debba mai
  «svelare» una mossa.
- Giochi di parole: `js/games/crossword.js` (Cruciverba e Incastro) contiene il dizionario con le definizioni
  (`Z.DICT`, usato anche da `anagram.js`). Gli schemi sono fitti «a schema libero» come nelle riviste: si mettono
  parole vere, poi i buchi si riempiono con parole di due lettere, sigle delle province e pezzi di parola
  (`SHORT`, `FRAG`, con `how` che il Suggerimento usa per spiegarli); le caselle vuote vicino al bordo restano fuori; `wordsearch.js` ha i suoi temi e chiavi, `cipher.js` i proverbi.
  Solo lettere A–Z senza accenti. Tastiera di lettere comune: `Z.letterPad` in `core.js`.
- `js/games/<gioco>.js`: ogni gioco ha `rules` (scritte con `Z.rules({goal, rules, play, start})`: scopo, regole complete,
  comandi e primo passo, comprensibili anche a chi non ha mai giocato; la prima partita le mostra una parte alla volta), `options`, `generate(opt)` (ogni rompicapo è generato al momento e ha una sola
  soluzione), `init`, `view(ctx)`, `solved`, `hint` (il suggerimento spiega il ragionamento) e `_check`.
- Comandi con le frecce (tasto «Frecce» nella barra, scelta salvata per gioco): il gioco espone `view.cursor()`,
  di solito con `Z.gridCursor(ctx, {...})` (riquadro mosso dalle frecce e tasti del gioco) o `Z.arrowPad({compact})`
  per i giochi che hanno già una casella scelta; `ctx.mark(el, quiet)` evidenzia e fa seguire la vista sulla griglia
  ingrandita. Il tasto «Sposta» (mano, accanto a + e −) fa spostare la griglia ingrandita con un dito.
- Percorso: `js/stats.js` registra in silenzio ogni partita, **separata per gioco** (`stat:<id>` riepiloghi,
  `replay:<id>` ultime partite da rivedere, `weak:<id>` ragionamenti difficili, `rec:<id>` partita in corso): tempo attivo
  di ogni mossa, mossa giusta/sbagliata/che si allontana confrontata con la soluzione (`progress(P, s)` → `{ok, bad}`,
  in `stats.js` o nel gioco), Annulla, ripensamenti, suggerimenti, pause lunghe; una mossa corretta entro 3 s è un tocco
  sbagliato e non conta. Ogni risultato di `hint` ha un `tag` (il ragionamento usato, nomi e consigli in `Z.Stats.TAGS`).
  `js/percorso.js`: pagine del Percorso (si sblocca per gioco dopo 5 partite finite), resoconto e «Rivedi la partita».
  «Prossimo passo»: livello per gioco (`path:<id>`, scala di 10 gradini dalle opzioni del gioco) che sale o scende
  secondo come è andata; nel worker si generano alcuni rompicapo e si tiene quello che usa di più i ragionamenti
  difficili per il giocatore (`Z.Stats.nextStep`).
  `js/quiz.js`: quiz di un gioco (sblocca il Percorso anche senza 5 partite): esercizi «trova la mossa» preparati nel
  worker (una situazione di un rompicapo vero in cui serve proprio quel ragionamento); ogni ragionamento nuovo comincia
  con un esercizio guidato e non valutato (griglia piccola e quasi finita, spiegazione, zona che si illumina, «Mostrami
  la mossa» col perché del Suggerimento), poi lo stesso da soli; adattivi (8–11, dal più facile),
  senza suggerimenti, si possono saltare; le mosse sbagliate tornano indietro; mini rompicapo finale; poi
  `Z.Stats.quizDone` scrive profilo (`quiz:<id>`, `weak:<id>`, `path:<id>`) e mostra un resoconto.
- Solitari: `js/games/cards.js` (carte francesi). Sono 5 giochi con id e dati separati (`klondike`, `freecell`,
  `pyramid`, `tripeaks`, `golf`) ma con `family: 'solitari'`: nel menu (categoria «Carte») c'è una sola scheda e il
  gioco si sceglie nel pannello della difficoltà (`FAMILIES` in `app.js`). Le smazzate sono casuali ma sempre
  vincibili: `generate` ne prova finché la ricerca trova la strada (`P.sol`); con mosse sbagliate la partita può però
  bloccarsi (`random: true`). `hint` cerca una strada con una ricerca a
  tempo (conosce le carte coperte ma non le nomina); se non c'è, restituisce null e `stuck(P, s)` spiega con
  gentilezza. `winnable(P)` serve al mini rompicapo del quiz.
- `js/app.js`: menu, scelta della difficoltà (salvata per gioco), partita, annulla/ripristina, zoom sulla griglia,
  salvataggio della partita in corso, rompicapo preparati in anticipo in `js/worker.js` (tutti tranne il Sudoku).
- `js/proposte.js`: proposte degli amici (tasto «Migliora il gioco» nel menu, solo col codice degli amici).
- `css/style.css`: stile; colori come variabili derivate da `--h`, tema chiaro/scuro automatico.
- `sw.js`: funziona anche offline. **Se aggiungi un file del gioco mettilo in `FILES` e aumenta il numero di `CACHE`; aumenta allo stesso numero anche
  `?v=` dei file in `index.html`** (così il telefono non mescola file nuovi e vecchi).

## Regole del gioco (da rispettare se la richiesta non dice esplicitamente il contrario)
- Tutto in italiano, testi brevi e gentili.
- Ogni finestra (`openSheet` in `app.js`) ha la X in alto a destra per chiuderla.
- Stile calmo: animazioni morbide, niente audio, niente timer, punteggi o progressione **durante la partita**: tempi e
  crescita si vedono solo nelle pagine del Percorso.
- Aiuti solo Annulla/Ripristina e Suggerimento, entrambi illimitati. Il Suggerimento è a due passi: prima un consiglio
  (`tip`, con `area` da far lampeggiare: dove guardare e che ragionamento usare, senza fare la mossa), poi la mossa con
  `why` che spiega bene perché. Tono gentile e mai critico (anche sugli errori), frasi variate con `Z.say`.
  I testi dei suggerimenti (e i consigli in `Z.Stats.TAGS`) sono semplicissimi, come per un bambino di 5 anni: frasi
  corte, una idea per frase, parole di tutti i giorni (niente «candidati», «vincolo»…), passi concreti («Facciamo finta…»,
  «Allora qui va il 4!»).
  Chi ha il codice degli amici o del proprietario può valutare ogni suggerimento (scelte veloci → server `/rz/hint`);
  una volta a settimana il server ne fa una proposta «Valutazioni dei suggerimenti» per Claude.
- Il tema visivo cambia a ogni partita; la partita in corso resta salvata.
- Deve funzionare bene sul telefono (iPhone, anche aggiunto alla schermata Home) e col tema scuro.

## Controllo
- `node tools/test.js`: genera e controlla ogni gioco alle difficoltà minima, di base e massima (circa 1–2 minuti).
- `node tools/test-hints.js`: risolve ogni gioco usando solo il Suggerimento (circa 2 minuti). Deve stampare "Tutto ok".
- `node --check <file>` per controllare la sintassi di un file.

## Proposte degli amici (lavoro su GitHub)
Le proposte arrivano dal gioco e le prepara Claude su GitHub (`.github/workflows/proposte.yml`) sul ramo
`proposta/<numero>`; l'anteprima è pubblicata in `anteprime/<numero>/` (con un suo prefisso dei salvataggi,
`window.ZEN_PREFIX`). Gli amici provano le anteprime e chiedono modifiche; a pubblicarle nel gioco può essere solo il
proprietario (codice `capo-…`, solo impronta nel codice e nel server). Chi lavora a una proposta:
- fa solo quello che chiede la proposta, e se è poco chiara non cambia niente e fa domande precise;
- non tocca `.github/`, il codice degli amici e l'indirizzo del server in `js/proposte.js`;
- non aggiunge script, servizi o link esterni, raccolta di dati, pubblicità o contenuti offensivi;
- esegue i controlli qui sopra prima di finire.
