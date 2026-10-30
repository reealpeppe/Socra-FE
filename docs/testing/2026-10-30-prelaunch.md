# Pre-lancio — anteprima locale del 30/10/2026

Branch `feature/prelaunch-20261030`, base FE `9db79bd`, BE `2cf2712`. Regole e stato nella wiki14 backend e nella consegna `docs/testing/2026-10-30-prelaunch.md` del backend sullo stesso branch; nessun deploy.

Pagine: `/prelancio`, `/prelancio/conferma`, `/prelancio/revoca`, `/prelancio/condizioni`, `/prelancio/privacy`; amministrazione `/admin/prelancio`. `PrelaunchGate` legge lo stato autorevole dell'account prima di montare contenuti operativi; i percorsi di preparazione rimangono disponibili. Banner pubblico solo quando il server dichiara pre-lancio. BFF con destinazioni fisse, Origin e body limitati; token fragment mai in query o storage.

Validazioni: build e typecheck; lint senza errori (due warning preesistenti monitoring).137 test Node.40 ricontrolli browser mirati passati dopo il fix della regressione nelle richieste con wallet lento. Nuova pagina di attesa, raccolta/conferma email e rientro coperti desktop/mobile. API vere locali:12 screenshot senza overflow o errori JavaScript, conservati in `.local/preview`; DB sintetico e invii disattivati. Il primo giro ha individuato il banner coperto dalla navbar fissa: corretto prima della consegna.

Una sola review meccanica visuale: avvisi consultivi su misure tipografiche fuori scala; identità, componenti e palette Socra preservati. Review semantica con schermate desktop/mobile e revisione indipendente del codice completate; nessuna dichiarazione di audit accessibilità esaustivo.

Anteprima `http://localhost:3138/prelancio`; account locale `anteprima`, password dimostrativa `SocraPreview123!` (solo example.test). Staff sintetico `staff-anteprima` con stessa password per esaminare il pannello. Nessun dato o credenziale di produzione.

Suite browser finale completa: **522 passati, due saltati**, desktop e mobile. Esecuzione con backend mock isolato dalla preview reale tramite `SOCRA_API_BASE_URL=http://127.0.0.1:1` nel solo processo di QA. Ricontrollo finale delle12 schermate: zero errori JavaScript e overflow, banner mobile leggibile. La documentazione backend/frontend/workspace passa senza errori. Ultimo adeguamento di copy: etichetta `Bonus pre-lancio` nello storico crediti; comportamento economico immutato.

La review visuale indipendente ha poi bloccato la consegna perché le prime catture delle impostazioni non dimostravano l'editor caricato. Corretto il montaggio degli avvisi di matching durante il blocco e l'errore prematuro del profilo durante il caricamento. Nuovo test fallito prima del fix e passato dopo: carica e salva il profilo senza chiamare API operative. Verifica dopo il fix: **8 test pre-lancio e 58 test profilo/impostazioni passati**; build e lint passano (stessi due warning preesistenti). La suite completa di522 precede questo ultimo fix.

Evidenze API vere rigenerate: **16 schermate**, desktop/mobile, con editor effettivamente caricato, salvataggio confermato, esperienza già completata riaperta e condizioni raggiunte dai link della schermata d'attesa. Nessun errore JavaScript o overflow. Seconda revisione visuale indipendente: **PASS** sui sei artefatti impostazioni, esperienza completata e condizioni; nessun residuo materiale nel perimetro controllato. Script e schermate locali ignorati in `.local/preview`.
