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
Il successivo controllo live ha rilevato l'etichetta corta «Email» spezzata
internamente con indirizzi lunghi: corretta la contrazione della label,
mantenendo il valore completo e a capo entro i margini; regressione geometrica
sul testo con identità da 23 e 80 caratteri in entrambe le viewport.
Un ulteriore controllo live ha rilevato lo stato vuoto della preparazione
durante il caricamento del profilo: ora la dashboard attende il risultato,
mostra l'errore in modo distinto e «Riprova» rilegge anche il profilo.
Regressione con risposta ritardata, errore 503 e recupero, desktop/mobile.

## Riprodurre

1. Preparare il venv backend con le dipendenze applicative e installare le
   dipendenze frontend. Non usare dati reali nella fixture dedicata.
2. Nel frontend: `npm run test:ux:capture`. Richiede Chrome. Il runner esegue
   `backend/scripts/seed_ux_review.py`, che accetta esclusivamente il DB
   `.local/skills-preview.sqlite3`, disabilita le integrazioni prima degli
   import e crea gli account sintetici dedicati con fixture `socra-local-ux-v3-multi-goals`,
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

Il gate richiede 2/2 per ciascuno dei 15 criteri su desktop e mobile, assenza di
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
| private-context | Esperienza centrata sulle capacità; finalità e riservatezza sempre visibili nel contesto; Salta disponibile, Salva e continua grigio con zero risposte effettive e attivo da una risposta; salvataggio separato nelle impostazioni; nome pubblico/email lunghi leggibili senza tagli o margini persi? |
| experience-save | Risposte precompilate, modifica persistita senza casella ridondante e ritorno diretto alla dashboard; pausa e risposte del contesto già salvate conservate senza chiedere di ricompilarle? |
| goal-hierarchy | Tema, obiettivi e modalità distinguibili velocemente, anche su mobile? |
| matching-score | Percentuale di compatibilità reale visibile, distinta da copertura e disponibilità, nel risultato finale caricato? |
| partial-agreement | Attività incluse/escluse comprensibili e stessa selezione nella richiesta salvata? |
| mentor-paths | “Vedi i percorsi” apre davvero i propri percorsi anche in pausa, senza riattivare la disponibilità, con contenuto finale caricato? |
| preparation | Barre per singolo tema con numeratore/denominatore, capacità conosciute distinte dalle offerte e dalle conferme? |
| mentor-removal | Rimuovere l'ultima offerta nelle impostazioni o nell'esperienza spiega la disattivazione, permette di annullare senza scritture e lascia accessibili i percorsi già aperti? |
| path-lifecycle | Su desktop e mobile, un percorso V4 aperto senza prima call si può chiudere da entrambi i lati e concludere con feedback bilaterale? Le schermate spiegano che addebito e accredito avvengono solo dopo entrambi i feedback, in coerenza con gli snapshot di wallet e transazioni nei JSON? |
| report-management | Dopo il completamento, l'apprendista riesce a segnalare il percorso e l'admin trova la propria segnalazione, legge il testo reale e può archiviarla con una motivazione? La coda e il dettaglio API concordano dopo la decisione? |

Fixture discriminanti: il learner ha un percorso attivo come mentor ma è in
pausa; il mentor ha 4/6 capacità ETF conosciute, solo 2 offerte e 2/6 Azioni
conosciute con una offerta; la richiesta desiderata contiene 3 attività, ne
copre 2, e lo score API è diverso da 67%. Il runner modifica una capacità,
salva/rilegge il contesto, invia una richiesta con una sola attività e poi la
annulla modificando il tema interessato, conservando lo storico e gli account separati per viewport. Queste azioni restano nello
storico dei soli account sintetici; non cancellano dati.

Il runner crea inoltre una coppia sintetica nuova per viewport, apre un percorso
V4 con costo e compenso fotografati nella richiesta e registra i wallet prima e
dopo l'apertura. Il browser entra con i moduli reali, chiude ciascun lato e
invia i feedback. Gli artefatti `path-lifecycle-open`, `path-lifecycle-waiting`
e `path-lifecycle-completed` includono schermate e snapshot JSON di wallet e
transazioni: nessun movimento all'apertura o dopo il primo feedback, addebito
e accredito soltanto al completamento. `public-entry` documenta l'accesso
visibile e `agreement-disabled` lo stato della richiesta ancora incompleta.
La stessa coppia apre una segnalazione con un marcatore unico per esecuzione;
un admin sintetico separato per viewport entra dal form reale, esamina il testo
e archivia senza violazione. `admin-report` e `admin-report-resolved` conservano
schermate, identificativi della propria segnalazione e stato API nel manifest.
Una persona aggiuntiva per viewport completa la survey legacy tramite il
servizio normale, senza creare il profilo esperienza V4: `profile-locked-dashboard`
e `profile-locked-settings` mostrano il pulsante del contesto visibile e
disabilitato, insieme al link che porta prima all'esperienza.
`profile-partial-saved` mostra inoltre il banner 4/5 dopo il salvataggio e la
rilettura API, prima della quinta risposta nelle impostazioni.

