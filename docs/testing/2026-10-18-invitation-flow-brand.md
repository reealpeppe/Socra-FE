# Invito guidato e colori Socra — 18/10/2026

Candidato `fix/invitation-onboarding-brand-20261018`, base FE `cab6adc3`, BE `4069319`. Autorizzazione GR: implementare, collaudare e pubblicare direttamente. Regole proprietarie nella wiki09/07/12 backend; nessuna nuova integrazione o migrazione.

La registrazione invitata usa esclusivamente la prova HttpOnly nel BFF, con indicatore di contesto rimosso prima dell’upstream. Registrazione ordinaria indipendente dai cookie residui. Shell dedicata, proposta con una CTA per fase, attività note/offerte esplicite, ritorno diretto senza contesto D facoltativo, consenso a disponibilità in pausa e recapiti prima dell’accettazione. Blu/giallo del marchio sostituiscono la salvia privata; home e SVG ufficiali conservati.

## Verifiche locali

- `node --test tests/auth-bff.test.mjs`:9/9; regressione cookie residuo osservata RED prima della correzione e GREEN dopo.
- `npm run test:security`:124/124, nessun fallimento. Typecheck passato. Lint senza errori, due avvisi preesistenti in MonitoringMfa per location.assign.
- Build Next di produzione eseguita dal runner della cattura. Browser reale con BFF/API, fixture SQLite dedicata e provider spenti: registrazione da link, prova email senza token/job di verifica aggiuntivi, proposta prima della survey, offerte esplicite, ritorno, consenso, apertura, costo0 e bonus solo al completamento. Desktop1440×1000 e mobile390×844; account già iscritto senza bonus. Primo incontro simulato soltanto nei metadati della fixture locale.
- Regression E2E aggiornate per singola azione, shell dedicata, mentor in pausa, survey senza D e ritorno; RED dei tre nuovi comportamenti osservato prima dell’implementazione. Il runner Windows locale può bloccarsi nel teardown del browser: la suite Linux CI sarà il riferimento per il risultato completo.
- Review codice indipendente: nessun rilievo materiale aperto dopo la correzione del cookie;17 test BFF auth/inviti eseguiti indipendentemente.

`scripts/capture-invitation-flow.mjs` gestisce processo/browser dedicati, nessuna chiusura di browser altrui. Screenshot/hash e controlli sono in `output/playwright/invitation-flow/2026-10-17T23-52-15-402Z/manifest.json`; fingerprint del codice applicativo e BUILD_ID legano le prove alla build. Le prime acquisizioni di dashboard/impostazioni in caricamento sono scartate, non considerate prova visiva.

Review Impeccable indipendente: verifica completa del run caricato23:48 UTC, `fix` su due punti circoscritti — promessa di consegna con canale spento e target chiusura/consenso inferiori a44px. Applicata una sola correzione in batch, ricattura23:52 UTC completa35 PNG e controlli44px passati. Il reviewer ha riletto12 immagini coinvolte e verificato gli hash: entrambi i rilievi `resolved`, nessuna regressione da quel batch, `disposition: ship` limitato ai fix valutati. Matrice completa e verdetto in `.impeccable/review/finish-review.md` e `verdict.md`, evidenze generate locali escluse da Git. Nessun secondo detector o nuova caccia a difetti.

Detector Impeccable eseguito una sola volta:301 advisory su valori/ramp e6 warning su CSS legacy; nessun errore tecnico. La review considera il rendering effettivo e distingue il debito preesistente dall’intervento. I dati sintetici sono espliciti e nessuna immagine generativa viene aggiunta. `PRODUCT.md`, `DESIGN.md` e sidecar descrivono riferimenti e sistema implementato.

## Limiti e pubblicazione

Mock, API vere locali, PostgreSQL CI e runtime pubblico sono evidenze distinte. Il collaudo locale non attesta consegna inbox, meeting reale o motore avvisi mentor. Stato ed evidenze del rilascio nel rapporto canonico Socra-BE `docs/releases/2026-10-18-invitation-flow-brand.md`; questo documento non anticipa un deploy.
