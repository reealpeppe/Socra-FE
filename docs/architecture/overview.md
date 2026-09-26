# Architettura frontend Socra

Aggiornato: 26/09/2026. Proprietario dei confini tecnici locali; la [guida](../agent/README.md) risolve wiki e architettura condivisa del backend sul ref del task.

## Responsabilità e punti di ingresso

| Parte | Implementazione e responsabilità |
|---|---|
| App Router | [app](../../app), layout del route group `(community)` e [AppShell](../../components/AppShell.tsx): shell persistente e navigazione; gli URL non assumono il nome del route group |
| Sessione e BFF | [lib/server.ts](../../lib/server.ts) e [route API](../../app/api): token nel cookie HTTP-only, chiamate server-side al backend; la configurazione viene da `SOCRA_API_BASE_URL` |
| API client e cache | [lib/api.ts](../../lib/api.ts), [request-cache](../../lib/request-cache.ts): deduplica/cache e invalidazione coerenti con mutazioni, logout e cambio account. Il backend resta autorevole |
| Survey e obiettivo | [OnboardingSurvey](../../components/OnboardingSurvey.tsx), [onboarding](../../lib/onboarding.ts), [DiscussionPreferences](../../components/DiscussionPreferences.tsx): rendering/draft e scelte; cataloghi e regole della wiki/backend, non una nuova formula FE |
| Notifiche e proposte | Banner in [AppShell](../../components/AppShell.tsx), stile in [ProposalBanner.module.css](../../components/ProposalBanner.module.css) e route pertinenti: leggere stato operativo server; dismissione e lettura sono azioni distinte come da contratto |
| Date e stati asincroni | [lib/date.ts](../../lib/date.ts): applicare il contratto UTC delle API; distinguere 401 da indisponibilità temporanea e timeout |
| UI | [Ui.tsx](../../components/Ui.tsx), CSS locali e [globals.css](../../app/globals.css): primitive e layout responsive; evitare nuove copie di cataloghi o testi tecnici nel flusso utente |

## Vincoli e verifica

Stack e comandi sono in [package.json](../../package.json). Quando cambiano stack, sessione, cache o confini: aggiornare questa pagina; per un contratto condiviso aggiornare anche wiki 07 e, se la scelta lo richiede, ADR backend. Nessun valore di scoring client diventa autorevole.

Il codice di una slice account/email o registrazione non prova che sia pubblicato: verificare lo stato backend. Integrazioni, consenso, dati condivisi e permessi appartengono alle pagine wiki sul ref pertinente.

Test locali di riferimento: [auth/BFF](../../tests/auth-bff.test.mjs), [cache](../../tests/request-cache.mjs), [date](../../tests/date.test.mjs), [browser](../../tests/e2e). La configurazione e il runner distinguono mock e server esterno; i risultati browser con mock non verificano API/provider reali.
