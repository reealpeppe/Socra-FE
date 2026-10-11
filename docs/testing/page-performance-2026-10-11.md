# Attese di navigazione — correzione e collaudo 11/10/2026

Branch FE `fix/page-performance-20261011`, base `4198c0d`; documentazione
condivisa BE `docs/page-performance-20261011`, base `8bf12a2`. Worktree isolati,
checkout e server delle altre chat conservati. Implementazione locale, nessun
deploy: questi risultati non attestano la correzione su socra.it.

## Problema e intervento

La diagnosi ha riprodotto online «Stiamo preparando Socra»: FAQ 3.047 ms,
Community 1.263 ms, Come funziona 2.325 ms alla prima navigazione osservata;
visite successive 307–308 ms. La prova era anonima. Il primo accesso online
ha avuto TTFB 5.420 ms e FCP 6.432 ms, con forte variabilità nelle ripetizioni;
non è una misura isolata del rendering server. Il badge «Rendering» locale
appartiene ai devtools Next; produzione e sviluppo sono ambienti diversi.

Il confronto controllato sotto usa **due build di produzione locali**,
stesso backend e fixture sintetica, per isolare il costo del codice:

- Navbar/footer pubblici spostati nel layout `(public)`, mantenendo URL,
  metadata e contenuti. La navbar persiste e non ricontrolla la sessione
  a ogni pagina. Il refresh di sessione continua a funzionare durante una
  richiesta pendente: nessun evento viene scartato per ridurre le richieste.
- Rimossi i fallback globali di route che sostituivano tutta la pagina;
  durante la risposta RSC resta disponibile il contenuto corrente.
  Prefetch completo sui link della navbar e della shell privata.
- Gate, catalogo e viste inizializzati dalle risposte valide della cache
  della stessa scheda. TTL operativo cinque secondi per percorsi, richieste,
  capacità, profili, crediti/transazioni; TTL preesistenti per sessione,
  onboarding e cataloghi. Invalidazione su mutazioni, sessione e ritorno alla
  scheda conservata. `null` verificato non equivale a caricamento in corso.
- Profilo pubblico accessorio della dashboard caricato indipendentemente
  da obiettivi/percorsi. La scheda mostra caricamento o errore, senza anticipare
  un falso stato vuoto. Crediti già indipendenti.
- Corretto l'overflow del saluto con username di 80 caratteri individuato
  nella regressione browser.

Cookie HttpOnly, nonce CSP per richiesta, HTML/RSC `private, no-store`, BFF,
permessi e backend autorevole conservati. Non è stata attivata cache CDN.
I confini tecnici sono aggiornati nell'[architettura FE](../architecture/overview.md)
e nella wiki 13 BE sul branch indicato. Regole, DTO e schema non cambiano:
nessuna modifica funzionale alla wiki competenze/account o nuova migrazione.

## Confronto con API vere

Chrome, desktop 1440×1000 e mobile 390×844; nessuna limitazione artificiale
di rete/CPU. Frontend `127.0.0.1:3162`, backend `127.0.0.1:8162`, SQLite e
account sintetici dedicati. Nessun provider reale o dato di produzione.
Login attraverso il form e cookie BFF; ID confrontato con la fixture.

Tempi dal clic Playwright al nuovo URL e contenuto principale caricato.
Includono attesa dell'azione, eventuale scroll e menu; escludono la scheda
esperienza indipendente. Non sono percentili né tempi garantiti per Internet.
La prova copre una sequenza di navigazioni, compresi i ritorni alla dashboard;
non misura tutti gli endpoint o la prima apertura a cache completamente fredda.

Base Next 16.3.6, build `Fs-RjFj7KWtVWWTXS6xhg`; finale Next 16.3.8,
build `eEUF9HY3IkOccirkkx8_B`. Il miglioramento era già presente nella prova
intermedia a parità di Next 16.3.6: mediana privata desktop 42 ms, mobile 40 ms.
L'aggiornamento patch successivo è motivato dall'audit runtime.

| Navigazione privata | Desktop prima | Desktop finale | Mobile prima | Mobile finale |
|---|---:|---:|---:|---:|
| Crediti | 340 ms | 51 ms | 332 ms | 36 ms |
| Percorsi | 372 ms | 29 ms | 364 ms | 38 ms |
| Proposte | 344 ms | 38 ms | 333 ms | 33 ms |
| Dashboard, primo ritorno | 89 ms | 34 ms | 360 ms | 36 ms |
| Obiettivi | 362 ms | 58 ms | 359 ms | 73 ms |
| Impostazioni | 364 ms | 59 ms | 544 ms | 245 ms |
| Dashboard, secondo ritorno | 65 ms | 45 ms | 362 ms | 29 ms |
| **Mediana della sequenza** | **344 ms** | **45 ms** | **360 ms** | **36 ms** |

Riduzione della mediana circa 87% desktop e 90% mobile, pari a circa 8–10 volte.
Il clic mobile sulle impostazioni include apertura/menu/scroll: non attribuire
l'intero tempo a un'API. I caricamenti locali per dati ancora assenti rimangono.

| Navigazione pubblica | Desktop prima/finale | Mobile prima/finale |
|---|---:|---:|
| FAQ, prima nella sequenza | 346 / 79 ms | 77 / 62 ms |
| Community | 44 / 46 ms | 50 / 38 ms |
| Come funziona | 36 / 34 ms | 31 / 29 ms |
| FAQ, ritorno | 38 / 38 ms | 41 / 34 ms |

