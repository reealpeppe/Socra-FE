# Consegna grafica Socra — grafite e miele

Data: 10/10/2026. Branch locale `design/grafite-miele`.

## Candidato di rilascio 11/10/2026

Il responsabile prodotto ha approvato la grafica e chiesto «metti online». Il candidato `release/grafite-miele-graphics-only-20261011` parte dalla release frontend corrente `5933b7bfa3ab068ff80c6b7457ab45a38ffb276c`, verificata anche nel deployment Railway attivo. Sono portati soltanto i tre commit grafici `8407fa6`, `2a3d6f5` e `adc24a2`; lo snapshot feature `455b5a2` non è integrato. Restano presenti multitema, verifica email, caricamento/errore del profilo, monitoring, CSP dinamica e tutte le correzioni successive al mockup. Il controllo AST usa ora questa base produzione; confronta anche package e lockfile per delimitare la sola patch Next necessaria al gate di rilascio.

Il primo checkout `output/frontend-release-grafite-miele` ha ricevuto modifiche parallele ai crediti durante le verifiche. Queste restano intatte in quel checkout e sono escluse dal candidato nuovo `output/frontend-graphics-only-20261011`, creato dai tre commit grafici portati e con sole correzioni documentate di presentazione e dipendenze. Le verifiche e le catture finali vengono ripetute sul nuovo checkout; il vecchio non va pubblicato come slice grafica.

Il primo audit reale ha bloccato su Next 16.3.6, ora sostituito dalla patch 16.3.8. Cambiano soltanto Next, `@next/env` e gli otto pacchetti SWC; gli altri record del lockfile, incluse dipendenze opzionali WASM, sono conservati. La catena dev ESLint rimane identica e l’eccezione del 10/10 risulta scaduta: la proroga al 18/10 è proposta al responsabile prodotto, non ancora applicata. Il rilascio resta sospeso finché questo punto non è risolto. Il primo giro sulla grafica integrata prima della patch: 328 E2E desktop/mobile, 112 controlli sicurezza e 8 test del gate UX passati; build riuscita, lint con i due warning MonitoringMfa preesistenti. Le prove della versione precedente non attestano automaticamente il candidato con la patch.

Verifiche ripetute con Next 16.3.8 installato dal lockfile: build e TypeScript passati, 112 test sicurezza, 8 test del gate UX e 328 E2E desktop/mobile passati; lint senza errori con i due warning MonitoringMfa già presenti. Audit runtime reale: zero vulnerabilità; audit completo ancora bloccato esclusivamente dalla scadenza dell’eccezione dev. Nessuna proroga applicata. Ripristinate anche le regole CSS di produzione dei riepiloghi multitema, incluso il target tastiera/tocco minimo di 44px.

Catture fresche del candidato: `output/playwright/design/release-home-final` (4 PNG, home desktop/mobile) e `release-dashboard-final` (6 PNG, dashboard e notifiche desktop/mobile). Il secondo giro è una verifica di presentazione con replay delle risposte GET del backend release isolato e 16 notifiche sintetiche; il pannello mantiene gli 8 elementi previsti dalla logica esistente. Manrope attivo, nessun overflow o errore browser, aiuto ETF chiuso e apribile con Enter, nessun contenuto delle notifiche fuori dal proprio pulsante. Il banner contesto incompleto e gli username lunghi sono mantenuti. Non è un test di login in produzione. Il runner automatico ha completato queste catture; un primo avvio separato dell’anteprima era stato respinto dalla revisione delle autorizzazioni. La [review indipendente del candidato](review-release-port.md) esamina tutte le dieci immagini fresche: SHIP grafica, pubblicazione HOLD sulla sola decisione di sicurezza pendente. Sul nuovo checkout anche i 328 E2E sono completati e passati (1,8 minuti), distinti dai due test di cattura.

