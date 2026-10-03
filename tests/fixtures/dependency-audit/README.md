# Fixture npm audit

Report JSON catturati il 03/10/2026 con `npm audit --json` e `npm audit --omit=dev --json` nel checkout FE `4ae20de8556e97d3c5faffe44feddd9fc6c8f592`, prima dell'introduzione del gate temporaneo.

Contengono il report completo reale: cinque record high riconducibili a GHSA-vfj7-8cjw-p6xm e zero finding nell'audit runtime. I test mutano questi dati per verificare il rifiuto di report, advisory, scope e catene diversi. Non sostituiscono le chiamate al registry eseguite dal comando CI.
