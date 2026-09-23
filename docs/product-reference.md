# Riferimento funzionale

Il proprietario canonico delle regole è la wiki versionata nel repository **Socra-BE**, directory `docs/wiki/README.md`.

Nel workspace con entrambi i repository: [apri la wiki](../../backend/docs/wiki/README.md).

Per cambiamenti funzionali aggiornare la pagina canonica e i relativi contratti/test nella stessa revisione. I DOCX originali sono input e archivio storico, non una seconda specifica da mantenere in parallelo.

Slice 18/09/2026: nove tipi di confronto, da uno a tre nel frontend; nessun effetto su punteggio/ammissibilità/profondità; vecchi obiettivi senza preferenze compatibili. Pagina `/livelli` intenzionalmente invariata in attesa dei nuovi contenuti del proprietario prodotto.
## Revisione survey/prestazioni — 20–24 settembre 2026

Sviluppo su `feature/onboarding-performance-20260920`; promozione verificata in
produzione il 24/09 su `release/v3-20260919`, dopo autorizzazione GR del 23/09.
Test-v3 mantiene dati separati. Report e rollback nel backend:
`docs/releases/2026-09-23-ux-production.md`.
Regole: wiki backend 02 (survey/crescita), 07 (contratti), 08 (decisioni).
Il gruppo `app/(community)` mantiene il layout tra pagine, senza cambiare URL.
L'ingresso `/onboarding` usa una cornice minima: nessun menu operativo o barra
inferiore che possa distrarre o coprire i comandi su mobile.
Il nuovo onboarding raccoglie conoscenza, importi, disponibilità e autonomia
quando applicabile, progressivamente per gli strumenti scelti. La correzione GR
del 21/09 conserva anche le cinque domande finanziarie della sezione D: una alla
volta, obbligatorie con scelta individuale “Preferisco non rispondere”. Restano
private e non incidono sul matching. Gli scenari generici sono ritirati;
l'autovalutazione trasversale è un punto aperto distinto nella wiki 08.

## Obiettivi, sessione e proposte — 23–24 settembre 2026

Wiki proprietarie: 03 per suggerimenti legati allo strumento e tipi di confronto;
05/06 per richieste e profilo sicuro; 07 per contratti/sessione/notifiche. Il
modulo obiettivo non chiede più il contesto ridondante, senza eliminare i valori
storici né le domande finanziarie della survey. Le pagine pubbliche riconoscono
la sessione. Le proposte ricevute e ancora valide hanno un banner dismissibile,
schede con ruoli espliciti e link al profilo della controparte. Nessun nuovo
vincolo di matching o ampliamento dei dati pubblici.

## Diagnostica e cache

Diagnostica: `window.__socraVitals` contiene al massimo 50 misure Web Vitals del
browser corrente, senza identificativi o risposte e senza invii a servizi esterni.
Non equiparare i tempi dei test con API mock alle latenze reali. Per eseguire i test
di regressione su un server già avviato usare `PLAYWRIGHT_EXTERNAL_SERVER=1` e
`PLAYWRIGHT_BASE_URL`; i test con mock restano soltanto controlli di interfaccia.

Cache privata solo in memoria del browser: profilo e stato survey 30 secondi,
catalogo obiettivi 5 minuti, obiettivi e richieste inviate 5 secondi (prefetch
parallelo al controllo di ingresso nel matching). Mutazioni e cambio sessione
invalidano la cache; non si condividono risposte personali tra utenti o server.