La pagina wiki 12 proprietaria dell’aiuto ETF viene aggiornata sulla base backend corrente `8bf12a2`, branch documentale isolato `docs/grafite-miele-graphics-only-20261011` nel checkout `output/backend-graphics-only-20261011`. Nessun codice, schema, provider, configurazione o dato backend è modificato. Anche il precedente checkout backend resta intatto con il lavoro parallelo ai crediti. I diagrammi cloud restano validi: la slice cambia presentazione, font locale e disclosure nativa dentro i componenti già esistenti, senza nuovi collegamenti o attivazioni. Esito e revisioni pubblicate andranno registrati nel rapporto canonico di rilascio; questa sezione non dichiara un deploy riuscito.

## Confine del lavoro

La baseline `455b5a2` fotografa il frontend corrente, incluse le modifiche preesistenti di altre chat, nel worktree isolato `output/frontend-grafite-miele` del workspace. Il checkout frontend originale e il backend non sono stati modificati da questa slice. Le modifiche grafiche successive alla baseline hanno un commit separato: per la review usare `git diff 455b5a2`, senza attribuire alla grafica il contenuto dello snapshot.

Testi esistenti, link, chiamate API, salvataggi, autorizzazioni e logica applicativa restano invariati. La home riordina il markup e usa una hero tipografica senza fotografie. L’unica variazione di comportamento approvata dal responsabile prodotto è la definizione ETF: aiuto inizialmente chiuso, apribile su richiesta tramite «Cos’è un ETF?». Nessun push, deploy o provider aggiunto.

## Sistema realizzato

Manrope variabile locale con licenza OFL; grafite per testo e navigazione, miele per azioni principali e selezioni, superfici bianche e carta. Stati semantici distinti. Pulsanti 8px, card 12px (auth 16px), input 16px e bordo controllo #8d9295, focus visibile. Shell, home, dashboard, matching, auth e pagine informative condividono tipografia e stati. Transizioni CSS 120/180ms, reveal home, menu e dialoghi; reduced-motion disabilita animazioni e transizioni. La fotografia iniziale è stata rimossa, insieme al suo asset e al prompt, su richiesta esplicita dell'utente.

## Verifiche tecniche

- `npm run typecheck`: passato.
- `npm run lint`: passato.
- `node node_modules/next/dist/bin/next build --webpack`: passato, 35 route generate. Webpack è usato per il worktree con node_modules in junction; Turbopack rifiuta il percorso esterno al suo filesystem root.
- `node scripts/verify-design-boundary.mjs`: passato. Confronta AST dei TSX esclusi gli attributi grafici; per la home confronta testi, link e dati delle sezioni con la baseline. Non sostituisce un test di ogni comportamento.
- Validatore documentale canonico backend con `--frontend .`: passato (23 documenti backend, 5 frontend, 0 errori).
- Detector Impeccable eseguito una volta sulla prima versione: nessun finding. Il raster iniziale è stato successivamente eliminato con il suo prompt; il detector non è stato rieseguito nelle correzioni.

## Browser e review indipendente

Chrome con Playwright su loopback 3160, backend 8144 e copiaSQLite dedicata in `output/design-review-2026-10-10/runtime/design-preview.sqlite3`. Integrazioni email e Meet disabilitate. Login dal form reale con account sintetico; nessuna mutazione applicativa inviata oltre al login.

Round finale: `output/playwright/design/round-2/report.json`, 66 PNG e contenuto visibile delle pagine. 15 route su 1440×1000 e 390×844, menu account su entrambi e menu pubblico mobile; 35 check, 0 errori JavaScript, 0 overflow orizzontale, Manrope attivo, reduced-motion 0s. La cattura attende rete inattiva, sessione risolta e assenza di stati caricamento; matching richiede il mentor della fixture.

La [prima review indipendente](review-round-1.md) ha richiesto: catture con dati caricati, coerenza delle pagine pubbliche secondarie e maggiore contrasto dei campi. Tutte le correzioni sono state applicate in un batch. La [review completa finale](review-round-2.md) ha dato **SHIP per lo scope grafico**, dopo 42 PNG esaminati. I bordi dei controlli hanno contrasto 3.14:1 sul bianco. Rimane un P3 facoltativo sul selettore file nativo delle impostazioni; nessun nuovo P1/P2 nella matrice esaminata. Questa approvazione riguarda presentazione e leggibilità delle schermate, non i flussi funzionali non collaudati.

