# Anticipo crediti — verifica frontend locale 11/10/2026

Base FE `4198c0d`, branch `release/grafite-miele-20261011`; backend base `8bf12a2`, branch `docs/grafite-miele-release-20261011`. Le regole e i contratti proprietari sono nelle wiki 05/07/08 di Socra-BE sul ref della funzione. [Architettura frontend](../architecture/overview.md) · [Test mirati](../../tests/e2e/credit-advance.spec.ts) · [Flusso API reali](../../tests/e2e/credit-advance-live.spec.ts).

Un solo saldo «Crediti disponibili»: numero miele e testo «Anticipato» quando il DTO lo permette; spiegazione nel saldo dopo l'utilizzo, indicazione sintetica sulla dashboard, avviso prima dell'accettazione. Nessun box «Margine utilizzato» né calcolo dell'idoneità sul client. I movimenti distinguono utilizzo e compensazione. Conferma proposte rilegge il wallet; un errore di lettura impedisce di confermare con dati non verificati.

## Verifiche

156 E2E desktop/mobile passati: wallet, dashboard, proposte e matching multitema/percorsi; mock aggiornati al nuovo contratto. 112 test sicurezza BFF/Origin/monitoraggio/dipendenze passati. Build Next.js e TypeScript riusciti; ESLint senza errori, tre warning preesistenti. Questi controlli sono separati dalle prove con API reali.

Flusso reale riuscito in entrambe le viewport su fixture backend esclusiva e integrazioni disabilitate: login dal form, identità rilette, saldo zero con 1 anticipato, click dashboard→wallet, conferma/apertura percorso, anticipo utilizzato, feedback singolo senza reward, feedback bilaterale con compensazione e saldo finale zero. La fixture prepara le chiusure del percorso mentor: non verifica un provider call. Due run conservati, senza sostituire o cancellare dati condivisi.

Evidenze finali locali `output/playwright/credit-advance/navigation-20261011/`: 24 PNG (pagina intera e viewport per sei stati e due layout), due JSON delle azioni, `manifest.json` con hash e build `9F-ycPLBbaruTz82yP9jw`, `review.json` del reviewer LLM indipendente. Non leggere l'implementazione prima della valutazione, come prescritto dalla [procedura UX](ux-review.md). La prima review registrava una lacuna di evidenza sul click dashboard→wallet; il secondo run include quel passaggio osservato. Review finale `/root/review_advance_visual`: **passed, 20/20**, cinque criteri a 2/2 per viewport e nessun difetto blocking/minor nel perimetro. Letti tutti i 24 PNG originali e verificati 26 hash delle evidenze. Il corpo della cattura desktop dashboard è ancora in caricamento nel PNG lungo; la cattura viewport mostra il risultato caricato. La tessera crediti è visibile in entrambi e il click è documentato. La review riguarda questa funzione.

Questa fase locale non includeva una pubblicazione. I due layout e le API locali non attestano ogni dispositivo, consegna email o servizi esterni. Il rapporto backend `docs/testing/credit-advance-2026-10-11.md` possiede i dettagli di migrazione/concorrenza e i limiti prodotto; nessuna regola duplicata qui.

## Pubblicazione successiva autorizzata

Il collaudo locale sopra resta storico. GR autorizza poi il deploy dell’11/10: frontend con grafica/sicurezza/prestazioni correnti conservate, backend PostgreSQL migrato e browser HTTPS desktop/mobile verificati. [Ref, CI, backup, deployment, dati, review e limiti della pubblicazione](https://github.com/reealpeppe/Socra-BE/blob/release/v3-20260919/docs/releases/2026-10-11-credit-advance.md).
