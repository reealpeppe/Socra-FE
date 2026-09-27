# Socra frontend — ingresso per gli agenti

Socra è una community di apprendimento peer-to-peer sugli investimenti. Le regole V3 sono nella wiki di Socra-BE; livelli L0–L5 non pubblici e non usati per il matching.

1. Controlla `git status --short --branch` e preserva le modifiche di altre chat.
2. Leggi la [guida locale](docs/agent/README.md) per risolvere la fonte backend anche in un clone/worktree isolato. Verifica il ref del task: il checkout FE non prova quale versione sia in produzione.
3. Consulta soltanto l'area della mappa backend, le pagine wiki e il codice/test coinvolti; per sessione, shell, BFF o prestazioni usa anche l'[architettura FE](docs/architecture/overview.md).

Le regole funzionali hanno un solo proprietario nel backend. DOCX, vecchie specifiche di workspace e screenshot non prevalgono sulla wiki del ref pertinente, salvo nuova istruzione esplicita del responsabile prodotto. Se la fonte non è accessibile, recuperarla prima di cambiare comportamento; non inventare regole o duplicare la wiki nel FE.

Ogni cambiamento di comportamento/copy funzionale deve includere l'aggiornamento della pagina wiki proprietaria nel backend, dei contratti/permessi coinvolti e dei test pertinenti. Un cambiamento tecnico aggiorna il documento locale e, se necessario, contratto o ADR condiviso. Se la wiki non cambia, spiega perché. In un task BE/FE indica entrambi i ref e includi i documenti nei commit della slice.

Sessione HTTP-only e proxy server-side; nessun token in localStorage. Il backend resta autorevole su autorizzazioni, idoneità, ranking, saldo e lifecycle. Mantieni separati stato utente, cache e notifiche tra account; non esporre dati/algoritmi interni nel copy.

Ogni nuovo sviluppo rispetta gli [standard web](docs/security-baseline.md) e la baseline wiki12 backend: Origin esatto, JSON/body limitati, errori no-store, bearer solo nel cookie, CSP/hydration e audit dipendenze. Le route auth usano handler dedicati; nessun bypass dal proxy generico. Verifica `npm run test:security` insieme ai controlli pertinenti; eccezioni motivate e provate.

Usa i comandi pertinenti di [package.json](package.json) e la guida locale. Test mock, API vere e provider reale sono prove diverse. Aggiorna la consegna/stato quando necessario; nessun deploy implicito e nessun ampliamento di call/email o altra integrazione fuori scope.
