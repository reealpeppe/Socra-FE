# Marchio ufficiale Socra — candidato produzione 17/10/2026

GR ha richiesto l'integrazione del logo fornito e successivamente autorizzato la
pubblicazione con «mettilo pure online». Porting isolato sulla release FE
`c676a73693be2e210ae467297728020a2edda8c1`, BE di riferimento
`9fb94e8547b1b8aff9954af9e92a559a972669a7`. Checkout feature e lavori altrui
preservati.

Solo marchio condiviso, simbolo vettoriale originale, varianti su sfondi scuri,
favicon e icone dei collegamenti. La navbar della release è bianca: usa la
variante antracite, mentre il footer conserva la variante bianca. Tutti i
tracciati e il colore oro restano quelli forniti. Il manifest pubblica nome e
icone, senza service worker o modalità offline.

Package/lock, runtime Next16.3.8, sicurezza, BFF, sessione, CSP, API, regole,
schema, dati e provider restano sulla base release. La wiki funzionale non
cambia; le connessioni cloud/layer degli schemi canonici wiki13 restano valide:
`Brand` è il componente esistente e carica asset statici locali nello stesso FE.
Ricevute CI, merge, deployment e smoke finale nella PR e nel rapporto canonico
backend `docs/releases/2026-10-17-brand-assets.md`.

Verifiche locali sulla base release: build e typecheck superati; lint senza
errori (due warning MonitoringMfa preesistenti), audit completo/runtime a zero,
108 test sicurezza, 9 cache, 8 gate UX e 10 test browser home/navigazione/accesso
desktop/mobile passati. I due selettori obsoleti del checkout feature non sono
presenti nella suite release. Nessuna modifica ai test o alle dipendenze.

Rollback: revert della sola integrazione FE sulla release corrente. Nessun
restore database, downgrade di dipendenze o variazione di provider.
