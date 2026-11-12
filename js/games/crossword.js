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
CINTURA|Tiene su i pantaloni
AIA|Il cortile della fattoria
AVO|Antenato, nonno di tanto tempo fa
BUE|Animale grosso che tirava l'aratro
BAR|Ci si beve il caffè
BLU|Il colore del mare profondo
ERA|Tanto tempo fa, come l'era dei dinosauri
GAS|Si accende sotto la pentola
GRU|Uccello dalle zampe lunghe, o macchina da cantiere
IRA|Rabbia molto forte
SUD|Il punto cardinale opposto al nord
EST|Il punto cardinale dove sorge il sole
NORD|Lo indica la bussola
OVEST|Il punto cardinale dove tramonta il sole
UFO|Disco volante
VIA|Strada di città
ZOO|Ci si vedono gli animali selvatici
MAI|Il contrario di sempre
NOI|Io e te insieme
VOI|Tu e gli altri
LORO|Quelle persone là
GOL|Si fa tirando in porta
BIS|Si chiede alla fine del concerto
NEO|Piccola macchia scura sulla pelle
MIO|Non tuo, ma ...
MIA|Non tua, ma ...
TUA|Non mia, ma ...
SUA|Di lei o di lui, al femminile
TRA|Piccola parola: ... poco arrivo
PER|Piccola parola: un regalo ... te
CON|Piccola parola: vengo ... te
NEI|Piccole macchie scure sulla pelle
TUO|Non mio, ma ...
SUO|Di lui o di lei
ANNI|Si contano al compleanno
ASSE|Tavola di legno
ANSA|Curva del fiume
AGLIO|Ha un odore forte e tiene lontani i vampiri
ALCE|Grosso cervo del nord
ALGA|Pianta del mare
ALI|Servono per volare
ALPE|Montagna alta
ALTO|Il contrario di basso
AMACA|Letto di rete appeso tra due alberi
ANGOLO|Lo formano due muri che si incontrano
ANIMA|Lo spirito di una persona
ANTA|Porta dell'armadio
APERTO|Il contrario di chiuso
ARATRO|Serve per lavorare la terra
ARGENTO|Metallo grigio e lucente
ARMA|Spada o lancia
AROMA|Profumo buono di cibo
ASILO|Scuola dei bambini piccoli
ASPRO|Il sapore del limone acerbo
ATTO|Parte di uno spettacolo a teatro
AVARO|Non spende mai niente
AZZURRO|Il colore del cielo sereno
BACCA|Piccolo frutto del bosco
BAFFI|Crescono sopra la bocca
BAGAGLIO|Si porta in viaggio
BALLO|Si fa a ritmo di musica
BANCO|Il tavolo dello scolaro
BANDA|Gruppo che suona per strada
BARBA|Cresce sul mento
BASSO|Il contrario di alto
BASTONE|Aiuta a camminare
BATTELLO|Piccola nave sul lago
BELLO|Il contrario di brutto
BENE|Il contrario di male
BIANCO|Il colore del latte
BIRO|Penna a sfera
BOCCA|Si apre per mangiare
BOLLA|Di sapone, vola e scoppia
BORGO|Piccolo paese antico
BOTTEGA|Negozio di un artigiano
BRUCO|Diventerà una farfalla
BRUTTO|Il contrario di bello
BUIO|Quando non c'è luce
BUONO|Ha un buon sapore
BUSTA|Ci si mette la lettera
CACAO|Serve per fare il cioccolato
CAFFE|Si beve nella tazzina
CALDO|Il contrario di freddo
CALMO|Tranquillo, sereno
CAMPANA|Suona sul campanile
CANALE|A Venezia ci passano le gondole
CANTO|Lo fa il cantante
CAPO|Chi comanda
CAPRA|Animale con la barbetta che bela
CARO|Costa tanto
CASCO|Protegge la testa in moto
CAVO|Filo elettrico
CEDRO|Grande albero, o agrume
CENTO|Dieci volte dieci
CERCHIO|Figura rotonda
CERO|Grossa candela
CIAO|Si dice per salutare
CIBO|Si mangia
CIMA|La punta della montagna
CINEMA|Ci si guardano i film
CINQUE|Le dita di una mano
CIRCO|Ci sono i clown e gli acrobati
CITTA|Più grande di un paese
CODA|La muove il cane felice
COLLA|Serve per attaccare
COLPO|Botta
CONO|Si riempie di gelato
CORNO|Ce l'ha il rinoceronte
CORPO|Testa, braccia e gambe
CORSA|Si fa correndo
CORTO|Il contrario di lungo
COSA|Oggetto qualunque
COTONE|Stoffa delle magliette
CREMA|Dolce e morbida, dentro i bignè
CRESTA|Ce l'ha il gallo in testa
CROCE|Due righe che si incrociano
CRUDO|Non cotto
CUBO|Il dado ne ha la forma
CULLA|Il lettino del neonato
DAINO|Animale del bosco con le macchie
DATO|Informazione
DEBOLE|Il contrario di forte
DENARO|I soldi
DIETA|Si fa per dimagrire
DIVISA|Vestito uguale per tutta la squadra
DOCCIA|Ci si lava in piedi
DOLCE|Il sapore dello zucchero
DOLORE|Fa male
DONNA|Persona adulta femmina
DORMIRE|Si fa a letto
DURO|Il contrario di morbido
EROE|Fa grandi imprese coraggiose
ESAME|Prova a scuola
ETNA|Vulcano della Sicilia
FAME|Si ha prima di mangiare
FANGO|Terra bagnata
FARE|Verbo: ... i compiti
FASE|Una delle facce della luna
FATTO|Cosa successa davvero
FAVOLA|Racconto con la morale
FEDE|L'anello degli sposi
FELICE|Molto contento
FIATO|Si prende per correre
FIERA|Mercato grande e festoso
FILA|Persone una dietro l'altra
FINE|Il contrario di inizio
FIOCCO|Di neve, o sul regalo
FIRMA|Si scrive in fondo alla lettera
FOCE|Dove il fiume finisce nel mare
FOGLIO|Pagina di carta
FONTE|Sorgente d'acqua
FORTE|Il contrario di debole
FOSSO|Scavo lungo la strada
FOTO|Si scatta con la macchina fotografica
FRECCIA|Si tira con l'arco
FREDDO|Il contrario di caldo
FRENO|Fa fermare la bici
FRONTE|Sta sopra gli occhi
FRUTTA|Mele, pere e banane
FUMO|Esce dal camino
FUNE|Corda grossa
GALA|Festa elegante
GARA|Competizione sportiva
GATTA|Femmina del gatto
GELO|Freddo che ghiaccia
GEMMA|Pietra preziosa
GENTE|Tante persone
GESSO|Si usa sulla lavagna
GIALLO|Il colore del limone
GIORNO|Dura ventiquattro ore
GIRO|Si fa intorno all'isolato
GOCCIA|Un pezzettino di pioggia
GONNA|Vestito da donna, senza pantaloni
GRANDE|Il contrario di piccolo
GRASSO|Il contrario di magro
GRIGIO|Il colore della nebbia
GUSTO|Sapore
IGLOO|Casa di ghiaccio
IMPERO|Regno grandissimo
INIZIO|Il contrario di fine
INNO|Canzone della nazione
LACCIO|Si allaccia alla scarpa
LADRO|Ruba
LAMPO|Luce del temporale
LARGO|Il contrario di stretto
LASTRA|Pezzo piatto di vetro
LATO|Il quadrato ne ha quattro
LAVORO|Lo si fa per guadagnare
LEGGE|Regola dello Stato
LEGNO|Viene dagli alberi
LENTO|Il contrario di veloce
LEVA|Serve per sollevare
LIBERO|Non prigioniero
LIEVITO|Fa gonfiare il pane
LINEA|Riga dritta
LINGUA|Sta nella bocca
LISCIO|Senza nodi né grinze
LITRO|Unità per misurare l'acqua
LOTTA|Combattimento
LUCCIOLA|Insetto che brilla di notte
LUNGO|Il contrario di corto
LUPA|Femmina del lupo
MAGRO|Il contrario di grasso
MALE|Il contrario di bene
MANICO|Si impugna
MANTO|Mantello
MARZO|Il mese di inizio primavera
MATTONE|Serve per costruire i muri
MATTINO|Viene dopo l'alba
MENTA|Erba dal profumo fresco
MENTO|Sta sotto la bocca
MESE|Ce ne sono dodici in un anno
METRO|Cento centimetri
MILLE|Dieci volte cento
MINUTO|Sessanta secondi
MODA|Si segue nel vestire
MOLLA|Rimbalza
MONDO|La Terra
MONTE|Montagna
MORBIDO|Il contrario di duro
MOSCA|Insetto che ronza
MOSTRA|Esposizione di quadri
MULO|Figlio di asino e cavalla
MULINO|Ha le pale e macina il grano
NASTRO|Si lega al regalo
NATURA|Piante e animali
NERO|Il colore del carbone
NIENTE|Nulla
NOME|Ce l'hanno tutte le persone
NONNO|Il papà del papà
NORMA|Regola
NUMERO|Si conta
NUOVO|Il contrario di vecchio
OCEANO|Più grande del mare
ODIO|Il contrario di amore
OGGI|Il giorno di adesso
OMBELICO|Sta in mezzo alla pancia
ONORE|Gloria e rispetto
OPERA|Si canta a teatro
ORARIO|Dice quando parte il treno
ORSA|Femmina dell'orso
ORTICA|Pianta che punge
OSTE|Padrone dell'osteria
OVALE|Forma dell'uovo
PADRE|Il papà
PAGINA|Si gira leggendo
PAGLIA|Ci dormono le mucche
PALAZZO|Edificio grande
PALMA|Albero delle spiagge calde
PANCIA|La pappa ci arriva
PANNA|Si monta per i dolci
PARETE|Muro della stanza
PAROLA|Si scrive con le lettere
PARTE|Pezzo di un tutto
PASTO|Pranzo o cena
PATTO|Accordo
PAURA|Si prova al buio
PAVONE|Fa la ruota con la coda
PELLE|Ci copre tutto il corpo
PELO|Ce l'ha il gatto
PEPE|Spezia che pizzica
PESCA|Frutto con la buccia vellutata
PESO|Si misura con la bilancia
PETALO|Parte colorata del fiore
PEZZO|Parte
PIANTA|Cresce nel vaso
PICCOLO|Il contrario di grande
PIENO|Il contrario di vuoto
PIETRA|Sasso
PIGIAMA|Si mette per dormire
PIOLO|Gradino della scala a pioli
PISTA|Ci corrono le auto
POLLICE|Il dito più grosso
POMPA|Gonfia le ruote
PORTONE|Porta grande del palazzo
POSTA|Ci arrivano le lettere
PRANZO|Si mangia a mezzogiorno
PREMIO|Si vince
PRESTO|Il contrario di tardi
PRIMO|Arriva prima di tutti
PROVA|Tentativo
PUNTO|Si mette alla fine della frase
RAGAZZO|Più grande di un bambino
RAME|Metallo rossiccio
RAZZO|Va nello spazio
REGNO|Il paese del re
RICCO|Ha tanti soldi
RIDERE|Si fa quando si è allegri
RIGA|Linea dritta
RIMA|Fa suonare bene la poesia
RIPOSO|Si fa quando si è stanchi
ROBOT|Macchina che si muove da sola
ROSSO|Il colore della fragola
ROTONDO|Come una palla
RUGA|Piega della pelle
RUMORE|Suono forte
RUSCELLO|Piccolo fiume
SACCA|Borsa morbida
SALSA|Si versa sulla pasta
SALUTE|Si augura a chi starnutisce
SANO|Non malato
SANTO|Persona molto buona della Chiesa
SAPERE|Conoscere
SAPORE|Si sente con la lingua
SCAFFALE|Ci si mettono i libri
SCATOLA|Contenitore di cartone
SCENA|Parte del film
SCHIENA|Sta dietro il corpo
SCOGLIO|Roccia nel mare
SCORZA|Buccia dura
SECCO|Senza acqua
SEDE|Posto principale
SEGNO|Traccia
SEMAFORO|Rosso, giallo e verde
SENTIERO|Stradina di montagna
SERPENTE|Striscia per terra
SETE|Si ha quando si vuole bere
SILENZIO|Quando non c'è rumore
SINDACO|Il capo del comune
SOLDATO|Fa parte dell'esercito
SONNO|Si ha la sera
SOPRA|Il contrario di sotto
SORTE|Il destino
SOTTO|Il contrario di sopra
SPAZIO|Ci vanno gli astronauti
SPESA|Si fa al supermercato
SPINA|Ce l'ha la rosa
SPORT|Calcio, nuoto, tennis
STAGIONE|Primavera, estate, autunno o inverno
STALLA|Casa delle mucche
STANZA|Parte della casa
STATUA|Scultura
STIVALE|Scarpa alta, e anche l'Italia
STOFFA|Tessuto
STORIA|Racconto
STRETTO|Il contrario di largo
STUFA|Scalda la casa
SUONO|Si sente con le orecchie
TACCO|Sotto la scarpa
TALPA|Scava sotto terra
TANTO|Molto
TAPPO|Chiude la bottiglia
TARDI|Il contrario di presto
TASTO|Si preme sulla tastiera
TELO|Si stende sulla spiaggia
TEMA|Si scrive a scuola
TENERO|Morbido
TESTA|Ci sono gli occhi e la bocca
TIMIDO|Si vergogna un po'
TINTA|Colore
TIRO|Lancio
TOSSE|Viene col raffreddore
TRAMA|La storia del film
TRISTE|Il contrario di allegro
TROTA|Pesce di fiume
TUBO|Ci passa l'acqua
TUTA|Si mette per fare sport
UMIDO|Un po' bagnato
UNGHIA|Sta in punta al dito
UOMO|Persona adulta maschio
URLO|Grido forte
USCITA|Il contrario di entrata
UTILE|Serve a qualcosa
VACCA|Mucca
VAGONE|Carrozza del treno
VALORE|Quanto vale una cosa
VAPORE|Esce dalla pentola che bolle
VECCHIO|Il contrario di nuovo
VELOCE|Il contrario di lento
VERO|Il contrario di falso
VESPA|Insetto giallo e nero che punge
VESTITO|Si indossa
VIALE|Strada larga con gli alberi
VISO|La faccia
VITA|Il tempo in cui si vive
VITE|Si avvita col cacciavite
VOCE|Si usa per parlare
VOLO|Lo fa l'uccello
VOTO|Lo dà la maestra
VUOTO|Il contrario di pieno
ZANZARA|Punge d'estate
ZOCCOLO|Scarpa di legno, o piede del cavallo
ZUPPA|Minestra calda
ACERO|Albero con le foglie rosse in autunno
AMARO|Il contrario di dolce
ANCORA|Tiene ferma la nave
ANTICO|Di tanto tempo fa
APRILE|Il mese dopo marzo
ARCATA|Fila di archi
ARTE|Pittura, musica e scultura
ASSO|La carta più forte
ATTESA|Si fa aspettando
AURORA|La luce prima dell'alba
AVVENTURA|Viaggio pieno di sorprese
BARILE|Botte di legno
BASE|La parte di sotto
BATTITO|Lo fa il cuore
BEVANDA|Si beve
BIDONE|Grosso contenitore
BILANCIA|Misura il peso
BIONDO|Colore di capelli chiaro
BORRACCIA|Si porta in gita piena d'acqua
BOTOLA|Porta nel pavimento
BRACE|Carbone acceso
BRANCO|Gruppo di lupi
BRETELLE|Tengono su i pantaloni
CALORE|Lo dà il sole
CAMERA|Stanza da letto
CANESTRO|Ci si fa canestro a basket
CANNA|Serve per pescare
CANOTTO|Barchetta di gomma
CAPELLI|Crescono sulla testa
CAREZZA|Gesto dolce con la mano
CARTELLO|Indica la strada
CATENA|Fatta di anelli
CAVOLO|Verdura a foglie
CENTRO|Il punto in mezzo
CERTO|Sicuro
CESTO|Cesta
CETRIOLO|Verdura verde e lunga
CHIOCCIOLA|Lumaca con la casetta
CIOTOLA|Ci mangia il gatto
COLAZIONE|Il pasto del mattino
COLLANA|Si porta al collo
CONCHIGLIA|Si trova sulla spiaggia
CORAGGIO|Il contrario di paura
CORNICE|Sta intorno al quadro
CORTILE|Spazio aperto tra le case
CUOIO|Pelle per le scarpe
DADI|Si tirano nel gioco dell'oca
DAMIGIANA|Grande bottiglia per il vino
DATTERO|Frutto della palma
DIAMANTE|Pietra preziosa durissima
DOMANDA|Finisce col punto di domanda
DOMANI|Il giorno dopo oggi
DOPO|Il contrario di prima
DOTE|Qualità
EDICOLA|Ci si comprano i giornali
ELENCO|Lista
ENTRATA|Il contrario di uscita
ERBETTA|Piccola erba
ESTERO|Fuori dall'Italia
FAGIOLO|Legume
FALCO|Uccello rapace
FALSO|Il contrario di vero
FAMIGLIA|Mamma, papà e figli
FATICA|Stanchezza
FEBBRE|Viene quando si è malati
FERMATA|Ci si aspetta l'autobus
FERIE|Vacanze dal lavoro
FETTA|Pezzo di torta
FIGLIO|Il bambino di mamma e papà
FINALE|L'ultima parte
FIORAIO|Vende i fiori
FOLLA|Tantissime persone
FONDO|La parte più bassa
FORMA|Tondo o quadrato
FORTUNA|Un quadrifoglio la porta
FRASE|Gruppo di parole
FUNGO|Cresce nel bosco
GALLERIA|Il treno ci passa sotto la montagna
GAMBERO|Va all'indietro
GELSO|Albero dei bachi da seta
GENITORI|Mamma e papà
GENNAIO|Il primo mese
GIOIA|Grande contentezza
GIORNALE|Si legge al mattino
GIUGNO|Il mese di inizio estate
GOMITO|Piega il braccio
GRAPPOLO|D'uva
GRIDO|Urlo
GUERRA|Il contrario di pace
INCHIOSTRO|Sta nella penna
ISTRICE|Ha gli aculei
LAMPONE|Frutto di bosco rosso
LAVAGNA|Ci si scrive col gesso
LEGUME|Fagiolo o lenticchia
LENZUOLO|Copre il materasso
LEONESSA|Femmina del leone
LIBRAIO|Vende i libri
LUGLIO|Mese d'estate
LUMINOSO|Pieno di luce
MACCHINA|Automobile
MAGGIO|Il mese delle rose
MANGIARE|Si fa a tavola
MANICA|Copre il braccio
MARITO|Lo sposo
MATERASSO|Sta sul letto
MATTA|Pazza
MAZZO|Di fiori, o di carte
MEDICINA|Cura le malattie
MERENDA|Si mangia il pomeriggio
MESTOLO|Cucchiaio grande per la minestra
MINIERA|Ci si scava il carbone
MIRTILLO|Bacca blu
MOGLIE|La sposa
MOMENTO|Attimo
MONTONE|Maschio della pecora
MORSO|Si dà al panino
MOTORE|Fa andare l'auto
MULINELLO|Vento che gira
NASCITA|Il primo giorno di vita
NEGOZIANTE|Lavora nel negozio
NEMICO|Il contrario di amico
NOCCIOLA|Frutto secco tondo
NOVEMBRE|Il mese dopo ottobre
OCCASIONE|Opportunità
OMBRELLONE|Fa ombra in spiaggia
ONESTO|Non dice bugie
ORCHESTRA|Tanti musicisti insieme
ORIZZONTE|Dove il cielo tocca il mare
OSTERIA|Locale dove si mangia
OTTOBRE|Il mese delle castagne
PACCO|Arriva per posta
PAGELLA|Ha i voti della scuola
PALLONE|Si calcia
PANINO|Si riempie di prosciutto
PAPAVERO|Fiore rosso dei campi
PARENTE|Della stessa famiglia
PASSERO|Piccolo uccello di città
PATENTE|Serve per guidare
PECORELLA|Piccola pecora
PEDONE|Cammina sulle strisce
PELUCHE|Orsacchiotto morbido
PENSIERO|Idea nella testa
PIGNA|Frutto del pino
PILA|Batteria
PIPISTRELLO|Vola di notte a testa in giù
PISCINA|Ci si nuota
POMERIGGIO|Viene dopo pranzo
PORTAFOGLIO|Ci si tengono i soldi
POZZANGHERA|Acqua per terra dopo la pioggia
PRUGNA|Frutto viola
PULCINO|Piccolo della gallina
QUADERNO|Ci si scrive a scuola
QUATTRO|Il numero dopo il tre
RAGIONE|Chi ha ... vince la discussione
RANOCCHIO|Rana
RASOIO|Taglia la barba
RICETTA|Dice come si cucina
RIFUGIO|Casetta in montagna
RISATA|Viene dopo una barzelletta
RITMO|Lo segue chi balla
ROTOLO|Di carta
SALVAGENTE|Fa galleggiare
SARDINA|Piccolo pesce in scatola
SCALINO|Gradino
SCARPONE|Scarpa da montagna
SCIATORE|Scende sulla neve
SCOPERTA|Cosa trovata per la prima volta
SECONDO|Viene dopo il primo
SEMPRE|Il contrario di mai
SENTINELLA|Fa la guardia
SETTE|I giorni della settimana
SIEPE|Cespugli in fila
SIGNORA|Donna gentile
SOLDI|Denaro
SPALLA|Unisce il braccio al corpo
SPAVENTO|Paura improvvisa
SPAZZOLA|Pettina i capelli
SPIGA|Del grano
SPINACI|Verdura di Braccio di Ferro
STAGNO|Piccolo lago
STRADINA|Piccola strada
SUSINA|Prugna
TACCHINO|Uccello del giorno del Ringraziamento
TAGLIO|Lo fa la forbice
TAVOLINO|Piccolo tavolo
TELEVISORE|Ci si guardano i cartoni
TEMPESTA|Grande temporale
TENDINA|Piccola tenda
TERRAZZO|Grande balcone
TOVAGLIA|Copre la tavola
TRAFFICO|Tante auto in coda
TRAMPOLINO|Ci si tuffa
TRATTORE|Lavora nei campi
TRIANGOLO|Ha tre lati
UCCELLO|Ha le piume e vola
UFFICIO|Ci si lavora alla scrivania
UNICORNO|Cavallo con un corno
VALLATA|Valle grande
VENERDI|Il giorno prima del sabato
VERDURA|Insalata, carote, zucchine
VIOLA|Fiore e colore
VOLANTE|Si gira guidando
ZAMPOGNA|Si suona a Natale
ZIA|Sorella della mamma
ACINO|Un chicco d'uva
ALTARE|Sta in chiesa
AMARE|Voler tanto bene
AMICA|Persona cara
ANELITO|Desiderio forte
ANIMALE|Cane, gatto o leone
ANTENNA|Prende il segnale della tv
APRIRE|Il contrario di chiudere
ARANCIO|Il colore della carota
ARIETE|Maschio della pecora
ARTISTA|Pittore o musicista
ASCIA|Taglia la legna
ASTRO|Stella
ATLETA|Fa sport
ATRIO|Ingresso del palazzo
BALIA|Tata
BARONE|Nobile
BATTERE|Colpire
BENDA|Copre la ferita
BIRRA|Bevanda con la schiuma
BOA|Serpente grande
BOE|Galleggiano nel mare
CALA|Piccola spiaggia
CALCE|Si usa per i muri
CANONE|Si paga ogni mese
CAPANNA|Casetta di legno e paglia
CARA|Amata
CARTE|Si giocano a briscola
CASTORO|Costruisce dighe
CAVA|Ci si prende la pietra
CENE|Pasti della sera
CESTA|Ci si mette il pane
CIGLIA|Stanno sopra gli occhi
CINE|Il cinema, in breve
COCCO|Noce delle palme
COLA|Bevanda frizzante scura
COLLE|Piccola collina
CONTE|Nobile
CORNA|Le ha la mucca
COTTO|Il contrario di crudo
DANZA|Ballo
DARE|Il contrario di prendere
DATA|Giorno, mese e anno
DIRE|Parlare
DITA|Ne abbiamo dieci
DIVO|Attore famoso
DOGANA|Si passa al confine
ECCO|Si dice porgendo qualcosa
EDEN|Paradiso terrestre
EMOZIONE|Sentimento forte
ERBE|Piante piccole dei prati
ERRORE|Sbaglio
ESCA|Si mette sull'amo
ESSERE|Verbo: io sono
ETERNO|Dura per sempre
FINO|Sottile
FIOCO|Debole, come una luce
FORO|Buco
FRATE|Vive nel convento
GARE|Competizioni
GELATAIO|Vende i gelati
GENERE|Tipo
GIRA|Ruota
GITA|Viaggetto di un giorno
GRATA|Inferriata
GUIDA|Accompagna i turisti
IDOLO|Persona molto ammirata
INCANTO|Magia
INVITO|Si manda per la festa
LEALE|Sincero e fedele
LIRA|Antico strumento a corde
LOGO|Simbolo di una ditta
MARINA|Spiaggia
MASSO|Pietra grossa
MATTO|Pazzo
MERLO|Uccello nero dal becco giallo
MINA|Della matita
MOLO|Ci attraccano le barche
MUSO|Faccia degli animali
NANA|Piccolissima
OCCHI|Servono per vedere
ORCO|Gigante cattivo delle fiabe
ORLO|Bordo
PALO|Bastone piantato a terra
PARI|Uguale
RARO|Che si trova poco
RATA|Pagamento a pezzi
RENNA|Tira la slitta di Babbo Natale
RIO|Ruscello
SANTA|Donna molto buona della Chiesa
SCIA|Lasciata dalla barca
SITO|Pagina internet
SOLO|Senza compagnia
SORTA|Specie
TASSO|Animale del bosco
UNICO|Solo uno
UNTO|Sporco d'olio
VENA|Ci scorre il sangue
ACETO|Si mette sull'insalata
ALLORO|Corona dei vincitori
AUTORE|Scrive i libri
BASTA|Si dice per fermare
BELVA|Animale feroce
CARAMELLA|Dolcetto incartato
ABETE|Albero di Natale
ACERBO|Non ancora maturo
ALIANTE|Aereo senza motore
ANICE|Seme profumato
ANTILOPE|Corre veloce nella savana
ARCIERE|Tira con l'arco
ASTUCCIO|Ci si tengono le matite
BALENIERA|Nave che cacciava le balene
CARIE|Buco nel dente
CERINO|Piccolo fiammifero
ENIGMA|Indovinello
EPOCA|Periodo della storia
ERETTO|Dritto in piedi
ESILE|Sottile
ETICA|Le regole del bene
IRIDE|Parte colorata dell'occhio
ISOLANO|Abita su un'isola
LATINO|Lingua degli antichi Romani
NOTARE|Accorgersi
OLIVETO|Campo di olivi
OPACO|Non lucido
ORATA|Pesce del mare
ORIGANO|Erba sulla pizza
OSARE|Avere coraggio
OTTONE|Metallo giallo delle trombe
PARETI|Muri della stanza
RETINA|Piccola rete
SERATA|La sera intera
SONATA|Musica per pianoforte
TARTINA|Pane piccolo con qualcosa sopra
TELONE|Grande telo
TENORE|Cantante con voce alta
TERRENO|Pezzo di terra
TONO|Della voce
TRITONE|Animale degli stagni
UNIONE|Fa la forza
URANO|Pianeta lontano
NEONATO|Bambino appena nato
ORATORE|Parla in pubblico
SALINA|Ci si fa il sale
SEGNALE|Avviso
TERRINA|Ciotola grande
ALATO|Con le ali
AMENO|Piacevole
ARIOSO|Pieno d'aria
EOLIE|Isole della Sicilia
OLIARE|Mettere l'olio
RIDOTTO|Fatto più piccolo
SANARE|Guarire
SOAVE|Dolce e delicato
TENACE|Non si arrende
ORNATO|Decorato
RONZIO|Lo fa la mosca
CIRCA|Più o meno
OTTIMO|Buonissimo`;

  const WORDS = [], CLUE = {};
  for (const line of DICT.split('\n')) {
    const [w, c] = line.split('|');
    if (!w || !c || CLUE[w]) continue;
    CLUE[w] = c.trim();
    WORDS.push(w);
  }

  /* plurali regolari (MELA → MELE, FIORE → FIORI): tante parole in più per riempire lo schema */
  const PLUR = {};
  const NOPLUR = new Set(`ALA ARMA UOMO UOVO DITO BRACCIO OSSO ZIO DIO MANO RE AUTO FOTO MOTO RADIO BICI CINEMA CAFFE CITTA NOVITA
    ROBOT SPORT TENNIS GAS BAR BLU SUD EST NORD OVEST UFO ZOO ACQUA ARIA LATTE MIELE SALE PEPE ORO FAME SETE PACE BUIO NIENTE
    OGGI DOMANI SEMPRE DOPO SOPRA SOTTO PRESTO TARDI TANTO CIRCA ECCO BASTA CIAO MAI NOI VOI LORO MIO TUO SUO ITALIA ROMA ETNA
    NATALE PASQUA EDEN URANO ESSERE FARE DARE DIRE SAPERE POTERE AMARE APRIRE RIDERE DORMIRE MANGIARE OSARE NOTARE OLIARE SANARE
    INVERNO ESTATE AUTUNNO PRIMAVERA DOMENICA VENERDI MARZO APRILE MAGGIO GIUGNO LUGLIO OTTOBRE NOVEMBRE GENNAIO RISO GRANO FIENO
    SANGUE CACAO PANNA BURRO OLIO ACETO FARINA ZUCCHERO GHIACCIO NEBBIA PIOGGIA NEVE GELO MORBIDO`.split(/\s+/));
  const MASC_A = new Set('PIGIAMA PIANETA PILOTA ASTRONAUTA PIRATA ATLETA ARTISTA POETA PAPA TEMA PROBLEMA CLIMA DRAMMA SCHEMA POEMA DIADEMA ENIGMA'.split(' '));
  for (const w of WORDS) {
    if (NOPLUR.has(w) || w.length < 3) continue;
    let p = '';
    if (/[CG]O$/.test(w) || /[CG]IA$/.test(w)) continue;
    else if (/IO$/.test(w)) p = w.slice(0, -1);
    else if (/O$/.test(w)) p = w.slice(0, -1) + 'I';
    else if (/E$/.test(w) && !/IE$/.test(w)) p = w.slice(0, -1) + 'I';
    else if (/[CG]A$/.test(w)) p = MASC_A.has(w) ? '' : w.slice(0, -1) + 'HE';
    else if (/A$/.test(w)) p = w.slice(0, -1) + (MASC_A.has(w) ? 'I' : 'E');
    if (!p || p.length < 3 || CLUE[p] || PLUR[p]) continue;
    const lw = w.toLowerCase();
    PLUR[p] = { clue: `Il plurale di «${lw}»`, how: `Quando di «${lw}» ce n'è più di uno, diciamo <b>${p}</b>.` };
  }

  /* parole di due lettere, come nelle riviste di enigmistica: piccole parole, note musicali e sigle delle province */
  const SHORT = {};
  const addShort = (s, clue, how) => (SHORT[s] = SHORT[s] || []).push({ clue, how });
  for (const l of `IL|Articolo maschile: ... gatto
LO|Articolo: ... zaino
LA|Articolo femminile: ... casa
UN|Articolo: ... cane
DI|Piccola parola: la casa ... Anna
DA|Piccola parola: vengo ... Roma
IN|Piccola parola: vado ... montagna
SU|Il contrario di giù
NO|Il contrario di sì
RE|Ha la corona in testa
DO|La prima nota musicale
MI|La nota dopo il re
FA|La nota dopo il mi
LA|La nota dopo il sol
SI|La nota dopo il la
TU|Si dice a un amico: ... sei qui
IO|Lo dice chi parla di sé
TE|Vengo con ...
ME|Parla con ...
CI|... vediamo domani
VI|... aspetto qui
MA|Piccolo ... forte
SE|... piove, prendo l'ombrello
ED|La «e» davanti a una vocale
AD|La «a» davanti a una vocale
OH|Si dice per la meraviglia
AH|Si dice per la sorpresa
TV|La televisione, in breve
OK|Va bene, in inglese`.split('\n')) { const [s, c] = l.split('|'); addShort(s, c); }
  for (const p of `AG Agrigento,AL Alessandria,AN Ancona,AO Aosta,AR Arezzo,AP Ascoli Piceno,AT Asti,AV Avellino,BA Bari,BL Belluno,BN Benevento,BG Bergamo,BI Biella,BO Bologna,BZ Bolzano,BS Brescia,BR Brindisi,CA Cagliari,CL Caltanissetta,CB Campobasso,CE Caserta,CT Catania,CZ Catanzaro,CH Chieti,CO Como,CS Cosenza,CR Cremona,KR Crotone,CN Cuneo,EN Enna,FE Ferrara,FI Firenze,FG Foggia,FR Frosinone,GE Genova,GO Gorizia,GR Grosseto,IM Imperia,IS Isernia,SP La Spezia,AQ L'Aquila,LT Latina,LE Lecce,LC Lecco,LI Livorno,LO Lodi,LU Lucca,MC Macerata,MN Mantova,MS Massa,MT Matera,ME Messina,MI Milano,MO Modena,NA Napoli,NO Novara,NU Nuoro,OR Oristano,PD Padova,PA Palermo,PR Parma,PV Pavia,PG Perugia,PE Pescara,PC Piacenza,PI Pisa,PT Pistoia,PN Pordenone,PZ Potenza,PO Prato,RG Ragusa,RA Ravenna,RC Reggio Calabria,RE Reggio Emilia,RI Rieti,RN Rimini,RM Roma,RO Rovigo,SA Salerno,SS Sassari,SV Savona,SI Siena,SR Siracusa,SO Sondrio,TA Taranto,TE Teramo,TR Terni,TO Torino,TP Trapani,TN Trento,TV Treviso,TS Trieste,UD Udine,VA Varese,VE Venezia,VB Verbania,VC Vercelli,VR Verona,VV Vibo Valentia,VI Vicenza,VT Viterbo`.split(',')) {
    const s = p.slice(0, 2), city = p.slice(3);
    addShort(s, `Sigla di ${city}`, `Ogni provincia ha una sigla di due lettere, come sulle vecchie targhe delle auto. ${city} è <b>${s}</b>.`);
  }

  /* pezzi di parola: «Le vocali di pisa», «L'inizio di casa»… con la spiegazione per il suggerimento */
  const FRAG = {};
  const lettersOf = s => s.split('').join(', ').replace(/, ([A-Z])$/, ' e $1');
  const addFrag = (s, clue, how) => { if (!SHORT[s] && !CLUE[s] && !PLUR[s]) (FRAG[s] = FRAG[s] || []).push({ clue, how }); };
  for (const w of WORDS) {
    if (w.length < 4 || w.length > 8) continue;
    const lw = w.toLowerCase();
    addFrag(w.slice(0, 2), `L'inizio di «${lw}»`, `«${lw}» comincia con <b>${w.slice(0, 2)}</b>.`);
    addFrag(w.slice(-2), `La fine di «${lw}»`, `«${lw}» finisce con <b>${w.slice(-2)}</b>.`);
    if (w.length >= 5) {
      addFrag(w.slice(0, 3), `L'inizio di «${lw}»`, `«${lw}» comincia con <b>${w.slice(0, 3)}</b>.`);
      addFrag(w.slice(-3), `La fine di «${lw}»`, `«${lw}» finisce con <b>${w.slice(-3)}</b>.`);
      /* il cuore della parola: senza la prima e l'ultima lettera */
      const mid = w.slice(1, -1);
      if (mid.length <= 4) addFrag(mid, `Il cuore di «${lw}»`, `Togliamo la prima e l'ultima lettera di «${lw}»: resta <b>${mid}</b>.`);
    }
    if (w.length >= 7) {
      addFrag(w.slice(0, 4), `L'inizio di «${lw}»`, `«${lw}» comincia con <b>${w.slice(0, 4)}</b>.`);
      addFrag(w.slice(-4), `La fine di «${lw}»`, `«${lw}» finisce con <b>${w.slice(-4)}</b>.`);
    }
    if (w.length === 4 || w.length === 6) {
      const a = w.slice(0, w.length / 2), b = w.slice(w.length / 2), how = `Tagliamo «${lw}» a metà: ${a} e ${b}.`;
      addFrag(a, `Metà di «${lw}»`, how);
      addFrag(b, `Metà di «${lw}»`, how);
    }
    const v = w.replace(/[^AEIOU]/g, ''), c = w.replace(/[AEIOU]/g, '');
    if (v.length === 2 || v.length === 3) addFrag(v, `Le vocali di «${lw}»`, `In «${lw}» le vocali sono ${lettersOf(v)}: insieme fanno <b>${v}</b>.`);
    if (c.length === 2 || c.length === 3) addFrag(c, `Le consonanti di «${lw}»`, `In «${lw}» le consonanti (le lettere che non sono vocali) sono ${lettersOf(c)}: insieme fanno <b>${c}</b>.`);
  }
  /* 1 = parola vera o di due lettere, 2 = pezzo di parola, 0 = lettera sola, -1 = non va */
  const kind = s => (s.length < 2 ? 0 : (s.length > 2 && (CLUE[s] || PLUR[s])) || SHORT[s] ? 1 : FRAG[s] ? 2 : -1);
  /* quanto è bella una fila: parola vera > parolina > sigla > pezzo di parola */
  const SIGLA = s => SHORT[s] && SHORT[s].every(o => o.how);
  /* tutte le file possibili, per lunghezza */
  const ALL = [];
  for (const s of [...WORDS.filter(w => w.length > 2), ...Object.keys(PLUR), ...Object.keys(SHORT), ...Object.keys(FRAG)]) (ALL[s.length] = ALL[s.length] || []).push(s);
  const worth = s => { const k = kind(s); return k === 1 ? (s.length > 2 ? (PLUR[s] ? 3.5 : 5) : SIGLA(s) ? 0.3 : 3) : k === 2 ? -1 : 0; };

  /* schema libero: si mettono parole vere, il più fitte possibile; poi si riempiono i buchi
     con lettere che formano parole corte, sigle o pezzi di parola; le caselle vuote diventano nere */
  function build(n) {
    const g = new Array(n * n).fill('');
    const at = (x, y) => (x < 0 || y < 0 || x >= n || y >= n ? '' : g[y * n + x]);
    const runAt = (x, y, d) => {
      const dx = d ? 0 : 1, dy = d ? 1 : 0;
      while (at(x - dx, y - dy)) { x -= dx; y -= dy; }
      let s = '';
      while (at(x, y)) { s += at(x, y); x += dx; y += dy; }
      return s;
    };
    const tryPlace = (w, x, y, d, keep) => {
      const dx = d ? 0 : 1, dy = d ? 1 : 0, L = w.length;
      if (x < 0 || y < 0 || x + dx * (L - 1) >= n || y + dy * (L - 1) >= n) return null;
      if (at(x - dx, y - dy) || at(x + dx * L, y + dy * L)) return null;
      for (let k = 0; k < L; k++) { const c = g[(y + dy * k) * n + x + dx * k]; if (c && c !== w[k]) return null; }
      const ch = [];
      for (let k = 0; k < L; k++) { const i = (y + dy * k) * n + x + dx * k; if (!g[i]) { g[i] = w[k]; ch.push(i); } }
      let r = null;
      if (ch.length && ch.length < L) {
        r = { ch, cross: L - ch.length, good: 0, frag: 0 };
        for (const i of ch) {
          const s = runAt(i % n, (i / n) | 0, 1 - d), k = kind(s);
          if (k < 0) { r = null; break; }
          if (k === 1 && s.length > 1 && !SIGLA(s)) r.good++;
          if (k === 2) r.frag++;
        }
      }
      if (!r || !keep) for (const i of ch) g[i] = '';
      return r;
    };
    const used = new Set(), PLACE = [...WORDS, ...Object.keys(PLUR)];
    const first = Z.pick(WORDS.filter(w => w.length >= Math.min(n, 10) - 2 && w.length <= Math.min(n, 11)));
    const fy = Z.ri(0, 1) ? 0 : Z.ri(0, n - 1), fx = Z.ri(0, n - first.length);
    for (let k = 0; k < first.length; k++) g[fy * n + fx + k] = first[k];
    used.add(first);
    for (let fails = 0; fails < 2;) {
      let best = null, bs = -1e9;
      for (const w of Z.shuffle(PLACE.filter(w => !used.has(w) && w.length <= n)).slice(0, 150))
        for (const d of [0, 1]) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
          const r = tryPlace(w, x, y, d, false);
          if (!r) continue;
          const sc = r.ch.length + r.cross * 2.5 + r.good * 2 - r.frag * 2.5 + Math.random() * 2;
          if (sc > bs) { bs = sc; best = { w, x, y, d }; }
        }
      if (!best) { fails++; continue; }
      tryPlace(best.w, best.x, best.y, best.d, true);
      used.add(best.w);
    }
    const LET = 'AEIOURNTLSCDMPGBVFZ';
    /* punteggio delle file che passano per le caselle appena scritte (null se una fila non va) */
    const score = cs => {
      let sc = 0;
      const seen = new Set();
      /* ogni lettera deve stare in almeno una parola */
      if (cs.some(i => runAt(i % n, (i / n) | 0, 0).length < 2 && runAt(i % n, (i / n) | 0, 1).length < 2)) return null;
      for (const i of cs) for (const d of [0, 1]) {
        const x = i % n, y = (i / n) | 0, s = runAt(x, y, d);
        let sx = x, sy = y;
        while (at(sx - (d ? 0 : 1), sy - (d ? 1 : 0))) { sx -= d ? 0 : 1; sy -= d ? 1 : 0; }
        const key = d + ':' + sx + ':' + sy;
        if (seen.has(key)) continue;
        seen.add(key);
        if (kind(s) < 0) return null;
        sc += worth(s);
      }
      return sc;
    };
    /* si riempiono i buchi: una casella alla volta, poi due vicine insieme */
    const fillHoles = pair => {
      for (const i of Z.shuffle(Z.range(n * n))) {
        if (g[i]) continue;
        const x = i % n, y = (i / n) | 0;
        const groups = pair ? [x + 1 < n && !g[i + 1] ? [i, i + 1] : null, y + 1 < n && !g[i + n] ? [i, i + n] : null].filter(Boolean) : [[i]];
        let best = null, bs = -2.5 * (pair ? 2 : 1);
        for (const cs of groups) for (const a of LET) for (const b of pair ? LET : ['']) {
          g[cs[0]] = a;
          if (pair) g[cs[1]] = b;
          const sc = score(cs);
          for (const j of cs) g[j] = '';
          if (sc !== null && sc + Math.random() > bs) { bs = sc + Math.random(); best = [cs, a, b]; }
        }
        if (best) { g[best[0][0]] = best[1]; if (pair) g[best[0][1]] = best[2]; }
      }
    };
    /* file di caselle vuote: si cerca una parola (o parolina, o pezzo) che le riempie attaccandosi alle lettere vicine */
    const fillGaps = () => {
      for (const d of Z.shuffle([0, 1])) for (let a = 0; a < n; a++) {
        const idx = b => (d ? b * n + a : a * n + b);
        for (let b = 0; b < n; b++) {
          if (g[idx(b)]) continue;
          let e = b;
          while (e + 1 < n && !g[idx(e + 1)]) e++;
          let L = '', R = '';
          for (let k = b - 1; k >= 0 && g[idx(k)]; k--) L = g[idx(k)] + L;
          for (let k = e + 1; k < n && g[idx(k)]; k++) R += g[idx(k)];
          const len = e - b + 1;
          let best = null, bs = -2;
          /* j caselle riempite: tutte (si attacca a destra e a sinistra), o solo alcune vicino a un lato */
          const tries = [[len, L, R]];
          for (let j = 1; j < len; j++) { if (L) tries.push([j, L, '']); if (R) tries.push([j, '', R]); }
          for (const [j, l, r] of tries) {
            const start = r ? e - j + 1 : b, cs = Z.range(j).map(k => idx(start + k));
            for (const s of ALL[l.length + j + r.length] || []) {
              if (!s.startsWith(l) || !s.endsWith(r)) continue;
              cs.forEach((i, k) => { g[i] = s[l.length + k]; });
              const sc = score(cs);
              cs.forEach(i => { g[i] = ''; });
              if (sc !== null && sc + Math.random() > bs) { bs = sc + Math.random(); best = [cs, s.slice(l.length, l.length + j)]; }
            }
          }
          if (best) best[0].forEach((i, k) => { g[i] = best[1][k]; });
          b = e;
        }
      }
    };
    for (let pass = 0; pass < 2; pass++) fillHoles(false);
    fillGaps();
    fillHoles(true);
    fillGaps();
    fillHoles(false);
    return g;
  }

  /* come nelle riviste: le caselle vuote vicino al bordo restano fuori (bordi frastagliati), le altre sono nere */
  function outsideOf(sol, W, H) {
    const out = new Set();
    for (let i = 0; i < W * H; i++) {
      const x = i % W, y = (i / W) | 0;
      if (sol[i] === '.' && Math.min(x, y, W - 1 - x, H - 1 - y) === 0) out.add(i);
    }
    for (let grow = 0; grow < 2; grow++) for (let i = 0; i < W * H; i++) {
      const x = i % W, y = (i / W) | 0;
      if (sol[i] === '.' && !out.has(i) && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < W && ny < H && out.has(ny * W + nx);
      })) out.add(i);
    }
    return out;
  }
  /* quante caselle nere ci sono in mezzo allo schema; quelle attaccate ad altre nere contano di più */
  function blackCost(sol, n) {
    const out = outsideOf(sol, n, n);
    let c = 0;
    for (let i = 0; i < n * n; i++) {
      if (sol[i] !== '.' || out.has(i)) continue;
      c++;
      if (i % n + 1 < n && sol[i + 1] === '.' && !out.has(i + 1)) c += 1.5;
      if (i + n < n * n && sol[i + n] === '.' && !out.has(i + n)) c += 1.5;
    }
    return c;
  }

  function layout(n) {
    let g = null, best = 1e9;
    for (let t = 0, T = n <= 9 ? 16 : n <= 11 ? 12 : n <= 13 ? 10 : 8; t < T; t++) {
      const h = build(n), cost = blackCost(h.map(c => c || '.'), n) + h.filter(c => !c).length * 0.05;
      if (cost < best) { best = cost; g = h; }
    }
    /* si tolgono righe e colonne vuote ai bordi */
    let x0 = n, y0 = n, x1 = 0, y1 = 0;
    g.forEach((c, i) => { if (c) { const x = i % n, y = (i / n) | 0; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } });
    const w = x1 - x0 + 1, h = y1 - y0 + 1;
    const sol = Z.range(w * h).map(i => g[(y0 + ((i / w) | 0)) * n + x0 + i % w] || '.').join('');
    /* ogni fila di due o più lettere è una parola, con la sua definizione */
    const words = [];
    for (const d of [0, 1]) for (let a = 0; a < (d ? w : h); a++) {
      const len = d ? h : w;
      let s = '', st = 0;
      for (let b = 0; b <= len; b++) {
        const i = b < len ? (d ? b * w + a : a * w + b) : -1, c = i >= 0 ? sol[i] : '.';
        if (c !== '.') { if (!s) st = i; s += c; continue; }
        if (s.length > 1) {
          const p = { word: s, x: st % w, y: (st / w) | 0, d };
          if (s.length > 2 && CLUE[s]) p.clue = CLUE[s];
          else { const o = Z.pick(SHORT[s] || (PLUR[s] && [PLUR[s]]) || FRAG[s]); p.clue = o.clue; if (o.how) p.how = o.how; }
          words.push(p);
        }
        s = '';
      }
    }
    /* numerazione: in ordine di lettura, un numero per ogni casella dove comincia una parola */
    const starts = [...new Set(words.map(p => p.y * w + p.x))].sort((a, b) => a - b);
    for (const p of words) p.num = starts.indexOf(p.y * w + p.x) + 1;
    words.sort((a, b) => a.d - b.d || a.num - b.num);
    return { w, h, sol, words };
  }
  Z.DICT = { WORDS, CLUE };

  const cellsOf = (P, p) => Z.range(p.word.length).map(k => (p.y + p.d * k) * P.w + p.x + (1 - p.d) * k);
  const label = p => `${p.num} ${p.d ? 'verticale' : 'orizzontale'}`;
  const dirName = p => (p.d ? 'verticale' : 'orizzontale');

  function generate(opt) {
    const P = layout(opt.size);
    const cells = Z.range(P.w * P.h).filter(i => P.sol[i] !== '.');
    const share = [0, 0.33, 0.12, 0][opt.giv] || 0;
    P.given = Z.shuffle(cells.slice()).slice(0, Math.round(cells.length * share)).sort((a, b) => a - b);
    return P;
  }

  /* Incastro: quante soluzioni ha lo schema con l'elenco delle parole (si ferma a 2) */
  function countFills(P, fixed, diff) {
    const slots = P.words.map(p => cellsOf(P, p));
    const g = new Array(P.w * P.h).fill('');
    for (const i of fixed) g[i] = P.sol[i];
    const pool = P.words.map(p => p.word);
    const used = new Array(pool.length).fill(false);
    const done = new Array(slots.length).fill(false);
    let found = 0, nodes = 0;
    const LIM = 40000;
    const fitsIn = (k, w) => w.length === slots[k].length && slots[k].every((i, j) => !g[i] || g[i] === w[j]);
    const rec = () => {
      if (found > 1 || ++nodes > LIM) return;
      let best = -1, bc = null;
      for (let k = 0; k < slots.length; k++) {
        if (done[k]) continue;
        const c = [];
        for (let j = 0; j < pool.length; j++) if (!used[j] && fitsIn(k, pool[j])) c.push(j);
        if (!c.length) return;
        if (!bc || c.length < bc.length) { best = k; bc = c; }
      }
      if (best < 0) {
        found++;
        /* una soluzione diversa da quella giusta: si ricordano le caselle che cambiano */
        if (diff && !diff.length) for (let i = 0; i < g.length; i++) if (g[i] && g[i] !== P.sol[i]) diff.push(i);
        return;
      }
      const tried = new Set();
      for (const j of bc) {
        if (tried.has(pool[j])) continue;
        tried.add(pool[j]);
        const prev = slots[best].map(i => g[i]);
        slots[best].forEach((i, t) => { g[i] = pool[j][t]; });
        used[j] = done[best] = true;
        rec();
        used[j] = done[best] = false;
        slots[best].forEach((i, t) => { g[i] = prev[t]; });
      }
    };
    rec();
    return nodes > LIM ? 2 : found;
  }

  function generateFit(opt) {
    for (;;) {
      const P = layout(opt.size);
      /* una parola è già scritta per cominciare; se ne aggiungono finché la soluzione è una sola */
      const first = Z.pick(P.words);
      const given = cellsOf(P, first);
      let ok = false;
      for (let t = 0; t < 12; t++) {
        const diff = [];
        if (countFills(P, given, diff) === 1) { ok = true; break; }
        /* si scrive una parola dove l'altra soluzione sbaglia (o una a caso, se la ricerca era troppo lunga) */
        const open = P.words.filter(q => !cellsOf(P, q).every(i => given.includes(i)));
        const hit = q => cellsOf(P, q).filter(i => diff.includes(i)).length;
        const p = diff.length ? open.sort((a, b) => hit(b) - hit(a))[0] : Z.pick(open);
        given.push(...cellsOf(P, p).filter(i => !given.includes(i)));
      }
      if (!ok) continue;
      P.given = given.sort((a, b) => a - b);
      return P;
    }
  }

  function hintFor(fit) {
    return function (P, st) {
      const s = Z.clone(st);
      const wrong = Z.range(P.w * P.h).filter(i => st.v[i] && st.v[i] !== P.sol[i]);
      const shape = q => cellsOf(P, q).map(i => (st.v[i] === P.sol[i] ? P.sol[i] : '_')).join(' ');
      let p, why, tag, tip;
      if (wrong.length) {
        p = P.words.find(q => cellsOf(P, q).includes(wrong[0]));
        tag = 'wrong';
        tip = fit ? `C’è una lettera da cambiare nello spazio ${dirName(p)} che si illumina. Le parole che lo incrociano sono giuste?`
          : `C’è una lettera da cambiare nella <b>${label(p)}</b>. Rileggi la domanda: «${p.clue}».`;
        why = fit ? `Nello spazio ${dirName(p)} che si illumina c’era una lettera sbagliata: lì va <b>${p.word}</b>. L’ho sistemata io! `
          : `In <b>${label(p)}</b> c’era una lettera sbagliata. «${p.clue}»: la risposta è <b>${p.word}</b>. L’ho sistemata io! `;
      } else {
        const open = P.words.filter(q => cellsOf(P, q).some(i => st.v[i] !== P.sol[i]));
        if (!open.length) return null;
        if (fit) {
          /* lo spazio in cui entra una sola delle parole ancora da mettere */
          const placed = new Set(P.words.filter(q => !open.includes(q)).map(q => q.word));
          const cand = q => [...new Set(P.words.map(r => r.word))].filter(w => w.length === q.word.length && !placed.has(w)
            && cellsOf(P, q).every((i, j) => !st.v[i] || st.v[i] === w[j]));
          let bestN = 1e9;
          for (const q of open) { const c = cand(q).length; if (c < bestN) { bestN = c; p = q; } }
          const k = cellsOf(P, p).filter(i => st.v[i]).length;
          tag = bestN === 1 ? 'only' : 'cross';
          tip = bestN === 1 ? Z.say(`Guarda lo spazio ${dirName(p)} che si illumina. Conta le caselle: quale parola dell’elenco è lunga così?`, `Lo spazio ${dirName(p)} che si illumina ha ${p.word.length} caselle. Quale parola rimasta ci sta, con le lettere già scritte?`)
            : `Nello spazio ${dirName(p)} che si illumina ci stanno più parole. Guarda le lettere già scritte per scegliere quella giusta.`;
          why = bestN === 1
            ? (k ? `Lo spazio ${dirName(p)} che si illumina è così: ${shape(p)}. Tra le parole rimaste, ci sta solo <b>${p.word}</b>! `
              : `<b>${p.word}</b> è l’unica parola rimasta lunga ${p.word.length} lettere: va nello spazio ${dirName(p)} che si illumina. `)
            : `Nello spazio ${dirName(p)} che si illumina ci stanno ${bestN} parole lunghe ${p.word.length} lettere. Con le lettere degli incroci, quella giusta è <b>${p.word}</b>. `;
        } else {
          /* la parola con più lettere già scritte grazie agli incroci è la più facile */
          const known = q => cellsOf(P, q).filter(i => st.v[i]).length / q.word.length;
          const top = Math.max(...open.map(known));
          p = Z.pick(open.filter(q => known(q) === top));
          const k = cellsOf(P, p).filter(i => st.v[i]).length;
          tag = k ? 'cross' : 'clue';
          tip = `Prova la <b>${label(p)}</b>: «${p.clue}». ` + (k ? `Hai già ${k === 1 ? 'una lettera' : k + ' lettere'} su ${p.word.length}: ti aiutano!` : `È lunga ${p.word.length} lettere.`)
            + (kind(p.word) === 2 ? ' Attenzione: qui non va una parola intera, ma un pezzetto di parola.' : '');
          why = `<b>${label(p)}</b>: «${p.clue}». ` + (p.how ? p.how + ' ' : '') + (k
            ? `Avevi già ${k === 1 ? 'una lettera' : k + ' lettere'} su ${p.word.length}: con quelle è più facile. È <b>${p.word}</b>! `
            : `La risposta è <b>${p.word}</b>. `);
        }
      }
      for (const i of cellsOf(P, p)) s.v[i] = P.sol[i];
      why += 'Ora le parole che la incrociano hanno una lettera in più per aiutarti.';
      return { state: s, focus: cellsOf(P, p), area: cellsOf(P, p), why, tag, tip };
    };
  }

  function check(P) {
    if (!P || P.words.length < 6) return 'troppo poche parole';
    for (const p of P.words) {
      if (kind(p.word) < 1 || !p.clue) return 'parola non valida: ' + p.word;
      if (cellsOf(P, p).map(i => P.sol[i]).join('') !== p.word) return 'schema incoerente: ' + p.word;
    }
    /* ogni sequenza di 2+ lettere in fila deve essere una parola dello schema */
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
  }

  function view(fit) {
    return function (ctx) {
      const P = ctx.puzzle, W = P.w, H = P.h;
      const isGiven = new Set(P.given);
      let cur = null, sel = -1, dir = 0;
      const el = Z.h('div.cw');
      el.style.setProperty('--w', W);
      el.style.setProperty('--h', H);
      const grid = Z.h('div.cw-grid');
      const nums = {};
      for (const p of P.words) nums[p.y * W + p.x] = p.num;
      const out = outsideOf(P.sol, W, H);
      const cells = [], lets = [];
      for (let i = 0; i < W * H; i++) {
        if (P.sol[i] === '.') { const b = Z.h('span.cw-c.' + (out.has(i) ? 'blank' : 'blk')); grid.append(b); cells.push(b); lets.push(null); continue; }
        const l = Z.h('span.cw-l');
        const c = Z.h('span.cw-c', null, nums[i] && !fit ? Z.h('span.cw-n', { text: nums[i] }) : null, l);
        if (isGiven.has(i)) c.classList.add('given');
        c.addEventListener('pointerdown', e => {
          e.preventDefault();
          if (sel === i) { if (slot(i, 1 - dir)) dir = 1 - dir; } else { sel = i; if (!slot(i, dir)) dir = 1 - dir; }
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
      /* incastro: parole già scritte nello schema, lette così come sono */
      const written = () => new Set(P.words.map(p => cellsOf(P, p).map(i => cur.v[i] || '_').join('')));

      const clueTx = Z.h('button.cw-clue-tx', { type: 'button', on: { click: showAll } });
      const bar = Z.h('div.cw-bar', null,
        Z.h('button.key.cw-arrow', { type: 'button', 'aria-label': 'Parola precedente', html: Z.ICONS.back, on: { click: () => step(-1) } }),
        clueTx,
        Z.h('button.key.cw-arrow.next', { type: 'button', 'aria-label': 'Parola successiva', html: Z.ICONS.back, on: { click: () => step(1) } }));
      ctx.controls.append(Z.h('div.cw-ctl', null, bar, Z.letterPad(type, back)));

      function showAll() {
        let body;
        if (fit) {
          const wr = written(), lens = [...new Set(P.words.map(p => p.word.length))].sort((a, b) => a - b);
          body = lens.map(L => [Z.h('h3.cw-h', { text: `${L} lettere` }), Z.h('p.cw-words', null,
            ...P.words.filter(p => p.word.length === L).map(p => p.word).sort().map(w => Z.h('span' + (wr.has(w) ? '.done' : ''), { text: w })))]).flat();
        } else {
          /* come nelle riviste: «ORIZZONTALI: 1. … - 4. …» tutto di seguito; si tocca una definizione per andarci */
          const sec = d => Z.h('p.cw-par', null, Z.h('b.cw-dir', { text: d ? 'VERTICALI: ' : 'ORIZZONTALI: ' }),
            ...P.words.filter(p => p.d === d).flatMap((p, k) => [k ? ' - ' : '', Z.h('span.cw-item' + (cur && cellsOf(P, p).every(i => cur.v[i]) ? '.done' : ''), {
              role: 'button', tabindex: 0, on: { click: () => { Z.ui.closeOverlay(); selectWord(p); } },
            }, Z.h('b', { text: p.num + '. ' }), p.clue)]));
          body = [sec(0), sec(1)];
        }
        Z.ui.openSheet([Z.h('div.cw-all', null, ...body),
          Z.h('div.sheet-actions', null, Z.h('button.btn', { type: 'button', text: 'Chiudi', on: { click: Z.ui.closeOverlay } }))]);
      }
      function type(L) {
        if (!cur) return;
        if (sel < 0) selectWord(P.words[0]);
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
        if (sel >= 0) ctx.mark(cells[sel], true);
        if (!p) { clueTx.textContent = fit ? 'Tocca una casella e scrivi una parola dell\'elenco' : 'Tocca una casella per vedere la definizione'; return; }
        if (fit) {
          const wr = written(), L = p.word.length;
          const left = P.words.filter(q => q.word.length === L).map(q => q.word).filter(w => !wr.has(w)).sort();
          clueTx.innerHTML = `<b>${L} lettere</b> · ${left.length ? left.join(', ') : 'tutte scritte'}`;
        } else clueTx.innerHTML = `<b>${label(p)}</b> · ${p.clue} <span>(${p.word.length})</span>`;
      }

      return {
        el, aspect: W / H, letters: true,
        render(s) { cur = s; paint(); },
        /* modalità «Frecce»: le frecce spostano la casella, «Gira» passa da orizzontale a verticale */
        cursor() {
          const pad = Z.arrowPad({
            compact: true,
            onDir: d => { const [dx, dy] = Z.DIRS[d]; move(dx, dy); },
            keys: [{ label: 'Gira', icon: Z.ICONS.swap, act: () => { if (sel >= 0 && slot(sel, 1 - dir)) { dir = 1 - dir; paint(); } } }],
          });
          return { el: pad.el };
        },
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
    };
  }

  const init = P => {
    const v = new Array(P.w * P.h).fill('');
    for (const i of P.given) v[i] = P.sol[i];
    return { v };
  };
  const solved = (P, s) => Z.range(P.w * P.h).every(i => P.sol[i] === '.' || s.v[i] === P.sol[i]);

  Z.register({
    options: OPTIONS,
    id: 'crossword',
    name: 'Cruciverba',
    hue: 300,
    tagline: 'Parole crociate a schema libero, con le definizioni.',
    rules: Z.rules({
      goal: `Scrivi nello schema tutte le <b>parole</b> che rispondono alle <b>definizioni</b>.`,
      rules: [
        `Ogni fila di caselle bianche è una parola. Le parole <b>orizzontali</b> si leggono da sinistra a destra, le <b>verticali</b> dall'alto in basso.`,
        `Le caselle colorate separano le parole.`,
        `Come nelle riviste di enigmistica, ci sono anche <b>parole di due lettere</b>, <b>sigle delle province</b> («Sigla di Roma» è RM) e <b>pezzetti di parola</b>: «Le vocali di «pisa»» è IA, «L'inizio di «casa»» è CA, «Metà di «dado»» è DA.`,
        `Le parole si incrociano: una casella può far parte di una parola orizzontale e di una verticale, e la lettera è la stessa per tutte e due.`,
        `Si scrive solo con lettere senza accenti (PERCHÉ diventa PERCHE).`,
      ],
      play: [
        `Tocca una casella e scrivi con la tastiera. Tocca di nuovo la stessa casella per passare dall'orizzontale al verticale.`,
        `Sopra la tastiera vedi la definizione della parola scelta; con le frecce passi alla parola successiva. Tocca la definizione per vedere l'elenco completo.`,
      ],
      start: `Scorri l'elenco e comincia dalle definizioni che sai subito, anche se sono poche. Ogni lettera scritta aiuta le parole che la incrociano.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><rect x="10" y="22" width="14" height="14" rx="3" class="ic-s ic-st"/><rect x="24" y="22" width="14" height="14" rx="3" class="ic-a"/><rect x="38" y="22" width="14" height="14" rx="3" class="ic-s ic-st"/><rect x="24" y="8" width="14" height="14" rx="3" class="ic-s ic-st"/><rect x="24" y="36" width="14" height="14" rx="3" class="ic-s ic-st"/><text x="31" y="33" class="ic-t ic-w">A</text></svg>`,
    generate,
    _check: check,
    _test: { WORDS, CLUE },
    init, solved,
    hint: hintFor(false),
    view: view(false),
  });

  Z.register({
    options: [OPTIONS[0]],
    id: 'incastro',
    name: 'Incastro',
    hue: 165,
    tagline: 'Ogni parola al suo posto nello schema.',
    rules: Z.rules({
      goal: `<b>Incastra</b> nello schema tutte le parole dell'elenco. Non ci sono definizioni: le parole le conosci già.`,
      rules: [
        `Ogni fila di caselle bianche (in orizzontale o in verticale) ospita <b>una parola</b> dell'elenco, della stessa lunghezza.`,
        `Ogni parola si usa <b>una volta sola</b>. Nell'elenco ci sono anche le parole di due lettere.`,
        `Le caselle colorate separano le parole.`,
        `Dove due parole si incrociano, la lettera deve andare bene per tutte e due.`,
      ],
      play: [
        `Tocca una casella e scrivi con la tastiera. Tocca di nuovo la stessa casella per passare dall'orizzontale al verticale.`,
        `Sopra la tastiera vedi le parole ancora libere della lunghezza giusta; toccale per vedere l'elenco completo.`,
        `Qualche parola è già scritta per cominciare.`,
      ],
      start: `Comincia dalle lunghezze con <b>una sola parola</b>: c'è un solo posto dove metterla. Poi guarda le lettere già scritte: dicono quale parola va in una fila.`,
    }),
    icon: `<svg viewBox="0 0 64 64"><rect x="8" y="10" width="14" height="14" rx="3" class="ic-a"/><rect x="22" y="10" width="14" height="14" rx="3" class="ic-a"/><rect x="36" y="10" width="14" height="14" rx="3" class="ic-a"/><rect x="36" y="24" width="14" height="14" rx="3" class="ic-s ic-st"/><rect x="36" y="38" width="14" height="14" rx="3" class="ic-s ic-st"/><path d="M14 40h12M20 34v12" class="ic-l2"/></svg>`,
    generate: generateFit,
    _check(P) { return check(P) || (countFills(P, P.given) === 1 ? '' : 'NON unico'); },
    init, solved,
    hint: hintFor(true),
    view: view(true),
  });
})();
