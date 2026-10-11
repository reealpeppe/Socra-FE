# Prestazioni di navigazione — integrazione per il rilascio 11/10

Pubblicazione richiesta da GR dopo la prova della preview. Branch isolato
`release/page-performance-20261011`: unisce la correzione `bf455fa` e il
candidato grafico/tooling `65bf963`, già pubblicato tramite PR13 nel merge
`9933b3a9eed7dce3f4f8a0c9391dc459da813f4b`. I checkout originali e le slice
in lavorazione delle altre chat restano separati.

## Preservazione

La grafica grafite/miele, l'aiuto ETF apribile, il contenimento notifiche e
le disclosure dei riepiloghi sono conservati. Nessuna nuova logica crediti.
Backend, API e schema invariati; documenti canonici integrati nel branch BE
`docs/page-performance-release-20261011`, insieme alla documentazione grafica.
L'integrazione mantiene Next/config/plugin16.3.8, alias ESLint tinyglobby
limitato al plugin Next e rimozione totale delle eccezioni audit. Il controllo
della configurazione effettiva segue ora `app/(public)/page.tsx`.

Il vecchio `verify-design-boundary.mjs` possiede il confine della sola slice
grafica: il suo PASS storico non certifica questa integrazione prestazioni.
La review tecnica finale dell'integrazione non ha individuato bug concreti;
37 test mirati cache/audit/lint eseguiti separatamente dal reviewer.

## Verifiche fresche sul candidato integrato

- Installazione `npm ci`, audit completo0/runtime0/eccezioni0, build e typecheck: PASS.
- Sicurezza:108/108; cache:9/9; gate UX:8/8. Lint:0 errori, due warning MonitoringMfa preesistenti.
- Tutta la suite browser:338/338 desktop/mobile in4minuti, inclusi i10 casi prestazioni.
- Cattura API vere locale con fixture dedicata, email/Meet disabilitati:
  `output/playwright/ux-review/2026-10-11T10-48-38-275Z`,50 scenari.
  Fingerprint `1b419b77dd72ad3ab29dc80a9a42885b58472c2bc3336dcc22c7c72df3e388d9`;
  build UX `omTKfKGGt_gWTbAPrrVzJ`. Review semantica in corso.
- Documenti canonici:32 BE/5 FE/10 workspace,0 errori.

La [preview originale](page-performance-2026-10-11.md) misura il confronto
controllato delle viste private: mediana344→45ms desktop e360→36ms mobile.
Questi valori sono locali e non vengono attribuiti alla produzione.

## Misura online prima del rilascio prestazioni

Chrome reale anonimo, otto navigazioni pubbliche per viewport sul deployment
grafico `9933b3a`, pagine già visitate e500ms tra i passaggi. Mediana click→titolo
pronto:365,5ms desktop/353,5ms mobile; fallback globale presente in15/16 passaggi,
durata291–341ms. Zero errori JavaScript e zero mutazioni API applicative.
Non è una misura di cold start né di pagine private autenticate.

Provenienza degli artefatti operativi locali:
`.local/page-performance-release-20261011/` nel workspace. Backup verificato
11/10 ore03:00UTC; schema PG `20261002_skills`,64 tabelle e571 righe nella lettura
pre-rilascio. Nessuna migrazione prevista.

## Pubblicazione

CI, SHA merge, deployment e misura online successiva restano da registrare.
Il merge deve includere la release corrente, con guard su base/head e senza
force push. Rollback frontend al deployment grafico `17f6e81b-50e4-4f1e-8a88-b59d04923cf5`,
conservando le patch Next e tooling già online; nessun restore DB.
