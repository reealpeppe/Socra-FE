# Riduzione delle attese nella navigazione

Obiettivo autorizzato: correggere i caricamenti nel branch isolato
`fix/page-performance-20261011`, misurare prima/dopo sullo stesso codice di
produzione e lasciare una preview locale da provare. Base FE `4198c0d`;
documentazione BE su `docs/page-performance-20261011`, base `8bf12a2`.

Il piano applica gli interventi proposti nella diagnosi e approvati con la
richiesta di implementazione. CSP a nonce, HTML/RSC no-store, cookie HttpOnly,
autorizzazioni e provider rimangono invariati. La prima correzione elimina
attese inutili del client; la cache pubblica CDN è una scelta distinta.

- [x] Compilare la base e aggiungere regressioni browser: navbar e contenuto
  persistenti con risposta RSC ritardata; nessuna verifica sessione ripetuta
  tra pagine pubbliche; ritorno a dati validi senza cancellare la pagina;
  profilo accessorio lento non blocca la dashboard. Osservare i fallimenti.
- [x] Spostare le pagine pubbliche in `(public)` e creare un layout comune
  con navbar/footer; mantenere URL e metadata. Rimuovere i fallback di route
  che sostituiscono l'intera pagina e usare il prefetch completo sui link
  di navigazione. Provare latenza anche senza prefetch disponibile.
- [x] Usare i dati validi della cache privata in memoria al montaggio di
  gate, catalogo e viste; TTL breve per dati operativi. Conservare invalidazione
  su mutazioni, sessione e ritorno alla scheda. Caricare il profilo accessorio
  della dashboard indipendentemente dal contenuto principale.
- [x] Verificare build, tipi, lint, cache, sicurezza e browser pertinenti;
  misurare prima/dopo con backend locale reale e stessa fixture su desktop
  e mobile. Rivedere errori, sessioni scadute, utenti non verificati e cambio
  account. Aggiornare architettura FE e schema comune BE.
- [x] Salvare evidenze e commit del branch; avviare preview di produzione
  loopback con fixture locale dedicata e aprirla per la prova dell'utente.

Le misure distinguono risposta route, comparsa del contenuto finale e presenza
del fallback. Nascondere un testo da solo non soddisfa il criterio. Nessun deploy.
