# Riferimento funzionale

Il proprietario canonico delle regole è la wiki versionata nel repository **Socra-BE**, directory `docs/wiki/README.md`.

Nel workspace con entrambi i repository: [apri la wiki](../../backend/docs/wiki/README.md).

Per cambiamenti funzionali aggiornare la pagina canonica e i relativi contratti/test nella stessa revisione. I DOCX originali sono input e archivio storico, non una seconda specifica da mantenere in parallelo.

Slice 18/09/2026: nove tipi di confronto, da uno a tre nel frontend; nessun effetto su punteggio/ammissibilità/profondità; vecchi obiettivi senza preferenze compatibili. Pagina `/livelli` intenzionalmente invariata in attesa dei nuovi contenuti del proprietario prodotto.
# Revisione survey/prestazioni — 20 settembre 2026

Branch `feature/onboarding-performance-20260920`, collaudo separato dalla produzione.
Regole: wiki backend 02 (survey/crescita), 07 (contratti), 08 (decisioni).
Il gruppo `app/(community)` mantiene il layout tra pagine, senza cambiare URL.
Il nuovo onboarding raccoglie solo conoscenza, importi, disponibilità e autonomia
quando applicabile, progressivamente per gli strumenti scelti. Scenari generici,
autovalutazione trasversale e dati demografici non sono nel nuovo ingresso.

Diagnostica: `window.__socraVitals` contiene al massimo 50 misure Web Vitals del
browser corrente, senza identificativi o risposte e senza invii a servizi esterni.
Non equiparare i tempi dei test con API mock alle latenze reali. Per eseguire i test
di regressione su un server già avviato usare `PLAYWRIGHT_EXTERNAL_SERVER=1` e
`PLAYWRIGHT_BASE_URL`; i test con mock restano soltanto controlli di interfaccia.
