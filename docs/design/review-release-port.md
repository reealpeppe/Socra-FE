# Disposition

Nota del coordinatore 11/10: questo rapporto documenta il porting precedente alla correzione della dipendenza dev. La proposta di proroga non è stata approvata né applicata. Catena vulnerabile ed eccezione sono ora rimosse; il verdetto successivo è nella [review finale](review-lint-remediation.md).

**SHIP grafica sul candidato isolato; confine porting PASS. Pubblicazione HOLD per la decisione sull’eccezione dev scaduta.** Review del candidato `output/frontend-graphics-only-20261011`, branch `release/grafite-miele-graphics-only-20261011`, HEAD `4198c0d`, contro produzione `5933b7bfa3ab068ff80c6b7457ab45a38ffb276c`, 11/10/2026. Il coordinatore comunica l’esito finale E2E: 328 passed, 1.8 minuti, sessione 7524, exit 0.

Il precedente checkout `output/frontend-release-grafite-miele` contiene lavoro parallelo ai crediti: **non è il candidato deployabile**. Le sue prove non autorizzano a pubblicarne il working tree. Il nuovo checkout risolve il problema di isolamento rilevato dalla review precedente.

# Findings concreti

| Before | Nuovo candidato verificato | Valutazione |
| --- | --- | --- |
| Checkout precedente ampliato con modifiche a crediti, richieste, wallet, alignment e tipi; boundary FAIL. | Rispetto a HEAD modificati soltanto sei file: Dashboard CSS, due documenti FE, package/lock e boundary. Nessun diff rispetto a produzione su lib, AlignmentDialog, test, API, middleware/proxy/config o gate audit. `lib/credits.ts` e `credit-advance.spec.ts` assenti; nessuna occorrenza dei nuovi simboli/copy negli ambiti coinvolti. | **Problema di isolamento chiuso nel nuovo candidato.** L’altra chat conserva il proprio lavoro nel vecchio checkout. |
| Regole `.goalDetails` inizialmente perse nel porting. | Separatore/padding e `summary min-height:44px` presenti alle righe 98–99. | Finding chiuso; disclosure multiobiettivo di produzione preservati. |
| Layout e alignment di produzione. | `force-dynamic`, `PerformanceDiagnostics`, `.alignmentDialog`, `.alignmentForm`, salvaguardie nomi/details/button e wrapping del saluto conservati. | Nessuna perdita statica rilevata nei conflitti esaminati. |
| Next 16.3.6 con resto del grafo produzione. | Pin Next 16.3.8, env e otto SWC; il confronto strutturale del boundary consente soltanto queste modifiche e conserva ogni altro record lock. | Aggiornamento confinato; React, ESLint e Sharp preservati. Nessun bypass del gate dev. |

Eseguito sul **nuovo checkout** `node scripts/verify-design-boundary.mjs`: **PASS, 53 file**. Dashboard dataflow, azioni e copy invariati salvo disclosure ETF autorizzata; altri TSX corrispondono semanticamente alla produzione. Merge-base esattamente `5933b7b`; presenti soltanto i tre commit grafici sopra la base, nessuna integrazione dello snapshot feature `455b5a2`.

Backend isolato: HEAD `8bf12a2`, branch `docs/grafite-miele-graphics-only-20261011`; modifica wiki 12 e nuovo rapporto release, nessuna modifica applicativa visibile nello status. Questi due documenti non cambiano il runtime backend.

`git diff --check 5933b7b`: resta una riga vuota finale aggiuntiva nel CSS dashboard, osservazione minore senza effetto applicativo.

# Limiti

Esaminate **tutte le dieci catture fresche rigenerate qui**: quattro PNG `release-home-final` e sei `release-dashboard-final`, desktop 1440×1000 e mobile 390×844. Home tipografica, CTA, sezioni e footer conservano la composizione approvata; nessun taglio visibile. Dashboard: Impara grafite distingue l’azione dalle card secondarie, pulsante miele riconoscibile, obiettivi multipli separati. Nome lungo mobile wrappa senza uscire dai confini. Banner 0/5 conservato intenzionalmente; introduce il completamento del profilo senza nascondere la logica esistente. La CTA mentor resta interamente visibile sopra la navbar, circa y=697–751, pur più in basso del campione senza banner. Nessun nuovo P0/P1 visivo rilevato, né ulteriore fix/recapture richiesto.

Report freschi: home su loopback **3198**, due check senza errori; dashboard due check senza errori. Manrope attivo, contenuto largo quanto viewport. ETF inizialmente chiuso e apribile/chiudibile con tastiera; stress sedici notifiche, otto item renderizzati come previsto, zero figli fuori pulsante. Contenimento confermato nelle immagini desktop/mobile. Home dalla build locale; dashboard replay GET di DTO backend isolati e notifiche sintetiche: prova di rendering, non collaudo end-to-end di API/provider reali.

Nuovi risultati sul checkout isolato **comunicati dal coordinatore**: `npm ci` PASS, build Next 16.3.8/TypeScript PASS, 112 security PASS, 8 gate UX PASS, lint zero errori/due warning storici, boundary 53 PASS, runner catture due test PASS. Il reviewer ha esaminato direttamente le immagini, i report e lo status ancora limitato ai sei file. **Suite completa E2E: 328 passed in 1.8 minuti, sessione 7524, exit 0**, esito comunicato dal coordinatore; il reviewer non ha eseguito questi test. I pass del checkout precedente non vengono trasferiti.

Audit aggiornato: runtime zero riferito dal coordinatore; summary locale letto conferma che il gate completo fallisce soltanto per `EXPIRES=2026-10-10T00:00:00Z`. Proroga al 18/10 ancora in attesa di decisione umana esplicita, non applicata. Nessuna pubblicazione attestata. Nessuna modifica a UI, gate, dipendenze o documenti canonici dal reviewer: aggiornato soltanto questo rapporto nel nuovo checkout.
