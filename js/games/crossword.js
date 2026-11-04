/* Cruciverba — a schema libero: parole incrociate con le definizioni */
(function () {
  'use strict';
  const Z = window.Zen;
  const OPTIONS = [
    { id: 'size', label: 'Dimensione', def: 11, choices: [{ v: 9, label: 'Piccolo' }, { v: 11, label: 'Medio' }, { v: 13, label: 'Grande' }, { v: 15, label: 'Enorme' }] },
    { id: 'giv', label: 'Lettere date', def: 2, choices: [
      { v: 1, label: 'Tante', help: 'Circa una lettera su tre è già scritta.' },
      { v: 2, label: 'Poche', help: 'Qualche lettera è già scritta per cominciare.' },
      { v: 3, label: 'Nessuna', help: 'Lo schema è tutto vuoto.' },
    ] },
  ];

  /* parola|definizione (solo lettere senza accenti) */
  const DICT = `ACQUA|Bevanda che disseta, senza colore
ALBA|Il primo chiarore del mattino
ALBERO|Ha tronco, rami e foglie
AMICO|Persona a cui si vuole bene
ANATRA|Uccello acquatico che fa «qua qua»
ANELLO|Si porta al dito
ANNO|Dura dodici mesi
APE|Insetto che produce il miele
ARANCIA|Agrume da spremere a colazione
ARCO|Si usa per tirare le frecce
ARIA|La respiriamo
ARPA|Strumento a corde di forma triangolare
ASINO|Animale che raglia
AUTO|Ha quattro ruote e un volante
BAGNO|Stanza con la vasca
BALENA|Il mammifero più grande del mare
BANANA|Frutto giallo amato dalle scimmie
BARCA|Galleggia e si muove con remi o vela
BICI|Ha due ruote e i pedali (forma breve)
BOSCO|Luogo con tanti alberi
BRACCIO|Va dalla spalla alla mano
BURRO|Si spalma sul pane, è fatto con la panna
CANE|Il migliore amico dell'uomo
CANDELA|Fa luce con una fiammella
CAPPELLO|Si porta in testa
CAROTA|Ortaggio arancione amato dai conigli
CASA|Ci si abita
CASTELLO|Dimora di re e principesse, con le torri
CAVALLO|Animale che nitrisce e galoppa
CENA|Il pasto della sera
CHIAVE|Apre la serratura
CIELO|È azzurro nelle giornate serene
CIGNO|Elegante uccello bianco dei laghi
CIPOLLA|Ortaggio che fa piangere chi lo taglia
COLLINA|Rilievo più basso della montagna
CONIGLIO|Ha orecchie lunghe e mangia carote
CORDA|Serve per legare o per saltare
CORVO|Uccello nero che gracchia
CUCINA|Stanza dove si preparano i pasti
CUORE|Batte nel petto
CUSCINO|Ci si appoggia la testa per dormire
DADO|Ha sei facce con i puntini
DELFINO|Mammifero marino molto intelligente
DENTE|Serve per masticare
DITO|La mano ne ha cinque
DIVANO|Ci si siede in salotto
DONO|Regalo
DRAGO|Creatura delle fiabe che sputa fuoco
ERBA|Verde copertura del prato
ESTATE|La stagione più calda
FARFALLA|Insetto con ali colorate
FARINA|Polvere bianca per fare il pane
FARO|Torre che illumina il mare di notte
FATA|Ha la bacchetta magica
FIENO|Erba secca per gli animali
FILO|Si infila nella cruna dell'ago
FINESTRA|Si apre per cambiare l'aria
FIORE|Sboccia in primavera
FIUME|Scorre verso il mare
FOCA|Mammifero dei mari freddi, con i baffi
FOGLIA|Cade dagli alberi in autunno
FORMICA|Piccolo insetto molto laborioso
FORNO|Ci si cuoce la pizza
FRAGOLA|Piccolo frutto rosso con i semini fuori
FUOCO|Brucia e scalda
GALLINA|Depone le uova
GATTO|Fa le fusa
GELATO|Dolce freddo in coppetta o cono
GHIACCIO|Acqua diventata solida
GIRAFFA|Ha il collo lunghissimo
GOMMA|Cancella la matita
GRANO|Cereale da cui si ottiene la farina
GUFO|Uccello notturno con grandi occhi
INVERNO|La stagione più fredda
ISOLA|Terra circondata dal mare
LAGO|Specchio d'acqua circondato da terra
LAMPADA|Fa luce sul comodino
LANA|Si ottiene dalle pecore
LATTE|Bevanda bianca che dà la mucca
LETTO|Ci si dorme
LEONE|Il re della savana
LIBRO|Ha pagine da leggere
LIMONE|Agrume giallo e aspro
LUNA|Il satellite della Terra
LUPO|Ulula alla luna
MAGO|Fa incantesimi
MANO|Ha cinque dita
MARE|Grande distesa di acqua salata
MATITA|Scrive e si tempera
MELA|Frutto rosso o verde, anche quello di Biancaneve
MIELE|Lo producono le api
MONTAGNA|Rilievo molto alto
MUCCA|Fa «muu» e dà il latte
MURO|Parete di mattoni
NASO|Serve per sentire gli odori
NAVE|Grande imbarcazione
NEVE|Fiocchi bianchi d'inverno
NIDO|La casa degli uccellini
NOTTE|Viene dopo il giorno
NUVOLA|Bianca o grigia, sta in cielo
OCA|Uccello dal collo lungo che starnazza
OCCHIO|Serve per vedere
OLIO|Condimento ottenuto dalle olive
OMBRELLO|Ripara dalla pioggia
ONDA|Si infrange sulla spiaggia
ORA|Sessanta minuti
ORECCHIO|Serve per sentire
ORO|Metallo prezioso giallo
ORSO|Grande animale goloso di miele
ORTO|Ci si coltivano gli ortaggi
OSSO|Il cane lo rosicchia
PALLA|Rotola e rimbalza
PANE|Si fa con farina, acqua e lievito
PANDA|Orso bianco e nero che mangia bambù
PASTA|Spaghetti, penne o fusilli
PATATA|Tubero delle patatine fritte
PECORA|Fa «bee» e dà la lana
PENNA|Scrive con l'inchiostro
PERA|Frutto dalla forma allungata
PESCE|Nuota e respira con le branchie
PIANO|In musica, il contrario di forte
PIEDE|Sta in fondo alla gamba
PIOGGIA|Cade dalle nuvole
PIZZA|Margherita o capricciosa
PONTE|Attraversa un fiume
PORTA|Si apre per entrare
PORTO|Dove attraccano le navi
PRATO|Distesa di erba
QUADRO|Dipinto appeso al muro
RAGNO|Tesse la tela
RANA|Gracida nello stagno
RAMO|Parte dell'albero dove crescono le foglie
RISO|Cereale del risotto
ROSA|Fiore profumato con le spine
RUOTA|È rotonda e gira
SALE|Rende saporiti i cibi
SASSO|Piccola pietra
SCALA|Ha i gradini
SCARPA|Si mette al piede
SCUOLA|Ci si va per imparare
SEDIA|Ha quattro gambe e lo schienale
SEME|Da lui nasce la pianta
SERA|Tra il pomeriggio e la notte
SOLE|La stella del nostro sistema
SPECCHIO|Riflette la nostra immagine
STELLA|Brilla nel cielo di notte
STRADA|Ci passano le automobili
TAVOLO|Ci si mangia sopra
TAZZA|Si usa per il tè o per il latte
TELEFONO|Squilla quando qualcuno chiama
TENDA|Si monta in campeggio
TERRA|Il nostro pianeta
TETTO|Copre la casa
TIGRE|Grande felino a strisce
TOPO|Ha paura del gatto
TORRE|Costruzione alta e stretta
TORTA|Dolce delle feste, con le candeline
TRENO|Corre sui binari
TRAMONTO|Quando il sole scende all'orizzonte
UOVO|Lo depone la gallina
UVA|Cresce a grappoli nella vigna
VASO|Contiene fiori o piante
VELA|Spinge la barca col vento
VENTO|Aria in movimento
VERDE|Il colore dell'erba
VETRO|Materiale trasparente delle finestre
VINO|Si ottiene dall'uva
VIOLINO|Piccolo strumento ad arco
VOLPE|Animale furbo dalla coda folta
ZAINO|Si porta sulle spalle
ZEBRA|Cavallo a strisce bianche e nere
ZUCCA|Ortaggio arancione di Halloween
ZUCCHERO|Rende dolce il caffè
ALA|Serve all'uccello per volare
AGO|Si usa per cucire
AMO|Gancetto del pescatore
ANCA|Articolazione tra coscia e bacino
ATOMO|Particella piccolissima della materia
AULA|La stanza della classe
AVENA|Cereale dei fiocchi della colazione
BACIO|Si dà con le labbra
BAULE|Grande cassa da viaggio
BECCO|La bocca dell'uccello
BORSA|Si porta a mano o a tracolla
BOTTE|Contiene il vino in cantina
BUCO|Apertura, foro
CALZA|Si mette al piede prima della scarpa
CAMPO|Ci si coltiva il grano
CARTA|Ci si scrive sopra
CERA|Il materiale delle candele
COLLO|Unisce la testa al corpo
CORO|Gruppo di cantanti
COSTA|Dove la terra incontra il mare
CRETA|Argilla per modellare
DAMA|Gioco con le pedine sulla scacchiera
DUNA|Collinetta di sabbia
ECO|Ripete la voce in montagna
EDERA|Pianta rampicante sempreverde
ELICA|Gira e muove l'aria nel ventilatore
FERRO|Metallo che arrugginisce
FESTA|Celebrazione in compagnia
FICO|Frutto dolce di fine estate
GABBIA|Ci stanno gli uccellini
GALLO|Canta all'alba
GAMBA|Ci serve per camminare
GOLA|Si arrossa col raffreddore
GRILLO|Canta nei prati d'estate
IDEA|Pensiero improvviso
ROMA|La capitale d'Italia
ITALIA|Paese a forma di stivale
LAMA|La parte tagliente del coltello
LEPRE|Corre più veloce del coniglio
LIMA|Attrezzo per le unghie
LUCE|Il contrario del buio
MAPPA|Disegno di un territorio
MELONE|Frutto estivo dalla buccia rugosa
META|Traguardo
MIRA|Si prende prima di tirare
MORA|Frutto del rovo
NOCE|Frutto dal guscio duro
NOTA|Do, re, mi...
OASI|Angolo verde nel deserto
OLIVA|Il frutto da cui si fa l'olio
ORCA|Grande cetaceo bianco e nero
OTTO|Il numero dopo il sette
PACE|Il contrario della guerra
PALA|Serve per scavare
PANCA|Sedile lungo, senza schienale
PASSO|Si fa camminando
PERLA|Si forma nell'ostrica
PIUMA|Leggerissima, ricopre gli uccelli
POLLO|Si mangia arrosto con le patate
POZZO|Ci si cala il secchio per l'acqua
RAPA|Ortaggio da cui «non si cava sangue»
RETE|Si usa per pescare
RIVA|Il bordo del fiume
ROSPO|Somiglia alla rana
SACCO|Si riempie di patate
SALA|Stanza grande
SEGA|Attrezzo per tagliare il legno
SETA|Tessuto prodotto dai bachi
SOGNO|Lo facciamo dormendo
SUCCO|Si beve, di frutta
TANA|Rifugio degli animali
TELA|La tesse il ragno
TEMPO|Lo misura l'orologio
TOGA|Veste dei giudici
TONNO|Pesce che si trova anche in scatola
TRE|Il numero dopo il due
UNO|Il primo numero
DUE|Il numero dopo l'uno
SEI|Il numero dopo il cinque
DIECI|Le dita delle due mani
NOVE|Il numero prima del dieci
ODORE|Lo si sente col naso
OMBRA|La fa il corpo al sole
ARCA|Quella di Noè
ARENA|Anfiteatro romano, come quella di Verona
ASTA|Bastone lungo
ATLANTE|Libro di carte geografiche
BAITA|Casetta di legno in montagna
BRINA|Rugiada ghiacciata
CANOA|Piccola barca a pagaie
CARRO|Veicolo trainato dai buoi
CENERE|Resta dopo il fuoco
CERVO|Ha le corna ramificate
COPPA|Premio dei vincitori
CORONA|La porta il re
DIARIO|Quaderno dei pensieri
ELMO|Protegge la testa del cavaliere
FIABA|Racconto con fate e draghi
GIOCO|Si fa per divertirsi
GRADO|Unità della temperatura
LAVA|Esce dal vulcano
LENTE|Vetro degli occhiali
LETTERA|Si spedisce in una busta
LUMACA|Si porta la casa sulla schiena
MAGLIA|Si indossa quando fa freddo
MARMO|Pietra delle statue
MASCHERA|Si indossa a Carnevale
MOTO|Ha due ruote e il motore
NANO|Ce ne sono sette con Biancaneve
NODO|Si fa ai lacci delle scarpe
PALCO|Ci si esibiscono gli attori
PARCO|Giardino pubblico
PIATTO|Ci si mette il cibo
PINO|Albero con gli aghi
POLO|Il punto più a nord della Terra
RADIO|Trasmette musica e notizie
REMO|Si usa per spingere la barca
RICCIO|Animaletto con gli aculei
RONDINE|Uccello che annuncia la primavera
SALTO|Si fa con le gambe, verso l'alto
SCOPA|Serve per spazzare
SECCHIO|Contenitore con il manico
SIRENA|Metà donna e metà pesce
SPADA|L'arma del cavaliere
SPIAGGIA|Ci si prende il sole d'estate
TAPPETO|Copre il pavimento
TAVOLA|Si apparecchia per il pranzo
TEATRO|Ci si va a vedere uno spettacolo
TIMONE|Serve a guidare la nave
TORO|Animale con le corna
TRONCO|Il fusto dell'albero
TULIPANO|Fiore tipico dell'Olanda
VALIGIA|Si prepara per partire
VALLE|Sta tra due montagne
VULCANO|Montagna che erutta
ZAMPA|Il piede degli animali
ZERO|Il numero prima dell'uno
NONNA|La mamma della mamma
ZIO|Il fratello del papà
ARCOBALENO|Appare dopo la pioggia, con sette colori
CIOCCOLATO|Dolce fatto con il cacao
BIBLIOTECA|Ci si prendono in prestito i libri
ELEFANTE|Ha la proboscide
PINGUINO|Uccello che non vola e vive al freddo
TARTARUGA|Lenta, con il guscio
COCCODRILLO|Rettile del fiume dai denti aguzzi
GIARDINO|Spazio verde intorno alla casa
FORCHETTA|Ha i rebbi per prendere il cibo
CUCCHIAIO|Si usa per la minestra
COLTELLO|Taglia la carne
BICCHIERE|Ci si versa l'acqua
OROLOGIO|Segna le ore
CALENDARIO|Mostra giorni e mesi
PRIMAVERA|La stagione dei fiori
AUTUNNO|La stagione delle foglie che cadono
SETTIMANA|Dura sette giorni
DOMENICA|Il giorno di riposo della settimana
ASTRONAUTA|Viaggia nello spazio
AEREO|Vola con le ali e i motori
ELICOTTERO|Vola con le pale che girano
BICICLETTA|Si guida pedalando
SCOIATTOLO|Roditore dalla coda folta che ama le ghiande
FARMACIA|Ci si comprano le medicine
OSPEDALE|Ci si curano i malati
MUSEO|Ci sono opere d'arte da ammirare
POSTINO|Porta le lettere
POMPIERE|Spegne gli incendi
CUOCO|Prepara i piatti al ristorante
PITTORE|Dipinge quadri
MAESTRA|Insegna ai bambini
DOTTORE|Cura i malati
SPAGHETTI|Pasta lunga e sottile
LASAGNA|Pasta al forno a strati
MOZZARELLA|Formaggio della pizza margherita
POMODORO|Ortaggio rosso della salsa
BASILICO|Erba profumata del pesto
INSALATA|Piatto di verdure crude condite
MINESTRA|Piatto caldo da mangiare col cucchiaio
BISCOTTO|Si inzuppa nel latte
CAMMELLO|Animale del deserto con due gobbe
CANGURO|Salta e tiene il piccolo nel marsupio
SCIMMIA|Si arrampica sugli alberi e ama le banane
AQUILA|Rapace che vola altissimo
FARO|Torre con la luce per i naviganti
GROTTA|Cavità nella roccia
DESERTO|Distesa di sabbia senza acqua
FORESTA|Grande bosco fitto
CASCATA|Acqua che precipita dall'alto
FULMINE|Lampo durante il temporale
TUONO|Il rumore dopo il lampo
NEBBIA|Non fa vedere lontano
SABBIA|Ricopre la spiaggia
ROCCIA|Pietra della montagna
RADICE|Tiene la pianta nella terra
MUSICA|Arte dei suoni
CANZONE|Si canta con testo e melodia
CHITARRA|Strumento a sei corde
TAMBURO|Si suona con le bacchette
FLAUTO|Strumento a fiato con i fori
TROMBA|Strumento a fiato squillante
PENNELLO|Serve al pittore per dipingere
COLORE|Rosso, giallo o blu
DISEGNO|Si fa con la matita
POESIA|Componimento in versi
ROMANZO|Libro con una lunga storia inventata
CALCIO|Sport con il pallone e le porte
TENNIS|Sport con racchetta e pallina
NUOTO|Sport in piscina
SCI|Si usano sulla neve
MEDAGLIA|Premio al collo del vincitore
SQUADRA|Gruppo di giocatori
STADIO|Ci si gioca la partita
PALESTRA|Ci si allena
FORMAGGIO|Si ottiene dal latte, a pasta dura o molle
PROSCIUTTO|Salume del panino, crudo o cotto
SALAME|Insaccato da affettare
MARMELLATA|Si spalma sulle fette biscottate
CORNETTO|Brioche della colazione al bar
POLENTA|Si fa con la farina di mais
BRODO|Ci si cuociono i tortellini
FRITTATA|Si fa con le uova sbattute in padella
PADELLA|Ci si frigge
PENTOLA|Ci si cuoce la pasta
FORNAIO|Fa il pane
SARTO|Cuce i vestiti
MEDICO|Ci visita quando stiamo male
PILOTA|Guida l'aereo
MARINAIO|Lavora sulla nave
GIUDICE|Emette le sentenze
ATTORE|Recita in teatro o al cinema
CANTANTE|Si esibisce con la voce
PIANETA|Gira intorno al Sole
COMETA|Ha la coda luminosa
UNIVERSO|Contiene tutte le stelle
VIAGGIO|Si fa per visitare luoghi lontani
VACANZA|Periodo di riposo dal lavoro o dalla scuola
REGALO|Si scarta con gioia
SORRISO|Si fa con le labbra quando si è contenti
AMORE|Sentimento profondo per qualcuno
NATALE|Festa con l'albero e i doni
PASQUA|Festa delle uova di cioccolato
CARNEVALE|Festa delle maschere
COMPLEANNO|Si festeggia una volta all'anno
OSPITE|Chi viene a trovarci
VICINO|Abita nella casa accanto
FRATELLO|Figlio degli stessi genitori
SORELLA|Figlia degli stessi genitori
CUGINO|Figlio dello zio
NIPOTE|Figlio del figlio
MAMMA|Ci ha messi al mondo
BAMBINO|Piccolo essere umano
GIGANTE|Altissimo personaggio delle fiabe
PRINCIPE|Figlio del re
REGINA|Moglie del re
CAVALIERE|Combatte con armatura e spada
PIRATA|Navigatore che cerca tesori, con la benda
TESORO|Forziere pieno di monete d'oro
MONETA|Pezzo di metallo che vale denaro
BANCA|Ci si depositano i soldi
NEGOZIO|Ci si fanno acquisti
MERCATO|Bancarelle in piazza
PIAZZA|Spazio aperto al centro del paese
CHIESA|Ha il campanile
PAESE|Piccolo centro abitato
CITOFONO|Si suona per farsi aprire
CAMINO|Ci si accende il fuoco in casa
BALCONE|Si affaccia sulla strada
CANTINA|Sta sotto la casa
SOFFITTA|Sta sotto il tetto
ARMADIO|Ci si appendono i vestiti
CASSETTO|Si apre tirandolo
POLTRONA|Comodo sedile imbottito
TENDA|Copre la finestra
SAPONE|Fa la schiuma per lavarsi
SPUGNA|Assorbe l'acqua
ASCIUGAMANO|Si usa dopo la doccia
DENTIFRICIO|Si mette sullo spazzolino
PETTINE|Serve per i capelli
OCCHIALI|Aiutano a vedere meglio
GUANTO|Si mette alla mano
SCIARPA|Si avvolge al collo
GIACCA|Si indossa sopra la camicia
CAMICIA|Ha il colletto e i bottoni
BOTTONE|Si infila nell'asola
TASCA|Ci si mettono le mani o le chiavi
CINTURA|Tiene su i pantaloni`;

  const WORDS = [], CLUE = {};
  for (const line of DICT.split('\n')) {
    const [w, c] = line.split('|');
    if (!w || !c || CLUE[w]) continue;
    CLUE[w] = c.trim();
    WORDS.push(w);
  }

  /* prova a mettere la parola con inizio (x, y) in direzione d (0 = orizzontale, 1 = verticale) */
  function fits(n, g, used, w, x, y, d) {
    const dx = d ? 0 : 1, dy = d ? 1 : 0, L = w.length;
    const ex = x + dx * (L - 1), ey = y + dy * (L - 1);
    if (x < 0 || y < 0 || ex >= n || ey >= n) return -1;
    const at = (cx, cy) => (cx < 0 || cy < 0 || cx >= n || cy >= n ? '' : g[cy * n + cx]);
    if (at(x - dx, y - dy) || at(ex + dx, ey + dy)) return -1;
    let cross = 0;
    for (let k = 0; k < L; k++) {
      const cx = x + dx * k, cy = y + dy * k, i = cy * n + cx, c = g[i];
      if (c) {
        if (c !== w[k] || used[d][i]) return -1;
        cross++;
      } else if (at(cx + dy, cy + dx) || at(cx - dy, cy - dx)) return -1;
    }
    return cross > 0 && cross < L ? cross : -1;
  }

  function build(n) {
    const g = new Array(n * n).fill(''), used = [new Uint8Array(n * n), new Uint8Array(n * n)];
    const place = (w, x, y, d) => {
      for (let k = 0; k < w.length; k++) { const i = (y + d * k) * n + x + (1 - d) * k; g[i] = w[k]; used[d][i] = 1; }
      list.push({ w, x, y, d });
    };
    const list = [];
    const first = Z.pick(WORDS.filter(w => w.length >= n - 4 && w.length <= n));
    place(first, Z.ri(0, n - first.length), (n / 2) | 0, 0);
    const inUse = new Set([first]);
    const target = Math.round(n * n / 7.5);
    for (let miss = 0; list.length < target && miss < 3;) {
      let best = null, bs = 0;
      for (const w of Z.shuffle(WORDS.slice())) {
        if (inUse.has(w) || w.length > n) continue;
        for (let k = 0; k < w.length; k++) for (let i = 0; i < n * n; i++) {
          if (g[i] !== w[k]) continue;
          const d = used[0][i] ? 1 : 0;
          if (used[d][i]) continue;
          const x = i % n - (d ? 0 : k), y = ((i / n) | 0) - (d ? k : 0);
          const c = fits(n, g, used, w, x, y, d);
          if (c < 0) continue;
          /* più incroci e parole più lunghe; un po' di caso per variare */
          const sc = c * 3 + w.length * 0.5 + Math.random() * 2;
          if (sc > bs) { bs = sc; best = { w, x, y, d }; }
        }
        if (best && bs > 8) break;
      }
      if (!best) { miss++; continue; }
      place(best.w, best.x, best.y, best.d);
      inUse.add(best.w);
    }
    return list;
  }

  function generate(opt) {
    const n = opt.size;
    let best = null;
    for (let t = 0; t < 12; t++) {
      const list = build(n);
      if (!best || list.length > best.length) best = list;
      if (list.length >= Math.round(n * n / 8)) break;
    }
    /* si ritaglia lo schema intorno alle parole */
    let x0 = n, y0 = n, x1 = 0, y1 = 0;
    for (const p of best) {
      x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x + (p.d ? 0 : p.w.length - 1)); y1 = Math.max(y1, p.y + (p.d ? p.w.length - 1 : 0));
    }
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const sol = new Array(w * h).fill('.');
    const words = best.map(p => ({ word: p.w, x: p.x - x0, y: p.y - y0, d: p.d, clue: CLUE[p.w] }));
    for (const p of words) for (let k = 0; k < p.word.length; k++) sol[(p.y + p.d * k) * w + p.x + (1 - p.d) * k] = p.word[k];
    /* numerazione: in ordine di lettura, un numero per ogni casella dove comincia una parola */
    const starts = [...new Set(words.map(p => p.y * w + p.x))].sort((a, b) => a - b);
    for (const p of words) p.num = starts.indexOf(p.y * w + p.x) + 1;
    words.sort((a, b) => a.d - b.d || a.num - b.num);
    /* lettere già scritte */
    const cells = Z.range(w * h).filter(i => sol[i] !== '.');
    const share = [0, 0.33, 0.12, 0][opt.giv] || 0;
    const given = Z.shuffle(cells.slice()).slice(0, Math.round(cells.length * share)).sort((a, b) => a - b);
    return { w, h, sol: sol.join(''), words, given, opt };
  }

  const cellsOf = (P, p) => Z.range(p.word.length).map(k => (p.y + p.d * k) * P.w + p.x + (1 - p.d) * k);
  const label = p => `${p.num} ${p.d ? 'verticale' : 'orizzontale'}`;

  function hint(P, st) {
    const s = Z.clone(st);
    const wrong = Z.range(P.w * P.h).filter(i => st.v[i] && st.v[i] !== P.sol[i]);
    let p, why;
    if (wrong.length) {
      p = P.words.find(q => cellsOf(P, q).includes(wrong[0]));
      why = `In <b>${label(p)}</b> c'è una lettera sbagliata. «${p.clue}»: la risposta è <b>${p.word}</b>. `;
    } else {
      const open = P.words.filter(q => cellsOf(P, q).some(i => st.v[i] !== P.sol[i]));
      if (!open.length) return null;
      /* la parola con più lettere già scritte grazie agli incroci è la più facile */
      const known = q => cellsOf(P, q).filter(i => st.v[i]).length / q.word.length;
      const top = Math.max(...open.map(known));
      p = Z.pick(open.filter(q => known(q) === top));
      const k = cellsOf(P, p).filter(i => st.v[i]).length;
      why = `<b>${label(p)}</b>: «${p.clue}». ` + (k
        ? `Avevi già ${k} lettere su ${p.word.length}, che restringono molto le possibilità: è <b>${p.word}</b>. `
        : `La risposta è <b>${p.word}</b>. `);
    }
    for (const i of cellsOf(P, p)) s.v[i] = P.sol[i];
    why += 'Ora le parole che la incrociano hanno una lettera in più da cui partire.';
    return { state: s, focus: cellsOf(P, p), why };
  }

  Z.register({
    options: OPTIONS,
    id: 'crossword',
    name: 'Cruciverba',
    hue: 300,
    tagline: 'Parole incrociate, con le definizioni.',
    rules: `<p>Scrivi nelle caselle le parole che rispondono alle <b>definizioni</b>: quelle <b>orizzontali</b> si leggono da sinistra a destra, quelle <b>verticali</b> dall'alto in basso.</p>
      <p>Tocca una casella per sceglierla, toccala di nuovo per passare dall'orizzontale al verticale. Sopra la tastiera vedi la definizione della parola scelta; con le frecce passi alla successiva, e toccando la definizione vedi l'elenco completo.</p>
      <p>Le parole si incrociano: ogni lettera trovata aiuta anche l'altra parola.</p>`,
    icon: `<svg viewBox="0 0 64 64"><rect x="10" y="22" width="14" height="14" rx="3" class="ic-s ic-st"/><rect x="24" y="22" width="14" height="14" rx="3" class="ic-a"/><rect x="38" y="22" width="14" height="14" rx="3" class="ic-s ic-st"/><rect x="24" y="8" width="14" height="14" rx="3" class="ic-s ic-st"/><rect x="24" y="36" width="14" height="14" rx="3" class="ic-s ic-st"/><text x="31" y="33" class="ic-t ic-w">A</text></svg>`,
    generate,
    _check(P) {
      if (!P || P.words.length < 6) return 'troppo poche parole';
      const seen = new Set();
      for (const p of P.words) {
        if (!CLUE[p.word] || seen.has(p.word)) return 'parola non valida: ' + p.word;
        seen.add(p.word);
        if (cellsOf(P, p).map(i => P.sol[i]).join('') !== p.word) return 'schema incoerente: ' + p.word;
      }
      /* ogni sequenza di 2+ lettere in fila deve essere una parola con definizione */
      for (const d of [0, 1]) {
        const a = d ? P.h : P.w, b = d ? P.w : P.h;
        for (let r = 0; r < b; r++) {
          let run = '', st = -1;
          for (let k = 0; k <= a; k++) {
            const i = k < a ? (d ? k * P.w + r : r * P.w + k) : -1;
            const c = i >= 0 ? P.sol[i] : '.';
            if (c !== '.') { if (!run) st = i; run += c; continue; }
            if (run.length > 1 && !P.words.some(p => p.d === d && p.word === run && p.y * P.w + p.x === st)) return 'parola in più: ' + run;
            run = '';
          }
        }
      }
      return '';
    },
    _test: { WORDS, CLUE },
    init: P => {
      const v = new Array(P.w * P.h).fill('');
      for (const i of P.given) v[i] = P.sol[i];
      return { v };
    },
    solved: (P, s) => Z.range(P.w * P.h).every(i => P.sol[i] === '.' || s.v[i] === P.sol[i]),
    hint,
    view(ctx) {
      const P = ctx.puzzle, W = P.w, H = P.h;
      const isGiven = new Set(P.given);
      let cur = null, sel = -1, dir = 0;
      const el = Z.h('div.cw');
      el.style.setProperty('--w', W);
      el.style.setProperty('--h', H);
      const grid = Z.h('div.cw-grid');
      const nums = {};
      for (const p of P.words) nums[p.y * W + p.x] = p.num;
      const cells = [], lets = [];
      for (let i = 0; i < W * H; i++) {
        if (P.sol[i] === '.') { const b = Z.h('span.cw-c.blank'); grid.append(b); cells.push(b); lets.push(null); continue; }
        const l = Z.h('span.cw-l');
        const c = Z.h('span.cw-c', null, nums[i] ? Z.h('span.cw-n', { text: nums[i] }) : null, l);
        if (isGiven.has(i)) c.classList.add('given');
        c.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (sel === i) { if (slot(i, 1 - dir)) dir = 1 - dir; }
          else { sel = i; if (!slot(i, dir)) dir = 1 - dir; }
          paint();
        });
        grid.append(c); cells.push(c); lets.push(l);
      }
      el.append(grid);

      const slot = (i, d) => P.words.find(p => p.d === d && cellsOf(P, p).includes(i));
      const curWord = () => (sel >= 0 ? slot(sel, dir) : null);
      const selectWord = p => { sel = cellsOf(P, p).find(i => !cur || !cur.v[i]) ?? cellsOf(P, p)[0]; dir = p.d; paint(); };
      const step = k => {
        const p = curWord(), i = p ? P.words.indexOf(p) : -1;
        selectWord(P.words[(i + k + P.words.length) % P.words.length]);
      };

      /* definizione e tastiera */
      const clueTx = Z.h('button.cw-clue-tx', { type: 'button', on: { click: showAll } });
      const bar = Z.h('div.cw-bar', null,
        Z.h('button.key.cw-arrow', { type: 'button', 'aria-label': 'Definizione precedente', html: Z.ICONS.back, on: { click: () => step(-1) } }),
        clueTx,
        Z.h('button.key.cw-arrow.next', { type: 'button', 'aria-label': 'Definizione successiva', html: Z.ICONS.back, on: { click: () => step(1) } }));
      const kb = Z.h('div.cw-kb');
      for (const row of ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']) {
        const r = Z.h('div.cw-row');
        for (const L of row) r.append(Z.h('button.key.cw-k', { type: 'button', text: L, on: { click: () => type(L) } }));
        if (row[0] === 'Z') r.append(Z.h('button.key.tool.cw-k.wide', { type: 'button', 'aria-label': 'Cancella', html: Z.ICONS.erase, on: { click: back } }));
        kb.append(r);
      }
      ctx.controls.append(Z.h('div.cw-ctl', null, bar, kb));

      function showAll() {
        const sec = d => [Z.h('h3.cw-h', { text: d ? 'Verticali' : 'Orizzontali' }),
          ...P.words.filter(p => p.d === d).map(p => Z.h('button.cw-item' + (cur && cellsOf(P, p).every(i => cur.v[i]) ? '.done' : ''), {
            type: 'button', on: { click: () => { Z.ui.closeOverlay(); selectWord(p); } },
          }, Z.h('b', { text: p.num + '. ' }), p.clue + ` (${p.word.length})`))];
        Z.ui.openSheet([Z.h('div.cw-all', null, ...sec(0), ...sec(1)),
          Z.h('div.sheet-actions', null, Z.h('button.btn', { type: 'button', text: 'Chiudi', on: { click: Z.ui.closeOverlay } }))]);
      }
      function type(L) {
        if (!cur) return;
        if (sel < 0) { selectWord(P.words[0]); }
        const p = curWord();
        if (!isGiven.has(sel) && cur.v[sel] !== L) {
          const s = Z.clone(cur);
          s.v[sel] = L;
          ctx.commit(s);
        }
        if (p) { const c = cellsOf(P, p), k = c.indexOf(sel); if (k < c.length - 1) sel = c[k + 1]; }
        paint();
      }
      function back() {
        if (!cur || sel < 0) return;
        const p = curWord();
        if (!cur.v[sel] || isGiven.has(sel)) {
          if (!p) return;
          const c = cellsOf(P, p), k = c.indexOf(sel);
          if (k > 0) sel = c[k - 1];
        }
        if (cur.v[sel] && !isGiven.has(sel)) { const s = Z.clone(cur); s.v[sel] = ''; ctx.commit(s); }
        paint();
      }
      function move(dx, dy) {
        if (sel < 0) { selectWord(P.words[0]); return; }
        let x = sel % W, y = (sel / W) | 0;
        for (;;) {
          x += dx; y += dy;
          if (x < 0 || y < 0 || x >= W || y >= H) return;
          if (P.sol[y * W + x] !== '.') break;
        }
        sel = y * W + x;
        const d = dy ? 1 : 0;
        if (slot(sel, d)) dir = d; else if (!slot(sel, dir)) dir = 1 - dir;
        paint();
      }
      function paint() {
        if (!cur) return;
        const p = curWord(), on = new Set(p ? cellsOf(P, p) : []);
        cells.forEach((c, i) => {
          if (!lets[i]) return;
          lets[i].textContent = cur.v[i] || '';
          c.classList.toggle('word', on.has(i));
          c.classList.toggle('sel', i === sel);
        });
        clueTx.innerHTML = p ? `<b>${label(p)}</b> · ${p.clue} <span>(${p.word.length})</span>` : 'Tocca una casella per vedere la definizione';
      }

      return {
        el, aspect: W / H, letters: true,
        render(s) { cur = s; paint(); },
        flash(list) { (list || []).forEach(i => Z.flashEl(cells[i])); },
        onKey(e) {
          if (e.ctrlKey || e.metaKey || e.altKey) return false;
          if (/^[a-zA-Z]$/.test(e.key)) { type(e.key.toUpperCase()); return true; }
          if (e.key === 'Backspace' || e.key === 'Delete') { back(); return true; }
          if (e.key === 'ArrowLeft') { move(-1, 0); return true; }
          if (e.key === 'ArrowRight') { move(1, 0); return true; }
          if (e.key === 'ArrowUp') { move(0, -1); return true; }
          if (e.key === 'ArrowDown') { move(0, 1); return true; }
          if (e.key === 'Tab' || e.key === 'Enter') { step(e.shiftKey ? -1 : 1); return true; }
          if (e.key === ' ') { if (sel >= 0 && slot(sel, 1 - dir)) { dir = 1 - dir; paint(); } return true; }
          return false;
        },
      };
    },
  });
})();
