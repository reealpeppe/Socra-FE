# Disposition

**SHIP per questa correzione circoscritta.** Il feedback umano prevale sul precedente SHIP: Impara e Condividi erano concorrenti. Ora emerge un primo passo riconoscibile. Nessun P0/P1 rilevato; non equivale a un’approvazione generale della dashboard.

# Material findings — Before/After/Why

| Before | After | Why |
| --- | --- | --- |
| Card bianche simili, CTA miele concorrenti. | Impara occupa tutta la larghezza in grafite; tre card bianche secondarie; CTA mentor secondaria outline. | L’occhio individua un centro operativo senza leggere tutte le sezioni. Grafite e miele acquistano una funzione concreta. |
| Per trovare il mentor bisognava attraversare definizione e obiettivi. | CTA miele ampia e isolata; su mobile azione prima degli obiettivi. | Chi entra vede cosa fare. Empty, active e review mantengono questa priorità con verbi specifici. |
| Definizione ETF sempre visibile. | «Cos’è un ETF?» apre un details inizialmente chiuso. | Rispetta la scelta umana e riduce lettura obbligatoria; l’aiuto resta riconoscibile. |
| «Nuova» usciva dai pulsanti e invadeva la riga successiva. | Testo e badge stanno nello stesso pulsante, con altezza naturale e senza compressione flex. | Difetto chiuso visivamente a desktop/mobile/125%; i bounding box sono coerenti anche all’intermedio. |
| Crediti occupavano una riga separata prima dell’azione mobile. | Crediti accanto al saluto; CTA circa 69 px più in alto, a y=448. | Riduce lo spazio iniziale senza cambiare copy. L’azione rimane evidente e interamente sopra la barra di navigazione. |

# Checks

Esaminati entrambi gli allegati umani, dashboard desktop/mobile viewport/full, intermedio/125%, notifiche desktop/mobile/125%, aiuto desktop/mobile, sei stati empty/active/review. Codice: details chiuso e contenimento flex confermati.

Ricontrollate nuove catture mobile dashboard/aiuto e report rigenerato. `dashboard-priority-final/report.json`: 18 viste, 10 check, zero errori; quattro serie di bounding box senza figli fuori pulsante; destinazioni dei sei stati coerenti. Persistiti Enter che apre/chiude details, Escape che restituisce focus alla campanella, CTA nel primo viewport e nessun overflow orizzontale. Aiuto chiuso inizialmente, visibile all’apertura: definizione mobile a y=446–486, libera dalla barra; confermata nella cattura scorsa.

# Limits

Default e notifiche: API locale reale su copia DB, login BFF reale; sei varianti: API mock. Nessuna prova di produzione, provider, screen reader o comprensione con utenti nuovi. Nessun nuovo detector né modifica UI. Numerazione 01–04 preservata dal copy baseline: può suggerire una sequenza, benché le sezioni siano attività diverse. È un limite del copy, non un difetto da correggere fuori autorizzazione.

# Verdict

Risponde al problema «tutto stesso peso» e rende il primo passo abbastanza diretto. La CTA è riconoscibile; il difetto notifiche è chiuso nel campione verificato. **SHIP, senza ulteriori fix o recapture richieste.** Identità coerente con grafite+miele; memorabilità di marca e comprensione immediata richiedono feedback umano, non sono dimostrate dai check.