Il fallback globale era visibile per 312 ms sulla prima FAQ desktop della
base; **zero frame di fallback globale nella sequenza finale**. Le richieste
anonime `/auth/me` passano da sei a due all'avvio della sequenza, senza nuove
richieste ai cambi pagina. Le due iniziali comprendono il refresh conseguente
al primo 401. Alcune pagine già veloci prima non migliorano nel singolo campione.
Nessun errore JS/CSP o overflow orizzontale nella misura finale.

Misure, screenshot e campioni intermedi locali in
`output/playwright/performance/{baseline,after,after-final,after-reviewed,verified,final}`.
`final/measurements.json` è il campione finale sopra; `after-reviewed` è stato
eseguito mentre altre verifiche erano attive. Gli artefatti sono ignorati da Git.
Lo [script di misura](../../scripts/measure-page-performance.mjs) è versionato:

```text
node scripts/measure-page-performance.mjs final http://127.0.0.1:3162 ../page-performance-backend-20261011/.local/ux-review-fixture.json
```

Accetta solo loopback e fixture UX dedicata; legge l'ID autenticato, non invia
scritture di dominio e chiude le sessioni sintetiche tramite logout browser.

## Verifiche

- Build di produzione e TypeScript superati con Next 16.3.8.
- Lint: zero errori, due warning preesistenti in MonitoringMfa.
- `npm run test:security`: 113/113. Cache client/motore: 9/9, inclusi scadenza,
  mutazioni, cambio account e invalidazione al ritorno della scheda.
- Regressioni di navigazione desktop/mobile: contenuto e navbar conservati
  con RSC trattenuta oltre 400 ms, anche senza prefetch completato; nessun
  nuovo probe pubblico; ritorno alla dashboard con una sola lettura percorsi;
  profilo accessorio lento non blocca le azioni. I tre casi iniziali sono
  falliti sulla base prima dell'implementazione.
- La review del codice ha riprodotto un refresh sessione perso durante una
  richiesta auth pendente. Rimossa la guardia aggiunta durante questo lavoro;
  regressione desktop/mobile superata. La risposta vecchia non sovrascrive
  l'esito anonimo successivo.
- Suite pertinenti competenze e sicurezza web: 84/84 sulla patch Next 16.3.8.
  Ulteriore suite accesso/pubblico/notifiche/registrazione/prestazioni:
  67/68 al primo run concorrente, un'attesa dashboard scaduta nel login con
  fixture mock incompleta. Il cookie fittizio raggiungeva API non simulate,
  producendo 401 reali e invalidando la sessione simulata. Completate le
  risposte capacità/profilo della fixture; nuova esecuzione con la regressione
  sessione aggiunta: **70/70**, desktop/mobile, quattro worker.
- Capture UX finale `2026-10-11T10-13-34-797Z`: 25 scenari per viewport,
  API vere e build fresca `.next-ux` `UT_oeQd61do0PCj36Xh_r`.
  La fixture di questa suite vive in un backend scratch `.local/ux-clean`
  con sorgenti applicativi identici, separata dalla preview aperta all'utente.
  Review semantica indipendente: **30/30 giudizi a 2/2**, nessuna issue;
  gate superato su sorgenti correnti e hash delle evidenze, registrato nel
  suo `review.json`. Review del codice indipendente senza finding residui.
  Le capture precedenti non attestano il lockfile finale. Il solo runtime
  opzionale Sharp WASM omesso da npm Windows è stato ripristinato dalla base;
  installazione dal lockfile e build ripetute prima della capture finale.
- Verifica documentale della coppia di worktree e workspace: 31 documenti BE,
  cinque ingressi FE, dieci documenti workspace; zero errori. Diagramma Mermaid
  locale della wiki 13 renderizzato e ispezionato.

## Dipendenze e limite per il rilascio

Il controllo reale ha individuato un finding runtime in Next 16.3.6. Adottata
la [patch ufficiale 16.3.8](https://github.com/advisories/GHSA-cjq9-62q9-8jv4)
con il config ESLint corrispondente, preservando il runtime opzionale WASM
richiesto da Sharp. L'audit runtime successivo è pulito.
L'audit completo conserva **cinque high** nella catena dev braces e il comando
`npm run audit:security` termina con errore: l'eccezione scadeva il 10/10 UTC.
Nessuna estensione della scadenza, esclusione del finding o modifica al gate.

I test della vecchia eccezione usano ora una fixture storica del lockfile;
il gate reale continua a leggere il lockfile corrente e rifiuta quella
eccezione anche sul nuovo grafo. La baseline sicurezza FE/BE registra l'esito.
**Preview utilizzabile, branch non dichiarato pronto alla pubblicazione**
finché il blocco dell'audit completo non viene risolto con una scelta esplicita.

## Prova dell'utente e confini della verifica

Preview di produzione locale su `http://127.0.0.1:3162`, lasciata attiva;
account sintetico `ux.review.learner.long.username`, password demo
`SocraDemo2026!`. Può navigare le pagine pubbliche e accedere a dashboard,
obiettivi, percorsi, proposte e impostazioni usando dati dedicati.
Il runner locale e i PID sono in `output/playwright/performance/`.
Documenti condivisi salvati nel commit BE `ec94643` del branch indicato.

Non sono state pubblicate modifiche su socra.it. Prima di attribuire gli stessi
tempi online occorrono rilascio autorizzato, audit risolto e misure sul deployment
effettivo. DNS/TLS, risposta del server remoto, cache fredda e PostgreSQL reale
restano fuori da questo confronto controllato. Lo stack attuale ha dimostrato
di servire rapidamente questa navigazione locale senza sostituirlo.