## Limiti e riproduzione

La matrice grafica non è il gate UX funzionale completo degli 8 criteri: non verifica i salvataggi della survey/contesto, l’invio delle richieste e il loro lifecycle. Nessuna prova PostgreSQL o provider esterni. Admin, survey completa, dettagli percorso e tutti gli stati errore non sono stati acquisiti individualmente. Il badge Next nei PNG appartiene alla modalità sviluppo.

Per ripetere la cattura, avviare la stessa slice su un backend locale con dati sintetici. Configurare `SOCRA_API_BASE_URL` per Next. Da root frontend impostare `DESIGN_BASE_URL` (solo localhost), `DESIGN_FIXTURE_PATH` (fixture generata dal backend) e `DESIGN_ROUND`, poi `node scripts/capture-design.mjs`. In un worktree isolato la fixture richiede un percorso esplicito. I risultati restano locali e sono ignorati da Git.

## Correzione home senza fotografia

Su richiesta del responsabile prodotto, rimossi fotografia, asset e animazione fotografica. Hero su una colonna, centrata su desktop e allineata a sinistra su mobile. Testi e destinazioni invariati. Il riferimento corrente della home è `output/playwright/design/home-no-photo`, non la home fotografica delle review storiche precedenti. Playwright: zero immagini nel main, font attivo, nessun overflow o errore JavaScript a 1440×1000 e 390×844. Typecheck e controllo del confine grafico passati. La [nuova review indipendente della home](review-home-no-photo.md) approva questo scope con SHIP; il resto del sito non è stato riesaminato in questa correzione.

## Correzione dashboard e notifiche

Il feedback umano successivo prevale sulle review storiche: quattro card dello stesso peso non rendevano chiaro il primo passo. La card Impara ora usa grafite e tutta la larghezza; il pulsante miele è l’azione principale, mentre mentor, obiettivo e competenze restano secondari. Su mobile il prossimo passo precede gli obiettivi e i crediti affiancano il saluto. Le destinazioni dipendono dalle stesse condizioni esistenti: definire l’obiettivo, cercare un mentor, aprire il percorso o rivedere l’obiettivo.

La definizione ETF era già nella baseline ed era mostrata per argomento ETF, senza distinzione per preparazione. Il responsabile prodotto ha scelto l’aiuto apribile su richiesta. La definizione esistente è conservata in un `details` nativo inizialmente chiuso, utilizzabile da tastiera. La pagina proprietaria wiki 12 è aggiornata in un worktree backend documentale isolato, branch `docs/dashboard-help-grafite-miele`: `202458a` fotografa solo il documento corrente preesistente; `e5546fd` modifica unicamente il paragrafo sulla dashboard. Il checkout backend originale e il codice backend restano intatti.

Le notifiche rompevano i confini della propria riga: la lista grid compressa dalla sua altezza massima lasciava «Nuova» fuori dal pulsante. La riproduzione precedente rilevava sette righe rotte. La lista ora usa flex verticale e ogni pulsante conserva l’altezza naturale senza restringersi, mantenendo testo e badge al suo interno.

Il runner [verify-dashboard-design.mjs](../../scripts/verify-dashboard-design.mjs) verifica dashboard, aiuto e notifiche su desktop 1440×1000, intermedio 1024×900, mobile 390×844 e scala CSS 125% (non zoom nativo del browser). Controlla contenimento di ogni figlio delle notifiche, CTA nel primo viewport, definizione nascosta all’ingresso e visibile senza coperture all’apertura, tastiera e assenza di overflow/errore JavaScript. Sei viste aggiuntive desktop/mobile usano risposte API mock per obiettivo assente, percorso attivo e revisione: verificano presentazione e destinazioni, senza mutazioni applicative. Evidenze correnti: `output/playwright/design/dashboard-priority-final/report.json`, 18 viste, 36 PNG e 10 check. La [review indipendente di questa correzione](review-dashboard-priority.md) possiede il giudizio grafico e i suoi limiti. Non è una nuova approvazione dell’intero sito né una prova di comprensione con utenti nuovi.
