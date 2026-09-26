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

## Account, profilo e contatti — 26 settembre 2026

Proprietario canonico: [wiki backend 09 — Account, contatti e email](../../backend/docs/wiki/09-account-email.md),
con i rimandi a contratti e permessi della wiki. Lo sviluppo rimane su
`feature/email-contacts-20260926`; non implica pubblicazione o attivazione degli invii.

La registrazione raccoglie email, password e consenso essenziale. Nome nella
community, presentazione breve e foto facoltativa si modificano in `/settings`;
email, survey e valutazioni interne non compaiono nel profilo pubblico.
Verifica indirizzo e recupero password usano link monouso con token nel fragment,
eliminato dalla barra e conservato solo in memoria durante la conferma.
Le risposte BFF di login e registrazione non espongono il bearer: la sessione
resta in cookie HttpOnly.

Invio e accettazione di nuovi percorsi richiedono una scelta esplicita di
condivisione email per ciascuna persona. Proposte storiche pendenti e percorsi
già aperti richiedono conferme separate: nessuna esposizione retroattiva dei
contatti. Il dettaglio percorso mostra gli indirizzi soltanto dopo il doppio
accordo; nessuna email nei profili, nei risultati matching o nelle proposte pendenti.

Le email operative sono condizionate dall’abilitazione dell’invio e non sono
marketing. Privacy e Termini descrivono foto/bio, scambio contatti, verifica/reset
e Resend senza dichiarare approvazione legale; le bozze restano in validazione.
Google Meet viene presentato solo come integrazione disponibile quando configurata,
non come garanzia di una stanza sempre pronta. Le condizioni canoniche e i punti
aperti restano nella wiki, non vengono duplicati in questo documento.
