# Interfacce approvate — candidato produzione 13/10

Candidato isolato `release/approved-ui-20261013` su produzione `4a185563a5153634fc2a1280b38cf8813993695e`, backend corrente `c02e5410402f1637de0aad6dcda2282a130b28c9`. Porta i tre mockup e il disclaimer sulla release attuale senza lo snapshot feature. Regole nella wiki 12 del backend; [architettura locale](../architecture/overview.md).

Porting: shared card per persona/multitema, avatar pubblico/fallback, form compatto con scelta del tema nella stessa schermata, dashboard perla/salvia. Conservati credito anticipato, cache/navigazione, pausa, snapshot, aiuto ETF e contesto con cinque scelte esplicite. Nessuna modifica a dipendenze, API, autorizzazioni o schema.

## Verifiche

Baseline pulita: npm ci con zero vulnerabilità, typecheck e 108 test sicurezza passati. Candidato: typecheck/lint/build passati; lint conserva soltanto due warning preesistenti in MonitoringMfa. Audit completo/runtime: zero vulnerabilità, zero eccezioni; 9 test cache e 8 gate UX passati.

La prima suite completa ha ottenuto 341 passati, 7 falliti e due live skip: sei selettori del vecchio layout da aggiornare e un vero overflow del nome lungo mobile, corretto. Dopo le correzioni, build fresca e **108 E2E pertinenti desktop/mobile passati**, comprese le nuove regressioni. La CI esegue nuovamente l'intera suite sul candidato. Cattura API vere e review semantica in completamento; il primo runner ha individuato un selettore ambiguo perché il nuovo stato mentor appare in due sezioni, ora limitato alla regione mentor. Nessuna asserzione funzionale rimossa.

Il caso aggiunto verifica foto dal DTO pubblico, attività coperte subito visibili, sottoinsieme e consenso espliciti, errore 503/retry conservando testo/selezione. Le asserzioni funzionali della suite produzione restano presenti; soltanto i selettori grafici sono adattati al copy approvato.

Review tecnica indipendente del porting: tre rilievi corretti prima del rilascio. Riepilogo obiettivi accessorio indipendente dai candidati e retry dedicato; saluto/nickname lungo contenuto anche su mobile; target discovery su identità e primo tema, conservando hook 50%/un secondo. Regressioni nuove per riepilogo 503 con risultati/CTA disponibili, retry senza una nuova ricerca e scheda alta oltre due viewport con otto temi/tre attività, impressione unica e nessuna impressione mobile per il candidato fuori schermo. Contenimento del saluto controllato anche con 80 caratteri senza spazi.

## Limiti

Le fixture locali usano SQLite separato e provider disabilitati. Nessuna mutazione applicativa di produzione per il collaudo. Lo stato del deploy è nel rapporto backend `docs/releases/2026-10-13-approved-ui.md`; presenza del codice locale e build non attestano il rilascio.
