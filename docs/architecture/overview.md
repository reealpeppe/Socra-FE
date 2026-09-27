# Architettura frontend Socra

Aggiornato: 27/09/2026. Proprietario dei confini tecnici locali; la [guida](../agent/README.md) risolve wiki e architettura condivisa del backend sul ref del task.

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

Slice locale `feature/registration-identity-20260927`, non pubblicata: [EmailVerificationNotice](../../components/EmailVerificationNotice.tsx) nella shell e [EmailVerificationGate](../../components/EmailVerificationGate.tsx) prima delle pagine operative. Il gate attende `/auth/me`, impedisce il montaggio delle pagine matching/profili altrui e si aggiorna su refresh sessione/ritorno alla scheda. La survey conserva il flusso e le bozze. La shell non carica richieste matching per account non verificati. Permessi effettivi restano nel backend; wiki 09/06/07 e schema locale della wiki 13 possiedono le regole.

[Correzione email](../../app/api/auth/email/route.ts) usa handler auth dedicato, cookie HttpOnly, Origin/JSON/16KiB/no-store; nessun ampliamento del proxy auth generico. Il client invalida la cache e aggiorna sessione dopo correzione/conferma; nessun valore di password/nomi privati persiste nel browser. Il form registra sei campi e spiega la visibilità; lo username è l'unica identità condivisa.

[Standard web obbligatori](../security-baseline.md): guardie Origin/JSON/body/cache centralizzate, auth dedicata e token solo cookie; CSP a nonce per richiesta e layout dinamico. Niente cache CDN condivisa HTML/RSC, asset statici conservano cache framework. Cambi a questi confini richiedono browser production e regressioni BFF, non bypass silenziosi.

Stack e comandi sono in [package.json](../../package.json). Quando cambiano stack, sessione, cache o confini: aggiornare questa pagina; per un contratto condiviso aggiornare anche wiki 07 e, se la scelta lo richiede, ADR backend. Nessun valore di scoring client diventa autorevole.

La wiki 13 backend (`docs/wiki/13-architettura-schemi.md`) possiede gli schemi cloud, layer e componenti. Modifiche FE a componenti, collegamenti, confini o attivazioni richiedono aggiornamento degli schemi nello stesso lavoro, con data/ref/evidenze e proposte separate dalla produzione; se invariati, motivare il controllo nella consegna/PR. Recuperare la fonte come da [guida](../agent/README.md), senza copiarla nel FE.

Il codice di una slice account/email o registrazione non prova che sia pubblicato: verificare lo stato backend. Integrazioni, consenso, dati condivisi e permessi appartengono alle pagine wiki sul ref pertinente.

Test locali di riferimento: [auth/BFF](../../tests/auth-bff.test.mjs), [cache](../../tests/request-cache.mjs), [date](../../tests/date.test.mjs), [browser](../../tests/e2e). La configurazione e il runner distinguono mock e server esterno; i risultati browser con mock non verificano API/provider reali.

Monitoraggio privato: route `/admin/monitoraggio`, MFA React e BFF dedicato con Origin canonico/16KiB, cookie HttpOnly/Secure/Strict massimo8h e grant legato alla sessione backend. Cookie login allineato a expires_in (massimo8h); resto utenti invariato. Proxy generico non inoltra monitoring. HTML statico della sola dashboard usa CSP script-src self per script locali; MFA/resto app conserva nonce strict-dynamic. Regole nella wiki11 backend, contratto wiki07, ADR-private-monitoring-20260926.

Stato monitoraggio: pubblicato il27/09 su `release/v3-20260919`, FE `3d6cb79` / BE `71c09fa`; rapporto canonico backend `docs/releases/2026-09-27-monitoring-production.md`. Aggiornamenti documentali successivi non cambiano il codice verificato.
