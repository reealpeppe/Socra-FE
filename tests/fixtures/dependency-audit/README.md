# Fixture npm audit

Report JSON catturati il 03/10/2026 con `npm audit --json` e `npm audit --omit=dev --json` nel checkout FE `4ae20de8556e97d3c5faffe44feddd9fc6c8f592`, prima dell'introduzione del gate temporaneo.

Contengono il report completo reale: cinque record high riconducibili a GHSA-vfj7-8cjw-p6xm e zero finding nell'audit runtime. I test mutano questi dati per verificare il rifiuto di report, advisory, scope e catene diversi. Non sostituiscono le chiamate al registry eseguite dal comando CI.

`lock-2026-10-03-chain.json` conserva root e cinque nodi della catena approvata (estratti dal lockfile della base FE `4198c0d`, ancora 16.3.6). La fixture è storica e indipendente da futuri aggiornamenti del lockfile applicativo. Un test distinto verifica che la catena aggiornata 16.3.8 non possa riusare l'eccezione 16.3.6 e che la scadenza rimanga bloccante; il gate reale legge sempre il lockfile corrente.
