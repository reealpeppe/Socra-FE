# Architettura frontend Socra

Aggiornato: 06/10/2026. Proprietario dei confini tecnici locali; la [guida](../agent/README.md) risolve wiki e architettura condivisa del backend sul ref del task.

La V4 è pubblicata dal 03/10 su `release/v3-20260919`: BE `f53226aab35c93722c0fad8dbee4efef31d66e28`, FE `996fb361167132b7667a4fc4df79626159a0b411`. Backend e frontend corretto verificati: il clipping mobile con username lunghi rilevato nella prima review live è stato corretto e ricollaudato il 03/10. Deployment ed evidenze nel [rapporto backend del 03/10](https://github.com/reealpeppe/Socra-BE/blob/release/v3-20260919/docs/releases/2026-10-03-skills-production.md). Stato operativo e regole restano nel backend; registrazione/verifica email, confine BFF, CSP e monitoraggio sono preservati.

## Responsabilità e punti di ingresso

| Parte | Implementazione e responsabilità |
|---|---|
| App Router | [app](../../app), layout del route group `(community)` e [AppShell](../../components/AppShell.tsx): shell persistente e navigazione; gli URL non assumono il nome del route group |
| Sessione e BFF | [lib/server.ts](../../lib/server.ts) e [route API](../../app/api): token nel cookie HTTP-only, chiamate server-side al backend; la configurazione viene da `SOCRA_API_BASE_URL` |
| API client e cache | [lib/api.ts](../../lib/api.ts), [request-cache](../../lib/request-cache.ts): deduplica/cache e invalidazione coerenti con mutazioni, logout e cambio account. Il backend resta autorevole |
| Survey e obiettivo | [OnboardingSurvey](../../components/OnboardingSurvey.tsx), [onboarding](../../lib/onboarding.ts), [DiscussionPreferences](../../components/DiscussionPreferences.tsx): rendering/draft e scelte; cataloghi e regole della wiki/backend, non una nuova formula FE |
| Attività e matching per capacità (V4 pubblicata il 03/10/2026) | [SkillSurvey](../../components/SkillSurvey.tsx), [SkillGoalForm](../../components/SkillGoalForm.tsx), [SkillSummary](../../components/SkillSummary.tsx), [SkillFeedback](../../components/SkillFeedback.tsx), [SkillPublicProfile](../../components/SkillPublicProfile.tsx), [SkillMentorPreferences](../../components/SkillMentorPreferences.tsx): catalogo autenticato `/skills/catalog`, tipi condivisi, sottoinsieme concordato e snapshot dal backend. [SkillCatalogBoundary](../../components/SkillCatalogBoundary.tsx) usa il ramo storico solo su 404 esplicito; errori temporanei mantengono una vista di errore recuperabile |
| Notifiche e proposte | Banner in [AppShell](../../components/AppShell.tsx), stile in [ProposalBanner.module.css](../../components/ProposalBanner.module.css) e route pertinenti: leggere stato operativo server; dismissione e lettura sono azioni distinte come da contratto |
| Date e stati asincroni | [lib/date.ts](../../lib/date.ts): applicare il contratto UTC delle API; distinguere 401 da indisponibilità temporanea e timeout |
| UI | [Ui.tsx](../../components/Ui.tsx), CSS locali e [globals.css](../../app/globals.css): primitive e layout responsive; evitare nuove copie di cataloghi o testi tecnici nel flusso utente |

## Vincoli e verifica

Registrazione pubblicata il27/09, FE `f09e54a` / BE `0f4201c`, rapporto canonico backend `docs/releases/2026-09-27-registration-identity-production.md`: [EmailVerificationNotice](../../components/EmailVerificationNotice.tsx) nella shell e [EmailVerificationGate](../../components/EmailVerificationGate.tsx) prima delle pagine operative. Il gate attende `/auth/me`, impedisce il montaggio delle pagine matching/profili altrui e si aggiorna su refresh sessione/ritorno alla scheda. La survey conserva il flusso e le bozze. La shell non carica richieste matching per account non verificati. Permessi effettivi restano nel backend; wiki 09/06/07 e schemi della wiki 13 possiedono le regole.

[Correzione email](../../app/api/auth/email/route.ts) usa handler auth dedicato, cookie HttpOnly, Origin/JSON/16KiB/no-store; nessun ampliamento del proxy auth generico. Il client invalida la cache e aggiorna sessione dopo correzione/conferma; nessun valore di password/nomi privati persiste nel browser. Il form registra sei campi e spiega la visibilità; lo username è l'unica identità condivisa.

[Standard web obbligatori](../security-baseline.md): guardie Origin/JSON/body/cache centralizzate, auth dedicata e token solo cookie; CSP a nonce per richiesta e layout dinamico. Niente cache CDN condivisa HTML/RSC, asset statici conservano cache framework. Cambi a questi confini richiedono browser production e regressioni BFF, non bypass silenziosi.

Stack e comandi sono in [package.json](../../package.json). Quando cambiano stack, sessione, cache o confini: aggiornare questa pagina; per un contratto condiviso aggiornare anche wiki 07 e, se la scelta lo richiede, ADR backend. Nessun valore di scoring client diventa autorevole.

La wiki 13 backend (`docs/wiki/13-architettura-schemi.md`) possiede gli schemi cloud, layer e componenti. Modifiche FE a componenti, collegamenti, confini o attivazioni richiedono aggiornamento degli schemi nello stesso lavoro, con data/ref/evidenze e proposte separate dalla produzione; se invariati, motivare il controllo nella consegna/PR. Recuperare la fonte come da [guida](../agent/README.md), senza copiarla nel FE.

Il codice di una slice account/email o registrazione non prova che sia pubblicato: verificare lo stato backend. Integrazioni, consenso, dati condivisi e permessi appartengono alle pagine wiki sul ref pertinente.

La survey per capacità conserva bozze `skill_flow` separate per account; la rivalutazione recupera il profilo corrente e una bozza locale soltanto della stessa versione. Le capacità non sono inferite dal modello storico. La disponibilità globale rimane distinta dalle attività offerte. Richieste da matching, ricerca apprendisti e profilo condividono [AlignmentDialog](../../components/AlignmentDialog.tsx); i dettagli leggono etichette e attività concordate immutabili. I commenti pubblici sono un campo separato dalle note private e vengono mostrati soltanto dal DTO pubblico autorizzato. Le prove browser della slice sono in [skills-v4.spec.ts](../../tests/e2e/skills-v4.spec.ts); i mock non sostituiscono il collaudo delle API reali.

La survey V4 invia soltanto capacità conosciute e offerte: omette `section_d`, lasciandone la conservazione al backend. [PersonalContext](../../components/PersonalContext.tsx) è il passo facoltativo successivo al salvataggio dell’esperienza ed è accessibile anche nelle impostazioni; salva le cinque risposte esplicite con `PATCH /skills/me/context`; un profilo assente invita a completare l’esperienza senza creare onboarding dal contesto. Dopo il salvataggio dell’esperienza, il contesto può essere compilato oppure saltato senza valori impliciti; la rivalutazione torna poi alla dashboard con conferma temporanea separata per account. Le operazioni asincrone e le bozze della survey sono invalidate su unmount e cambio sessione prima di ogni invio accodato.

[SkillPreparation](../../components/SkillPreparation.tsx) rende `known_count/total_count`, `preparation_percent` e `confirmed_count` dal profilo pubblico; l’elenco delle offerte resta distinto. Nella rivalutazione le barre descrivono il profilo già salvato, mentre il form modifica la nuova selezione. Dashboard e lista percorsi leggono gli obiettivi concordati dallo snapshot. Le schede matching mostrano `match_score` come compatibilità; la copertura è un dettaglio espandibile per scegliere il sottoinsieme da concordare, senza percentuali derivate sul client né deduzioni sulla disponibilità temporale.

La dashboard attende anche `/profiles/{id}` prima di uscire dal caricamento principale: un profilo ancora in corso non è un elenco vuoto. Un errore del profilo viene segnalato nella scheda esperienza e nel recupero generale; «Riprova» include una nuova lettura del profilo. Crediti restano indipendenti. I confini, gli endpoint e gli schemi condivisi della wiki 13 non cambiano. Conferma dell'ultima offerta, layout email e prove successive al rilascio V4 sono nel [rapporto backend del 04/10](https://github.com/reealpeppe/Socra-BE/blob/release/v3-20260919/docs/releases/2026-10-04-mentor-availability.md).

Test locali di riferimento: [auth/BFF](../../tests/auth-bff.test.mjs), [cache](../../tests/request-cache.mjs), [date](../../tests/date.test.mjs), [browser](../../tests/e2e). La configurazione e il runner distinguono mock e server esterno; i risultati browser con mock non verificano API/provider reali.

Monitoraggio privato: route `/admin/monitoraggio`, MFA React e BFF dedicato con Origin canonico/16KiB, cookie HttpOnly/Secure/Strict massimo8h e grant legato alla sessione backend. Cookie login allineato a expires_in (massimo8h); resto utenti invariato. Proxy generico non inoltra monitoring. HTML statico della sola dashboard usa CSP script-src self per script locali; MFA/resto app conserva nonce strict-dynamic. Regole nella wiki11 backend, contratto wiki07, ADR-private-monitoring-20260926.

Stato monitoraggio: pubblicato il27/09 su `release/v3-20260919`, FE `3d6cb79` / BE `71c09fa`; rapporto canonico backend `docs/releases/2026-09-27-monitoring-production.md`. Aggiornamenti documentali successivi non cambiano il codice verificato.

## Verifica visiva dei flussi

La [suite UX](../testing/ux-review.md) cattura desktop/mobile con API locali vere e
richiede una review LLM indipendente su immagini e azioni. Il gate verifica
completezza, esito e attualità delle evidenze; i test tecnici non assegnano il
giudizio semantico.

Le griglie di dashboard e impostazioni contengono anche username lunghi e indirizzi email senza spazi: le colonne possono restringersi e il testo va a capo. Le regressioni browser controllano i rettangoli degli elementi e delle righe di testo rispetto al viewport e agli antenati che tagliano il contenuto; il solo `scrollWidth` non rileva un overflow nascosto. La correzione non cambia schede, collegamenti, permessi o contratti della wiki 13.

## Ricerca e profilo multitema

`MultiGoalForm` salva tutte le selezioni in una sola richiesta idempotente; la revisione del percorso conserva la forma singola e riparte dalla sua origine. `AggregateMatching` condivide la pagina nei due versi, scarta pagine su cambio sessione e usa `GoalMatchChoices` per una proposta esplicita. `PersonalContext` è un form separato dopo l’esperienza e nelle impostazioni, con rilettura su risultato incerto e retry. `ProfileCompletionBanner` usa esclusivamente DTO proprietari. `MentorOfferHelp` gestisce la disclosure indipendentemente dalle selezioni. Il profilo pubblico usa la ricerca aggregata con selettore persona per evitare dipendenza dalla prima pagina. Contratti e regole restano nel backend.
