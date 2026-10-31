# Pre-lancio — banner, consensi e privacy

Revisione locale31/10 su `feature/prelaunch-20261030`, base FE4e87e72 / BEa8b6e33. Regole e prove backend in wiki14, wiki07 e `docs/testing/2026-10-31-prelaunch-consents.md` sullo stesso branch. Nessun rilascio o invio.

Banner superiore rimosso, condizioni senza versione visibile. Richiesta del link/lettura privacy e aggiornamenti pre-lancio sono due checkbox distinte e vuote; la seconda è facoltativa. Il JSON include sempre updates_opt_in booleano. Privacy generale/dedicata riscritte con finalità e basi separate, dati, fornitori/trasferimenti, conservazione, revoca e diritti. Revoca aggiornamenti non blocca link/account/bonus. Testi connessi non promettono email senza la scelta opzionale.

Identità legale titolare ancora richiesta a GR. PrivacyIdentity visualizza solo quel dato mancante, senza inventare una società; usa SOCRA_PRIVACY_CONTROLLER_NAME e indirizzo facoltativo SOCRA_PRIVACY_CONTROLLER_ADDRESS. Contatto info@socra.it confermato da GR. Le informative non sono attestate come legalmente complete finché manca questa informazione e la verifica finale.

Build/typecheck e84 test Node pertinenti passati; lint0 errori/due warning MonitoringMfa preesistenti. 50 test browser pertinenti passati desktop/mobile. Test checkbox: invio con solo richiesta link funziona, seconda scelta non obbligatoria/defaultfalse; entrambi selezionati inviano true. Banner e versione assenti. API vere:10 fullpage più10 viewport desktop/mobile, zero errori/overflow e richiesta senza aggiornamenti su fixture sintetiche. Report in `.local/consent-preview`; preferenze/prove riletti nel DB locale. Review visuale indipendente **PASS** su tutti20 artefatti, nessuna certificazione legale o invio provider.

Preview `http://localhost:3138/prelancio`, email disabilitate. Documento di lavoro con fonti (modulo Fiscozen, Garante e DPA ufficiali) nel piano backend `docs/plans/2026-10-31-prelaunch-consents.md`; i testi sono propri di Socra, non copiati da altri moduli.
