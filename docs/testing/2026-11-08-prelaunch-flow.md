# Pre-lancio: percorsi e mockup — 08/11/2026

**Pubblicato e verificato:** applicazione FE `5e15ba9a6bba08ef4cb7dcdaf517d5c059b78ef6`, BE `e624cd49ce1a6cd15b0d35cd5b7d3a062132a6c1`, Railway SUCCESS. CI finale846 SQLite/890 PostgreSQL e590 browser passati;10 scenari runtime sotto rollback e13 controlli pubblici desktop/mobile, zero errori browser o invii di prova. [Rapporto canonico](https://github.com/reealpeppe/Socra-BE/blob/release/v3-20260919/docs/releases/2026-11-08-prelaunch-flow.md). Il seguito conserva il collaudo locale precedente alla pubblicazione.

Revisione richiesta da GR sui quattro mockup Davide, sugli errori di verifica da un altro browser e sulla commistione con la community ordinaria. Base FE di produzione `ba0051f`; fonte funzionale backend nella slice `fix/prelaunch-flow-20261108`. Lavoro locale, senza pubblicazione o modifica dei dati di produzione.

## Percorsi verificati

| Caso | Esito atteso |
|---|---|
| Accedi dalla home, senza parametri speciali | Login con credenziali |
| Registrati/Entra nella community | Prenotazione email, consensi separati e invitante quando valido |
| Nuova prenotazione nello stesso browser | Conferma verde, «Il primo passo è fatto», scelta subito/dopo |
| Ripetizione da altro browser, prima o dopo verifica | Rientro uniforme con login e alternativa per chi ha solo prenotato |
| Ingresso o pagina grazie da autenticato | Area personale, senza nuova registrazione |
| Link E01 prima del profilo | Registrazione con email provata, nessuna seconda verifica |
| E01/verifica finale dopo profilo provvisorio | Accesso nella stessa schermata e conferma ripresa senza riaprire l'email |
| Credenziali sbagliate, altro account, sessione scaduta | Prova conservata in memoria, nessuna verifica o associazione di un altro account |
| Token scaduto/revocato/corretto | Errore recuperabile, nessun successo simulato |
| Prova completata da un'altra scheda | Rilettura sola lettura; successo soltanto se prova ancora valida e indirizzo già confermato |
| URL matching, percorsi, profili, richieste, tour, wallet | Ritorno canonico all'area, nessun caricamento operativo |
| Esperienza/obiettivi/dati: learn, teach, both | Ritorno deciso dal primo passo mancante; nessun tour/matching anticipato |
| Modifica di un profilo già pronto | Ritorno all'area se ancora pronto |
| Email sbagliata prima di finire il profilo | Correzione inline nelle impostazioni e aggiornamento dell'indirizzo mostrato |
| Profilo pronto e verificato | Badge membro fondatore, barra completa, invito personale e conteggi effettivi |
| Apertura effettiva | Flussi ordinari conservati |

## Evidenze

- Build Next16.4.2 e TypeScript passati. ESLint: zero errori; due avvisi preesistenti nel modulo MFA non modificato.
- 163 test Node passati, comprendenti sicurezza BFF, cookie, Origin, limiti body, proxy e nuova politica dei percorsi.
- Backend:845 test passati/45 esclusi; il successivo affinamento della validazione del token è verificato nella suite mirata finale36/36. Nessuna migrazione.
- Prove reali locali: due percorsi completi desktop/mobile passati, dal modulo email fino a invito, accesso da un altro browser, ripetizione dell'indirizzo e blocco delle pagine operative. API FastAPI e database SQLite isolato effettivi, senza mock HTTP.
- 16 schermate lette da revisore indipendente: nessun difetto visivo bloccante. Aggiunta la barra completa richiesta dal mockup; nuova cattura attende l'idratazione del campo invito. Nessuna percentuale parziale inventata.
- Suite finale a concorrenza ridotta: 590 passati e 2 esclusi, senza errori o timeout. I 163 test Node e i 147 controlli sicurezza sono passati; build, TypeScript e lint senza errori. Il ciclo finale con API locali reali è passato su entrambi i dispositivi (2/2).

Evidenze riservate ignorate da Git in `.local/prelaunch-flow/`: log build/Node/sicurezza/browser, server QA, database locale e16 PNG. Il server QA usa solo loopback, credenziali fittizie e worker incapace di avviarsi: le code sono reali, nessuna email viene consegnata. Queste prove non attestano una consegna provider o l'esecuzione PostgreSQL della nuova slice.

Il server di sviluppo aveva un problema di connessione ai suoi asset/HMR; il collaudo effettivo usa la build di produzione. Le prime esecuzioni hanno rilevato sia difetti del prodotto sia fixture ormai incompatibili con i nuovi requisiti: pubbliche che simulavano già il login, etichette precedenti e attese anteriori al controllo della sessione. Gli aggiornamenti delle fixture conservano le verifiche funzionali e aggiungono casi dedicati ai nuovi comportamenti.

La revisione indipendente del codice ha individuato e fatto correggere il recupero della sessione scaduta su E01. La suite generale ha poi riprodotto una gara dopo login fallito: un controllo della sessione già superato dalla successiva invalidazione poteva sostituire il form con un errore. `SessionChangedError` conserva il rifiuto dei dati vecchi; il confine pubblico ritenta una sola lettura fresca. La regressione login fallito → nuovo tentativo → logout è passata su entrambi i dispositivi. La review successiva non ha rilevato altri blocchi.

Usate anche le [Web Interface Guidelines di Vercel](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), [Impeccable](https://impeccable.style/) e il metodo di [Superpowers](https://github.com/obra/superpowers). Controllati semantica dei comandi, etichette, nomi/autocomplete/spellcheck dei campi, focus visibile, stati di errore/caricamento, layout mobile e separazione dei token. Il detector meccanico ha restituito solo19 advisory sui token visivi; si conservano stile Socra e composizione Davide approvati. Non sono nuove dipendenze del sito.

Le prove con API simulate usano la preview3170 senza backend reale: i cookie fittizi non devono raggiungere il server QA. Alcune prime fixture lasciavano transitare richieste mentor-alerts/avatar, ottenendo401 e invalidando correttamente quei cookie; le fixture interessate sono state rese esplicite. Le prove reali usano invece3169/8169 e utenti QA dedicati. Il timeout di setup del run completo avveniva con elevata concorrenza dei browser; il ricontrollo isolato ha impiegato11 secondi senza cambi al prodotto.

## Esito finale della candidata

L’ultima esecuzione integrale, sulla stessa build e con due worker, ha concluso 590 test browser passati e2 esclusi in5,6 minuti. Nessun errore o timeout. Il precedente timeout era nel setup del browser e resta registrato nei log; anche il suo ricontrollo isolato era passato. Nessuna pubblicazione eseguita.
