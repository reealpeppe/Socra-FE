# Contatto pubblico Socra — 17/10/2026

## Perimetro e fonti

Approvati dal responsabile: indirizzo `info@socra.it`, creazione della casella Aruba e sottosezione **Contatti** nel footer condiviso delle pagine pubbliche. Fonte funzionale: `Socra-BE/docs/wiki/01-community.md`, aggiornata nello stesso lavoro. Basi release recuperate con fetch: FE `457eae9deaf4e0274058b1241d28ec9b0632e204`, BE `b39abfbbdbfc912205b3c045747ae2626da44d6f`. Branch di lavoro: FE `fix/public-contacts-20261017`, BE `docs/public-contacts-20261017`; checkout originari e lavoro delle altre chat preservati.

`PublicFooter` riusa gli stili esistenti e presenta il testo approvato con un collegamento `mailto:info@socra.it`. Il click apre il programma di posta; nessun form, invio dal sito, tracciamento o nuovo dato persistito. La wiki 07 e i contratti/permessi non cambiano. Gli schemi della wiki 13 sono stati verificati: componenti applicativi, collegamenti cloud, provider delle email operative, confini e responsabilità restano invariati. Il contatto manuale Aruba non è un’integrazione del backend. Nessuna migrazione o modifica architetturale; nessun ADR necessario.

## Aruba

Accesso postmaster completato dal responsabile. Creata la casella reale `info@socra.it`, profilo “Socra — Informazioni e collaborazioni”; password inserita e confermata direttamente dal responsabile. Aruba ha mostrato “La casella di posta è stata creata” e il nuovo indirizzo nell’elenco, insieme a postmaster e supporto. Nessuna modifica al supporto o ai DNS, nessun servizio aggiuntivo acquistato. Inoltro Gmail non configurato; nessun messaggio di prova inviato e nessuna prova di consegna/ricezione reale.

[Conferma Aruba](public-contacts-20261017/aruba-info-created.jpg).

## Verifiche locali

- `npm ci --no-audit --no-fund`: completato senza modifiche al lockfile.
- `npm run build` e `npm run typecheck`: superati.
- `npm run lint`: zero errori; due warning preesistenti in `components/MonitoringMfa.tsx` per `location.assign`, estranei al footer.
- `npm run test:security`: 108 verifiche superate.
- `PLAYWRIGHT_PORT=3167 node node_modules/@playwright/test/cli.js test tests/e2e/public-content.spec.ts --workers=2`: 18/18 test esistenti superati su desktop e mobile. Nessun nuovo test che duplichi il markup per questo cambiamento di copy/link.
- Validatore backend `scripts/check_agent_docs.py --frontend ../public-contacts-frontend-20261017`: 33 documenti BE e 5 ingressi FE, zero errori. Eseguito con il runtime Python disponibile, perché l’alias `python` di sistema non risolveva l’interprete.
- `git diff --check`: superato nei due repository.

Browser sulla build locale a `http://127.0.0.1:3168/`, viewport desktop 1440×1000 e mobile 390×844. Regione accessibile “Contatti”, intestazione h2 e destinazione `mailto:info@socra.it` osservate; larghezza documento/scroll 1425/1425 e 375/375 rispettivamente, senza overflow orizzontale. Nessun click che avvii un client di posta esterno o invii messaggi. Il footer è statico e pubblico: non richiede fixture autenticate o nuove chiamate API. Queste prove non attestano il funzionamento dei flussi backend.

[Desktop](public-contacts-20261017/contacts-desktop.jpg) · [Mobile](public-contacts-20261017/contacts-mobile.jpg).

## Review indipendenti e stato

Revisione statica indipendente del diff: nessun rilievo azionabile. Seconda review LLM indipendente, su immagini originali senza lettura preventiva del codice: **PASS**, testo leggibile, raggruppamento chiaro e coerenza con il footer; nessun clipping, sovrapposizione o troncamento su entrambe le viewport. La review visiva copre soltanto il footer pubblico, non l’intera suite UX dei flussi community.

Casella creata e footer implementato/verificato localmente. Nessun push, merge o deploy in questo lavoro; il sito pubblico non è stato modificato. La pubblicazione richiede l’autorizzazione prevista dagli ingressi del repository.
