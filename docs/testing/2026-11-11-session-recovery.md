# Recupero sessione Socra — 11/11/2026

Pubblicazione autorizzata da GR l’11/11/2026. Questo rapporto conserva le prove locali precedenti al rilascio; [stato di pubblicazione e verifiche online](https://github.com/reealpeppe/Socra-BE/blob/release/v3-20260919/docs/releases/2026-11-11-session-recovery.md) sono registrati nel rapporto canonico backend dopo il rollout.

Stato: implementazione locale sul branch BE/FE `fix/session-recovery-20261111`, senza deploy. Basi FE `2b6acee60d24b41f70ae9874dfa160a790e7484b`, BE `4b32add69328b04cb83e5603f7ee7dc5cadee49f`; produzione invariata rispetto al rilascio del 10/11.

Fonte wiki aggiornata nel commit BE `9f5760f05ae83f81efc71d7af06aa3d6f97816bb`.

## Richiesta e intervento

Una pagina privata rimasta aperta rendeva al401 soltanto testo e link, senza navigazione Socra. Il gate già impediva il montaggio dei contenuti autenticati. Il nuovo componente presentazionale riusa marchio, colori e pulsanti del sito e offre «Accedi per continuare» e «Torna alla home». Un errore temporaneo mantiene il retry; il caricamento resta distinto dalla sessione scaduta. Nessuna modifica alle decisioni di accesso, ai servizi o alla durata della sessione.

Il ritorno di login conserva pathname e query locali, senza fragment, secondo il comportamento esistente. La destinazione in pre-lancio resta la dashboard; a community aperta resta la destinazione validata da `safeNextPath`.

## Prove

Build Next di produzione isolata `.next-ux`: compilazione e TypeScript riusciti. `npm run test:security`: 147 superati. `npm run lint`: zero errori, due warning preesistenti in MonitoringMfa. Impeccable detector sui due nuovi file: nessuna segnalazione.

Regressione iniziale prima della modifica: assenti header, titolo e azioni della nuova schermata. Suite browser mock: 66 superati su desktop/mobile, nei file `session-recovery`, `auth`, `unverified-goals` e `prelaunch`. Coperti401 iniziale, scadenza durante la pagina aperta, nessuna lettura privata, errore503 e retry, navigazione Home, ritorno con query e convalida delle destinazioni di login. Il primo run dopo la modifica ha rilevato soltanto aspettative sul vecchio copy di caricamento e un mock dello stato pubblico mancante nel nuovo test: corretti senza cambiare il comportamento applicativo.

Collaudo con FastAPI e database SQLite locali nuovi, email disabilitate e worker fermo: due percorsi reali, desktop Chrome e Pixel5. Prenotazione/creazione account sintetici dal browser, lettura impostazioni, revoca server-side della sessione mantenendo il cookie browser, verifica HTTP401, rimozione dei dati privati, login alle credenziali e ritorno alla dashboard; nuova revoca e ritorno Home. Due test superati, nessun errore JavaScript. Screenshot e log ignorati in `.local/session-recovery-20261111/`.

Review indipendente di codice e due screenshot: approvati desktop/mobile, nessun rilievo. Verificati marchio, gerarchia delle azioni, landmark, skip link, focus visibile, target tattili, assenza di overflow e preservazione dei confini di accesso. Validatore documentale: backend40/frontend5 documenti, zero errori; diff senza errori di whitespace.

Anteprima utente aggiornata su `http://localhost:3169`, backend locale8169 mantenuto. Smoke browser sul server effettivo: cookie sintetico non valido, header e schermata scaduta, apertura credenziali e ritorno Home verificati; nessun errore JavaScript. Nessun dato utente usato per la prova.

Le prove mock e API locali restano distinte. Nessun test sul provider, nessuna email inviata, nessun account reale modificato e nessun collaudo mutativo in produzione. Non servono migrazioni, test applicativi BE o modifiche ai contratti: backend invariato, aggiornate soltanto le pagine wiki proprietarie14 e13. La topologia e i confini della wiki13 restano validi; il componente presenta lo stato già deciso dal gate FE.
