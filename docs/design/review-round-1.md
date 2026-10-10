# Disposition

**FIX**, con **RECAPTURE** obbligatoria prima della successiva review. La home e la dashboard rendono credibile la direzione grafite e miele; la coerenza delle pagine pubbliche secondarie e il contrasto dei controlli richiedono correzioni mirate. Nessun rebuild.

# Material findings

| Before | After | Why |
| --- | --- | --- |
| **P1, evidence** — `desktop-settings.png` mostra soltanto caricamento/sessione in verifica; `mobile-matching.png` mostra skeleton e Tutti(0). Anche requests/wallet desktop e mobile, e paths mobile, sono transitori. Header login/register e pubblici spesso in “Verifica sessione…”. | Riacquisire dopo sessione risolta e contenuto asincrono completo, verificando uno stato finale specifico per pagina. Conservare i loading come evidence distinta. | Assenza di overflow/errori non prova che i contenuti finali siano stati esaminati. Matching mobile e impostazioni non sono approvabili da queste catture. |
| **P2, coerenza pubblica** — `app/community/page.module.css`, `.hero h1` (6.5rem, tracking −.055em, 10ch), `.sectionHeader h2/.roles h2/.pact h2` (4.5rem); gradienti, `.voiceCard` con blur e raggi 18–20px. `app/sicurezza/page.tsx`, `.sic-hero-mark`, conserva scudo con halo; `app/come-funziona/page.tsx`, `.cf-steps-grid`, stringe il copy in cinque colonne. | Allineare scala, tracking ≥−.04em, superfici e raggi alla home; usare bordi semplici, eliminare blur/halo ornamentali. Rendere il processo una griglia o elenco più largo e leggibile, conservando integralmente testi, indici e ordine dei passi. | Il passaggio dalla home alle pagine informative cambia grammatica visiva: display molto più grande, cards decorative, testo stretto. Il recolor non realizza ancora un sistema coerente minimal/professionale. |
| **P2, controlli** — `app/theme.css:153`, `.input`, e `app/login/auth.module.css:244`, `.input/.togglePassword`: bordo #bfc3c3 su bianco, **1.78:1**. | Introdurre un token bordo controllo ≥3:1 contro bianco, per esempio #8d9295; applicarlo anche ai campi auth. Conservare spessore 1px, raggi 8px e focus grafite. | Nei campi bianchi su card bianca il bordo è il segnale della superficie editabile; lo stato normale è troppo tenue. I bordi delle card possono restare leggeri. |

# Checks performed

Aperte tutte le 15 evidence obbligatorie, incluse entrambe le viewport dei menu; dettagli viewport home e competenze. Esaminate inoltre community, come-funziona, sicurezza, FAQ, paths, requests e wallet desktop/mobile. Confrontati i due riferimenti approvati come direzione, senza imporne il copy abbreviato.

Letti theme, home/dashboard/public shell, auth, community, pagine informative, preparazione e stili matching. Manrope è locale variabile 200–800. Home fotografica convincente; dashboard senza illustrazioni, controlli ordinati, sidebar leggibile anche con label lunghe. Menu mobile e pulsanti rimangono distinguibili. Preparazione, attività conosciute e disponibilità mentor restano visivamente separate; nessun livello pubblico introdotto.

Contrasti calcolati: ink/bianco 15.10:1, muted/bianco 5.70:1, placeholder/bianco 4.51:1. Motion sorgente: momento home con contenuto già visibile e clip fotografica; UI 120/180ms, curve dedicate, press feedback, dropdown ancorato, reduced-motion globale. `report.json`: 35 checks, zero errori, font/overflow e reduced-motion dichiarati; detector `[]`. Questi check non compensano capture incomplete.

# Limits

Review da PNG e sorgenti: nessuna sessione browser, interazione o misura temporale personale. Catture da sviluppo con badge Next visibile; non confonderlo con UI prodotto. Non verificati tutti gli stati errore/focus/disabled, zoom, breakpoint intermedi o backend. Nessuna modifica di codice effettuata.

# Verdict

Correggere le due priorità P2 e ripetere le capture finali. Il nucleo della direzione funziona e conserva il copy reale; il risultato complessivo non è ancora pronto per ship a questo scope.
