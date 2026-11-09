# Dashboard e bonus inviti — 10/11/2026

Revisione richiesta da GR: badge fondatore integrato nella testata del profilo, rimozione del contatore «Profili pronti», policy breve e premio di1 coin a invitante e invitato quando una nuova persona si iscrive con il link, verifica l’email e completa la preparazione. Davide prevedeva il premio all’invitante con importo `[N]`: bilateralità e importo1 sono la nuova indicazione esplicita GR.

FE `fix/prelaunch-referrals-20261110`, base produzione `26f8cb099bc9bd24268f435f81922992d4a24b58`; fonte BE dello stesso branch, base `297aeb73740cc4d53ec1a84e2b54aac0fbb129b9`. [Regola proprietaria](https://github.com/reealpeppe/Socra-BE/blob/fix/prelaunch-referrals-20261110/docs/wiki/14-prelancio.md), [piano e verifiche BE](https://github.com/reealpeppe/Socra-BE/blob/fix/prelaunch-referrals-20261110/docs/plans/2026-11-10-prelaunch-referrals.md).

## Modifica e contratto

Il badge segue il titolo della scheda, a destra su desktop e nella testata impilata su mobile. Il riepilogo distingue profilo pronto ed email confermata; il proprio obiettivo è un gruppo separato. Qualifica fondatore e progresso continuano a richiedere preparazione pronta ed email verificata.

La scheda inviti conserva «Inviti accettati e verificati» e mostra «Coin dai tuoi inviti» dal totale effettivo del ledger, senza dedurlo dal numero di profili. La policy riassume i requisiti e collega la sezione specifica delle condizioni. Le condizioni distinguono il premio inviti dai bonus email/registrazione e dalla loro regola di non cumulabilità reciproca.

`referrals.bonus_per_person` e `earned_bonus` arrivano dal backend. Sono opzionali sul consumer per compatibilità durante un aggiornamento progressivo: senza i nuovi campi rimangono il testo neutro e il solo contatore precedente, senza inventare importi o accrediti. Nessun endpoint/BFF, token, permesso operativo o dato di terzi aggiunto. Schema cloud, provider e attivazioni restano proprietari della wiki13 backend.

## Verifiche eseguite

- Build Next/TypeScript passati; ESLint zero errori e due warning MFA preesistenti, estranei alla slice.
- `npm run test:security`:147 passati,0 errori.
- Browser:80 passati su desktop/mobile con i quattro file prelaunch, prelaunch-navigation, prelaunch-preparation e prelaunch-mockups. I tre nuovi casi osservati fallire prima della modifica verificano policy bilaterale, totali effettivi0/2 e condizioni; le due aspettative sul vecchio riepilogo sono state aggiornate al testo nuovo.
- API locali vere, due percorsi completi desktop/mobile:2 passati. Registrazione, conferma da un altro browser, invito, completamento dell’invitato e accredito reale +1 a entrambi; ricariche e riletture conservano il saldo. Restano verificati ritorno, credenziali e blocco degli URL community.
- Sei screenshot con API vere, prima e dopo il premio e nella conferma finale. Review visiva indipendente PASS6/6: badge integrato, importo e condizioni leggibili, nessun contatore Profili pronti o clipping nei viewport esaminati.
- Il detector Impeccable segnala advisory di scale/colori già presenti nel modulo pre-lancio, inclusa la conferma verde espressamente richiesta da GR. Le nuove regole usano i passi tipografici documentati; nessun rinnovo del design system introdotto.

Il primo tentativo API reale è fallito nel solo helper di prova, che trattava `Response.ok` come funzione; corretto prima del run finale2/2. Le API non sono simulate in questa prova: database SQLite e account sintetici dedicati, worker email non avviabile e invii soppressi. Le prove non certificano consegna del provider.

Evidenze riservate in `.local/prelaunch-referrals-20261110/`: script/configurazione QA, database locale, risultati e6 PNG. La preview3189 usa soltanto il backend8189, separata dalle preview precedenti. Nessun dato o email reale impiegato nel collaudo.

## Stato della consegna

GR ha successivamente autorizzato test, pubblicazione e pulizia dei soli due indirizzi di prova esplicitamente indicati. Pubblicazione e manutenzione dati restano operazioni distinte, da registrare nel rapporto canonico BE dopo il loro esito. La review del codice ha individuato un confine concorrente tra salvataggio della preparazione e apertura; la correzione e il suo ricontrollo precedono il rilascio. Nessun deploy attestato da questo rapporto di collaudo locale.
