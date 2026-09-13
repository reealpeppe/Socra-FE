# V3 — frontend di collaudo online

13 settembre 2026. Branch `feature/dynamic-topic-matching-v3-fe`.
Fonte funzionale: `docs/product/dynamic-competence-matching-v3-proposal.md`
nel workspace Socra. Backend: `feature/dynamic-topic-matching-v3`.

## Scope

- Design corrente conservato; catalogo obiettivi dal backend senza filtro globale L.
- Livelli pubblici rimossi; `/livelli` rimanda alla guida.
- Messaggio privato 20–500 caratteri nelle richieste e proposte, visibile alla coppia.
- Feedback sul grado di approfondimento del percorso.
- Ordine suggerimenti rispettato. Esposizione confermata dopo almeno il 50% della
  scheda per 1 secondo continuo, con documento visibile, in dashboard e nelle due ricerche.
- Alternative di obiettivo con conferma esplicita e idempotenza.
- Rivalutazione survey, verifica esperienza esterna e decisione admin dedicata.

## Ambiente

Railway `confident-truth` / `test-v3`:
`https://socra-fe-test-v3.up.railway.app`.
SQLite separato su volume; segreto di sessione indipendente. Nessun merge in main.
Accessi sintetici documentati solo localmente; non usare dati personali reali.

## Limiti

Meet e transcript disabilitati. La chiusura di nuovi percorsi richiede comunque
una prima call verificata: nessun bypass introdotto. Verifica esterna manuale.
Endpoint retention disponibile; schedulazione da completare prima del rilascio
stabile. Privacy/termini restano bozze, non autorizzazione al lancio pubblico.

## Verifica e rollback

Build/TypeScript/lint; 106 casi della suite FE esistente più 6 casi V3 su
visibilità, proposta inversa e alternativa esplicita. Le API nei test FE sono mock.
Il collaudo remoto e i limiti sono tracciati in `docs/testing/v3-online-review-2026-09-13.md`
del workspace. Checkpoint precedente FE `ef1b65d`, backend prima di V3 `f066624`.
Usare trigger specifici dell'ambiente: `service source connect` modifica il
collegamento comune del servizio, anche negli altri ambienti.
