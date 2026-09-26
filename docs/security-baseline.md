# Standard web Socra

Proprietario delle regole: backend `docs/wiki/12-security-baseline.md` sul ref corrispondente a questa release. Questo ingresso accompagna il repository frontend anche fuori dal workspace.

Mutazioni cookie-based: `guardMutation` prima di rete/mutazioni; Origin esatto da `SOCRA_PUBLIC_ORIGINS`, nessuna fiducia in Host inoltrato. Production default socra.it/www.socra.it; ambienti di test aggiunti esplicitamente. JSON e streaming limitati tramite `readJsonBody` (auth 16 KiB, dominio 256 KiB); logout e proxy senza body ammessi. Risposte/errori privati tramite `privateJson`. Auth restituisce solo user_id, bearer soltanto nel cookie.

Il proxy generico accetta segmenti semplici ASCII e soltanto `GET auth/me` del namespace auth. Nuove route auth richiedono un handler dedicato; vietati percorsi codificati/ambigui e dot traversal che fetch potrebbe normalizzare verso un endpoint con token.

La CSP è in `proxy.ts`, nonce casuale per richiesta e layout dinamico. Script production senza unsafe-inline/eval; stili inline conservati per UI. Non abilitare cache condivisa HTML/RSC in Railway/Cloudflare: nonce e contenuto personale non devono essere riutilizzati. Gli asset statici conservano la cache framework. Nuovi script esterni richiedono revisione CSP e test browser. Non introdurre HSTS prima del collaudo dei domini HTTPS.

CI verifica route reali con upstream finto al solo confine rete, build/lint/typecheck, audit dipendenze high e Chromium/mobile per CSP/hydration. Le prove con mock non attestano API/Google produzione. Branch sicurezza separato dalla release online, nessun deploy implicito.
