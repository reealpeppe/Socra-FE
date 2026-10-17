# Invito personale: un passo alla volta

Mode: Operate. Direzione richiesta da GR il18/10/2026: eliminare la doppia verifica email per chi possiede il link personale valido, rendere evidente come iniziare il percorso e riusare blu/giallo della home in tutta l'area personale. Implementazione e pubblicazione dirette autorizzate, senza ulteriori domande.

## Direction contract

THESIS: la proposta guida a una decisione, mostrando una sola azione principale pertinente allo stato corrente. La navigazione completa torna quando si esce dal flusso o si apre il percorso.

OWN-WORLD: Manrope, bianco e neutrali freddi; blu Socra `#20313e`, grafite del logo `#20272e`, giallo `#f3bb40`. Superfici piatte, bordi sottili, focus leggibile e controlli da almeno44px. Nessuna nuova immagine.

STORY: il link dimostra il possesso dell'indirizzo destinatario; la persona vede chi chiede aiuto e su cosa, compila soltanto l'esperienza necessaria, sceglie esplicitamente le attività offerte e conferma recapiti/disponibilità prima di iniziare.

FIRST VIEWPORT: testata essenziale Socra, proposta con obiettivi, passo corrente e CTA. Crediti/bonus in un dettaglio apribile; rifiuto secondario. Nessuna sidebar, wallet, notifica o lista di prerequisiti concorrenti.

FORM: raffinamento del flusso esistente, vincolato ai colori e allo scopo indicati da GR; nessuna selezione casuale o nuova identità. Proposta → esperienza → conferma, con stato server autorevole e recupero delle risposte incerte.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Vincoli verificabili

- Registrazione ordinaria conserva verifica email. Solo token personale valido e indirizzo corrente corrispondente producono la prova.
- Survey, offerte e consenso contatti non sono inferiti dal link. Il contesto personale facoltativo resta accessibile dopo il percorso guidato.
- Una sola CTA principale per fase; nessun aggiornamento manuale duplicato. Disponibilità in pausa richiede consenso esplicito prima della conferma.
- Link scaduto, account diverso, cambio sessione ed errore conservano una via di recupero senza aprire percorsi o assegnare bonus.
- Controllo desktop/mobile con API vere, review indipendente e una sola eventuale correzione visiva prima della conferma.
