# Collaudo locale del pre-lancio del 4 novembre

Candidata BE e FE sul branch `feature/prelancio-20261104`. Le verifiche si riferiscono all’anteprima locale.

## Percorsi osservati con API vere

Chrome desktop a 1440 × 1000 e mobile a 390 × 844. Prenotazione con email sintetica, ringraziamento, rimando, refresh, compilazione immediata, ruolo imparo, esperienza, obiettivo, stato della verifica, conferma con il link dell’outbox locale, area riservata e blocco API 423 da un URL operativo. Un secondo browser apre l’invito, vede lo username dell’invitante, accetta, conferma l’indirizzo con E01 e completa il percorso insegno. L’invitante vede entrambi i conteggi passare da 0 a 1. Nessun errore JavaScript o overflow orizzontale registrato.

La review indipendente ha rilevato il troncamento dell’email su mobile, il saldo ambiguo e la sovrapposizione del badge di sviluppo ai conteggi. Dopo la correzione l’email si legge per intero, il saldo è distinto dal bonus e i conteggi sono leggibili. Le 30 immagini e il manifest SHA-256 sono in `.local/prelancio-nov/screenshots` nel workspace. Il badge Next è escluso dalla cattura. `review.md` distingue giudizio visivo e asserzioni browser.

## Verifiche ripetibili

- `npm run build`, `npm run lint`, `npm run test:security`, `npm run audit:security`.
- Dalla build, `node scripts/run-e2e.mjs tests/e2e/prelaunch.spec.ts tests/e2e/account-contacts.spec.ts tests/e2e/public-content.spec.ts` con backend non raggiungibile e risposte simulate dai test. Copre 58 casi desktop/mobile.
- L’anteprima di questa sessione usa frontend su loopback 3148, FastAPI su 8148, database SQLite dedicato e invio email disattivato. Il runner locale `.local/capture-prelaunch.mjs` legge solo l’outbox della fixture e apre i link prodotti dall’applicazione. Il recapito su una casella email e l’automazione E02–E11 restano fuori da questa verifica.
