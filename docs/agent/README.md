# Entrare nel contesto Socra dal frontend

Aggiornato: 26/09/2026. [Istruzioni](../../AGENTS.md) · [Architettura locale](../architecture/overview.md)

Il frontend è un repository autonomo. La fonte condivisa di prodotto e orientamento è [Socra-BE](https://github.com/reealpeppe/Socra-BE), cartelle `docs/agent` e `docs/wiki`. Questo documento spiega come risolverla: non ne copia regole, stato o formule.

## Con backend disponibile

Nel workspace originale il backend è `../backend`. Controllare prima il branch e le modifiche locali in ciascun repository. Leggere `docs/agent/project-state.md` e `docs/agent/context-map.md` del backend, poi solo le pagine proprietarie pertinenti.

Un worktree FE può non avere `../backend`. Localizzare i repository configurati per il task; `git worktree list` e `git rev-parse --path-format=absolute --git-common-dir` aiutano a identificare i checkout esistenti. Non usare un percorso assoluto del PC originale come requisito del progetto.

## Clone/worktree frontend isolato

1. Identificare il ref backend collegato al task. Per produzione il branch documentato è `release/v3-20260919`; per una feature leggere il contratto sul branch/SHA della slice, non assumere che il branch FE omonimo sia sufficiente.
2. Accedere al repository backend con gli strumenti Git/GitHub disponibili. Per un **branch/tag**, da una directory di lavoro scelta per il task: `git clone --single-branch --branch <branch-o-tag> https://github.com/reealpeppe/Socra-BE.git socra-backend-context`. Per uno **SHA**, clonare senza `--branch`: `git clone https://github.com/reealpeppe/Socra-BE.git socra-backend-context`, poi `git -C socra-backend-context checkout --detach <sha-del-task>`. Se il commit manca, recuperare prima il branch che lo contiene con `git -C socra-backend-context fetch origin <branch>`; se la fonte non è ancora committata/pubblicata, serve il checkout o una consegna versionata della slice. Non sostituire lo SHA con la HEAD e non cambiare il checkout FE o un backend già in uso.
3. Leggere la wiki sul ref scelto. Se la guida agenti non è ancora presente su quel ref, recuperarla dal commit del riordino indicato nel rapporto di consegna; la guida orienta la lettura, ma **le regole restano quelle del ref del task**.
4. Se non è possibile accedere alla fonte, segnalare la dipendenza concreta e continuare solo il lavoro che non richiede quelle regole. Nessun fallback silenzioso a vecchi DOCX o a `main`.

La [wiki di release](https://github.com/reealpeppe/Socra-BE/tree/release/v3-20260919/docs/wiki) è un punto di consultazione esplicito, non il contratto automatico di ogni feature. I branch possono cambiare: riportare lo SHA usato nella consegna. Un export o copia temporanea della wiki deve indicare ref/data e non diventare un secondo canonico.

## Cosa leggere e aggiornare

Per funzionalità: mappa backend → pagina wiki proprietaria → componenti/route e test FE pertinenti. Per layout/copy senza cambiamenti di regole: componenti e [architettura locale](../architecture/overview.md), più pagina funzionale solo se il testo esprime un requisito.

Quando cambia una regola o un contratto, aggiornare il documento backend nello stesso lavoro e identificare entrambe le revisioni nella consegna. Se il lavoro è incompleto, usare il template backend `docs/agent/task-intake-template.md`; non lasciare approvazioni e dipendenze soltanto nella chat.

## Comandi

Fonte: [package.json](../../package.json). Da root FE: `npm run lint`, `npm run typecheck`, `npm run build`; browser `npm run test:e2e`. Per un subset usare il runner disponibile e la [configurazione Playwright](../../playwright.config.ts). I test Node esistenti sono in [tests](../../tests); invocare solo quelli pertinenti con `node --test tests/<file>.mjs`.

Il [runner E2E](../../scripts/run-e2e.mjs) e Playwright distinguono avvio locale e server esterno. Non puntare test mutativi alla produzione per errore.

Con la guida backend disponibile, verificarne anche questi ingressi: `python <backend>/scripts/check_agent_docs.py --frontend <frontend>`. Il validatore non richiede dipendenze applicative e non accede alla rete o ai DB; gli archivi non vengono trattati come istruzioni correnti.
