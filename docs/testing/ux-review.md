# Review dei flussi e di ciò che vede l'utente

Questa suite affianca pytest ed E2E. Il browser usa API vere sul preview locale,
poi un LLM indipendente valuta schermate, gerarchie e conseguenze delle azioni.
Una cattura riuscita lascia sempre la review **pending**. Nessun mock, provider
email/call, deploy, chiave LLM o chiamata a un nuovo servizio esterno eseguiti
dal runner di cattura.

La V4 è pubblicata su autorizzazione del 03/10: backend e frontend corretto
verificati. Il clipping mobile emerso nella prima review live è stato corretto
e ricollaudato. Questa suite verifica la build indicata nel manifest e non
esegue la pubblicazione. Stato, revisioni ed evidenze sono nel
[rapporto backend del 03/10](https://github.com/reealpeppe/Socra-BE/blob/release/v3-20260919/docs/releases/2026-10-03-skills-production.md).
La prima review locale con fixture v1 era passata ma non copriva username
allungati; non attesta la correzione successiva. La cattura con fixture v2
`2026-10-03T06-46-59-839Z` su FE `996fb361` ha ottenuto 16/16 criteri a 2/2
e gate superato. La successiva review sul dominio pubblico ha esaminato
14 schermate desktop/mobile senza nuovi difetti bloccanti; copertura e limiti
restano distinti nel rapporto, senza attestare l'intera applicazione.

Il 04/10 GR ha approvato la disattivazione automatica del mentor quando vengono
rimosse tutte le attività offerte, con conferma nelle impostazioni e nella
modifica dell'esperienza. La suite comprende ora 14 scenari e 9 criteri per
viewport, verificando anche annullamento senza scritture e conservazione dei
percorsi aperti. Il primo controllo ha individuato un banner di attivazione
rimasto visibile dopo la pausa: corretto, con regressione desktop/mobile e
nuova cattura. Esito finale e pubblicazione nel
[rapporto backend del 04/10](https://github.com/reealpeppe/Socra-BE/blob/release/v3-20260919/docs/releases/2026-10-04-mentor-availability.md).

## Riprodurre

1. Preparare il venv backend con le dipendenze applicative e installare le
   dipendenze frontend. Non usare dati reali nella fixture dedicata.
2. Nel frontend: `npm run test:ux:capture`. Richiede Chrome. Il runner esegue
   `backend/scripts/seed_ux_review.py`, che accetta esclusivamente il DB
   `.local/skills-preview.sqlite3`, disabilita le integrazioni prima degli
   import e crea tre account sintetici con fixture `socra-local-ux-v2-long-names`,
   username `ux.review.{learner,mentor,peer}.long.username` e email lunghe.
   Conserva le demo e la precedente fixture v1.
3. Il runner crea una build fresca in `.next-ux` e avvia entrambi i server su
   loopback (3141 frontend, 8141 backend), poi li arresta. Non riusa server già
   avviati: un listener esistente blocca la prova. Il manifest lega immagini,
   build ID e sorgenti; una build vecchia non può essere attribuita a codice
   nuovo. Opzioni: `UX_FRONTEND_PORT`, `UX_BACKEND_PORT`, `UX_PYTHON` per un runtime
   Python con le dipendenze del backend, `UX_BACKEND_DIR` per
   checkout separato. Gli ID autenticati devono coincidere con il seed prima
   delle scritture. Non cambiare sorgenti durante build/cattura. Il preview
   aperto dall'utente resta disponibile sulla sua porta.
   Le origini CSRF e l'origine applicativa sono configurate sul loopback del solo
   processo di prova; i controlli di sicurezza del BFF rimangono attivi.
4. Aprire la directory indicata in `output/playwright/ux-review/<run>`.
   Passare al reviewer indipendente questo documento, `manifest.json`, immagini
   e JSON delle azioni. Usare Codex/subagent LLM con lettura immagini; non
   assegnare il giudizio all'agente che ha scritto la UI.
5. Il reviewer compila `review.json`, indicando nome/modello, giudizio per ogni
   criterio e viewport, motivazione concreta ed evidenze. Correggere gli esiti
   insufficienti, poi ripetere cattura e review. Eseguire infine
   `npm run test:ux:verify -- output/playwright/ux-review/<run>`.

Il gate richiede 2/2 per ciascuno dei 9 criteri su desktop e mobile, assenza di
problemi bloccanti, cattura tecnica riuscita, impronta dei sorgenti corrente e
hash delle evidenze invariati. **Non certifica la sincerità o la qualità del
reviewer:** serve una vera lettura delle immagini, non una compilazione dei
campi per farlo passare. `npm run test:ux:gate` verifica il rifiuto di evidenze
mancanti, cambiate, review incompleta o sorgenti successivamente modificati.

Non è un job CI con un provider LLM esterno: cattura e gate sono script,
la fase semantica viene eseguita da Codex e registrata esplicitamente. Prima
di consegnare una variazione UX, ripetere questa fase anche se pytest passa.
La CI esegue tutti gli E2E desktop/mobile e i test del gate UX; non assegna
automaticamente un giudizio semantico alle schermate.

## Istruzioni per il reviewer LLM

Apri le immagini originali (desktop 1440×1000, mobile 390×844), anche a ritagli
quando una pagina è lunga. Leggi il testo e il risultato delle azioni nei JSON.
I file `*-viewport.png` mostrano la finestra nell'effettiva posizione di scroll;
gli altri PNG mostrano la pagina intera. Gli elementi fixed, come la barra
mobile, appaiono dentro la pagina intera: controlla il viewport prima di
interpretarli come una sovrapposizione persistente al contenuto.
Non leggere l'implementazione prima della valutazione. Per ciascun criterio
chiediti cosa capirebbe o farebbe una persona; non cercare soltanto parole.
Controlla saluto, nomi pubblici e indirizzi email lunghi: nessuna parte deve
essere tagliata o perdere i margini su mobile. Il solo `document.scrollWidth`
non rileva contenuto nascosto da `overflow:hidden`; confronta immagini,
rettangoli degli elementi e righe di testo con viewport e antenati che tagliano.
Le schermate di percorsi e matching devono mostrare i dati finali, oppure lo
stato vuoto finale: uno skeleton o un caricamento non dimostra il risultato.
Una schermata non dimostra che un pulsante porti nel posto giusto: per questo
sono incluse le destinazioni osservate e le letture successive delle API.

Punteggi: **0** errato/bloccante; **1** comprensibile con esitazione; **2** chiaro
e coerente. Ogni giudizio deve citare file presenti nel manifest e spiegare il
motivo. Se l'evidenza manca, non attribuire 2. Registrare i difetti con gravità
`blocking` o `minor`. Non promuovere una review per rispettare la consegna.

| ID | Domanda da verificare |
|---|---|
| objectives | Dashboard: numero/contenuto degli obiettivi comprensibili, abbreviazioni spiegate, sezioni inferiori compatte e saluto/username lungo interamente leggibile senza tagli o margini persi su mobile? |
| private-context | Esperienza centrata sulle capacità; contesto privato facoltativo nelle impostazioni e salvabile separatamente; nome pubblico/email lunghi leggibili senza tagli o margini persi? |
| experience-save | Risposte precompilate, modifica persistita, conferma e ritorno dashboard; pausa e contesto conservati? |
| goal-hierarchy | Tema, obiettivi e modalità distinguibili velocemente, anche su mobile? |
| matching-score | Percentuale di compatibilità reale visibile, distinta da copertura e disponibilità, nel risultato finale caricato? |
| partial-agreement | Attività incluse/escluse comprensibili e stessa selezione nella richiesta salvata? |
| mentor-paths | “Vedi i percorsi” apre davvero i propri percorsi anche in pausa, senza riattivare la disponibilità, con contenuto finale caricato? |
| preparation | Barre per singolo tema con numeratore/denominatore, capacità conosciute distinte dalle offerte e dalle conferme? |
| mentor-removal | Rimuovere l'ultima offerta nelle impostazioni o nell'esperienza spiega la disattivazione, permette di annullare senza scritture e lascia accessibili i percorsi già aperti? |

Fixture discriminanti: il learner ha un percorso attivo come mentor ma è in
pausa; il mentor ha 4/6 capacità ETF conosciute, solo 2 offerte e 2/6 Azioni
conosciute senza offerte; la richiesta desiderata contiene 3 attività, ne
copre 2, e lo score API è diverso da 67%. Il runner modifica una capacità,
salva/rilegge il contesto, invia una richiesta con una sola attività e poi la
chiude dal destinatario per consentire repliche. Queste azioni restano nello
storico dei soli account sintetici; non cancellano dati.

## Limiti

Il manifest registra versioni dei sorgenti, errori, azioni e artefatti, senza
token o password. Sono dati sintetici ma gli artefatti restano locali. Il
flusso di accesso usa il form reale e i cookie BFF, senza token iniettati. Le viewport
coprono i due layout principali, non tutti i dispositivi. SQLite locale non
sostituisce il collaudo PostgreSQL né una prova dei provider esterni.
