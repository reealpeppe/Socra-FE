# Home — fascia blu inchiostro

Il 12/10/2026 GR approva il mockup della hero blu e chiede di applicare e pubblicare solo questa modifica alla home, conservando testi e logica.

Base frontend release `781f0db`, dopo le release grafica, prestazioni e crediti. Il solo file applicativo modificato è `app/(public)/Home.module.css`: fondo a tutta larghezza `#20313e`, titolo bianco, corpo `#dce3e8`, accento `#ffe3a5`, secondario trasparente con bordo/hover/focus leggibili. CTA primaria miele, font, spaziature, breakpoints, motion, testi, markup e href conservati; nessun cambio al tema globale o alle altre pagine. I colori locali sono documentati in DESIGN.md.

Non cambia una regola di prodotto: wiki, contratti e schema backend restano validi. Nessun componente, collegamento o attivazione cloud nuovo; diagrammi canonici invariati. Nessun deploy backend richiesto. La PR frontend registra controlli, merge, deployment e smoke effettivi dopo verifica; questo documento distingue l’approvazione dalla pubblicazione.

Contrasti della proposta: titolo 13,37:1, corpo 10,31:1, accento 10,69:1, bordo del secondario 4,38:1. La verifica browser deve controllare anche gli stati focus/hover, la fascia a tutta larghezza e l’assenza di overflow desktop/mobile sul CSS compilato, oltre all’identità di testi e destinazioni rispetto alla base.
