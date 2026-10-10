# Consegna grafica Socra — grafite e miele

Data: 10/10/2026. Branch locale `design/grafite-miele`.

## Confine del lavoro

La baseline `455b5a2` fotografa il frontend corrente, incluse le modifiche preesistenti di altre chat, nel worktree isolato `output/frontend-grafite-miele` del workspace. Il checkout frontend originale e il backend non sono stati modificati da questa slice. Le modifiche grafiche successive alla baseline hanno un commit separato: per la review usare `git diff 455b5a2`, senza attribuire alla grafica il contenuto dello snapshot.

Testi, link, condizioni, chiamate API, salvataggi, autorizzazioni e logica applicativa restano invariati. La home riordina il markup e usa una hero tipografica senza fotografie; gli altri TSX cambiano attributi/stili di presentazione. La wiki non cambia: nessuna regola, visibilità o contratto è stato modificato. Nessun push, deploy o provider aggiunto.

## Sistema realizzato

Manrope variabile locale con licenza OFL; grafite per testo e navigazione, miele per azioni principali e selezioni, superfici bianche e carta. Stati semantici distinti. Pulsanti 8px, card 12px (auth 16px), input 16px e bordo controllo #8d9295, focus visibile. Shell, home, dashboard, matching, auth e pagine informative condividono tipografia e stati. Transizioni CSS 120/180ms, reveal home, menu e dialoghi; reduced-motion disabilita animazioni e transizioni. La fotografia iniziale è stata rimossa, insieme al suo asset e al prompt, su richiesta esplicita dell'utente.

## Verifiche tecniche

- `npm run typecheck`: passato.
- `npm run lint`: passato.
- `node node_modules/next/dist/bin/next build --webpack`: passato, 35 route generate. Webpack è usato per il worktree con node_modules in junction; Turbopack rifiuta il percorso esterno al suo filesystem root.
- `node scripts/verify-design-boundary.mjs`: passato. Confronta AST dei TSX esclusi gli attributi grafici; per la home confronta testi, link e dati delle sezioni con la baseline. Non sostituisce un test di ogni comportamento.
- Validatore documentale canonico backend con `--frontend .`: passato (23 documenti backend, 5 frontend, 0 errori).
- Detector Impeccable eseguito una volta: nessun finding. Provenienza asset: 1 raster, 0 prompt mancanti.

## Browser e review indipendente

Chrome con Playwright su loopback 3160, backend 8144 e copiaSQLite dedicata in `output/design-review-2026-10-10/runtime/design-preview.sqlite3`. Integrazioni email e Meet disabilitate. Login dal form reale con account sintetico; nessuna mutazione applicativa inviata oltre al login.

Round finale: `output/playwright/design/round-2/report.json`, 66 PNG e contenuto visibile delle pagine. 15 route su 1440×1000 e 390×844, menu account su entrambi e menu pubblico mobile; 35 check, 0 errori JavaScript, 0 overflow orizzontale, Manrope attivo, reduced-motion 0s. La cattura attende rete inattiva, sessione risolta e assenza di stati caricamento; matching richiede il mentor della fixture.

La [prima review indipendente](review-round-1.md) ha richiesto: catture con dati caricati, coerenza delle pagine pubbliche secondarie e maggiore contrasto dei campi. Tutte le correzioni sono state applicate in un batch. La [review completa finale](review-round-2.md) ha dato **SHIP per lo scope grafico**, dopo 42 PNG esaminati. I bordi dei controlli hanno contrasto 3.14:1 sul bianco. Rimane un P3 facoltativo sul selettore file nativo delle impostazioni; nessun nuovo P1/P2 nella matrice esaminata. Questa approvazione riguarda presentazione e leggibilità delle schermate, non i flussi funzionali non collaudati.

## Limiti e riproduzione

La matrice grafica non è il gate UX funzionale completo degli 8 criteri: non verifica i salvataggi della survey/contesto, l’invio delle richieste e il loro lifecycle. Nessuna prova PostgreSQL o provider esterni. Admin, survey completa, dettagli percorso e tutti gli stati errore non sono stati acquisiti individualmente. Il badge Next nei PNG appartiene alla modalità sviluppo.

Per ripetere la cattura, avviare la stessa slice su un backend locale con dati sintetici. Configurare `SOCRA_API_BASE_URL` per Next. Da root frontend impostare `DESIGN_BASE_URL` (solo localhost), `DESIGN_FIXTURE_PATH` (fixture generata dal backend) e `DESIGN_ROUND`, poi `node scripts/capture-design.mjs`. In un worktree isolato la fixture richiede un percorso esplicito. I risultati restano locali e sono ignorati da Git.

## Correzione home senza fotografia

Su richiesta del responsabile prodotto, rimossi fotografia, asset e animazione fotografica. Hero su una colonna, centrata su desktop e allineata a sinistra su mobile. Testi e destinazioni invariati. Il riferimento corrente della home è `output/playwright/design/home-no-photo`, non la home fotografica delle review storiche precedenti. Playwright: zero immagini nel main, font attivo, nessun overflow o errore JavaScript a 1440×1000 e 390×844. Typecheck e controllo del confine grafico passati. La [nuova review indipendente della home](review-home-no-photo.md) approva questo scope con SHIP; il resto del sito non è stato riesaminato in questa correzione.