Follow-up navigazione 22/10: verificare anche il clic reale su «Completa il
profilo» dalla dashboard, con caricamento ritardato delle impostazioni, e il
secondo clic nelle impostazioni con lo stesso hash già presente. Il titolo
«Contesto personale» deve essere nella viewport e ricevere il focus; una
sezione aperta più in basso nel documento non basta. Le regressioni sono in
`tests/e2e/profile-completion-v4.spec.ts`. La review precedente dei 35 scenari
non copriva questa condizione di scorrimento.

## Limiti

La review live del 04/10 ha rilevato l'illustrazione decorativa sovrapposta ai numeri della preparazione nella card compatta mobile. Su questa viewport l'illustrazione viene omessa, mantenendo barra, percentuale e frazione leggibili. Verificare la sintesi nella dashboard finale, prima e dopo il salvataggio dell'esperienza; non dedurre la leggibilità dai soli valori delle API.

Il manifest registra versioni dei sorgenti, errori, azioni e artefatti, senza
token o password. Sono dati sintetici ma gli artefatti restano locali. Il
flusso di accesso usa il form reale e i cookie BFF, senza token iniettati. Le viewport
coprono i due layout principali, non tutti i dispositivi. SQLite locale non
sostituisce il collaudo PostgreSQL né una prova dei provider esterni.

## Variazione del 05/10: più temi e profilo

Ora 22 scenari e 14 criteri per viewport. Fixture con due apprendisti distinti per desktop/mobile, un mentor con ETF e Azioni e dodici mentor aggiuntivi. Il seed ripristina soltanto questi account sintetici nel DB preview guardato, con history e transazione; nessun DB condiviso.

| ID | Domanda da verificare |
|---|---|
| multi-goals | Tutti i temi selezionati sono visibili e modificabili separatamente, mantenendo 1–3 attività e modalità proprie? |
| matching-pagination | «Mostra altri» raggiunge più di dieci persone senza duplicati e preserva tutti i temi di ogni scheda? |
| profile-completion | Contesto facoltativo saltabile senza scritture; risposta parziale persistita, conteggio delle sole risposte effettive, banner ancora presente a quattro e scomparsa dopo cinque; pulsante contesto visibile ma disabilitato finché l’esperienza manca? |
| offer-help | «Posso aiutare» spiegato con clic/tocco/tastiera senza cambiare capacità, offerte o disponibilità? |
| goal-cancellation | La modifica avvisa prima di annullare la proposta e lo stato terminale è comprensibile senza aprire percorsi? |

## Revisione survey e verifica email del 06/10

Storico precedente alla revisione del 22/10: 25 scenari e 15 criteri per viewport. Il passo contesto aveva un solo «Continua»,
visibile dopo cinque scelte valide e capace di salvare prima della destinazione;
ogni domanda conserva PNR. Capture a zero, quattro e cinque risposte e aiuto
«Perché ci serve questa informazione?» aperto con tastiera/tocco. La modifica
dell’esperienza mantiene il contesto prima che la persona lo salvi esplicitamente;
le impostazioni conservano la loro azione separata. Nessun «Salta per ora».

## Revisione del contesto personale del 22/10

La cattura corrente comprende 35 scenari e 17 criteri per viewport, inclusi
il ciclo del percorso, le segnalazioni admin e gli stati del contesto. Dopo
la conferma dell’esperienza la dashboard compare direttamente e conserva il
contesto precedente. Il contesto facoltativo si apre separatamente: a zero
risposte mostra Salta e Salva e continua disabilitato, a una risposta effettiva
abilita il salvataggio, a quattro lo consente ancora. La cattura esegue Salta
senza scrivere dati, poi salva quattro risposte tramite API reale e aggiunge la
quinta dalle impostazioni. Il banner resta fino a cinque risposte effettive;
«Preferisco non rispondere» non è più tra le scelte del modulo V4. Il testo di
finalità e riservatezza è visibile senza aprire un aiuto. La survey storica V3
conserva la propria opzione PNR e non è oggetto di questa cattura.

| ID | Domanda da verificare |
|---|---|
| email-return | Dopo conferma email reale riuscita, il link all’account apre le impostazioni preservando il contesto; nessun ritorno proposto alla survey già compilata? |

Il seed prepara due link monouso validi soltanto per i learner della fixture
locale guardata, con invii disattivati. I link sono nel file privato della fixture,
non nelle immagini, nelle tracce né nei log. La capture usa l’endpoint reale di
conferma e rilegge `email_verified`; non certifica la consegna del provider.
