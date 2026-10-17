# Inviti personali — verifiche locali17/10/2026

Implementazione locale su `feature/mentor-alerts-20261017`, nessun deploy. [Regole e collaudo canonici BE](https://github.com/reealpeppe/Socra-BE/blob/feature/mentor-alerts-20261017/docs/testing/2026-10-17-personal-invitations.md). Conservati Avvisami, marchio/footer ufficiali e correzione SSR `no-transform`.

Typecheck/build/lint exit0, solo2 warning preesistenti MonitoringMfa;118 test sicurezza/BFF passati dopo integrazione SSR.64 E2E desktop/mobile passati (invio, consenso, incertezza, pre-survey, ritorno, rifiuto/scadenza, cambio account e regressioni auth/avvisi), con runner esistente e Chromium Playwright locale per il limite di teardown Chrome già documentato.

`UX_BACKEND_DIR=<worktree-BE> node scripts/capture-invitations.mjs` ricrea la build e usa API/BFF reali su server loopback propri3187/8184, account e database univoci esclusivamente sintetici. Seed BE guardato; provider email/Meet spenti, prima call simulata nei soli metadati. Run `2026-10-17T16-23-10-541Z`,17 PNG con manifest/fingerprint/hash sotto `output/playwright/invitations`: nuova registrazione prima survey, ritorno, verifica email, percorso costo0 e saldi5/6 desktop/mobile; persona già iscritta senza bonus, saldi2/3. Technical pass non assegna il giudizio semantico; review indipendente in corso.
