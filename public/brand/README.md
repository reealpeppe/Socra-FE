# Marchio Socra

`socra-logo.svg` è l'originale vettoriale fornito dal responsabile prodotto il
17/10/2026, trasferito dalla cartella `logo` del workspace senza modificarne i byte.
Contiene simbolo e scritta convertita in tracciati: non richiede font esterni.

| File | Uso |
|---|---|
| `socra-logo.svg` | Marchio completo, oro `#F3BB40` e antracite `#20272E`, su sfondi chiari |
| `socra-logo-light.svg` | Marchio completo su sfondi scuri; le parti antracite diventano bianche |
| `socra-symbol.svg` | Solo simbolo, trasparente, con gli stessi tracciati dell'originale e viewport ritagliato |
| `socra-symbol-light.svg` | Solo simbolo su sfondi scuri |
| `icon-192.png`, `icon-512.png` | Icone quadrate con fondo bianco per il manifest |

Il componente condiviso `components/Brand.tsx` sceglie il marchio completo o il
simbolo (`compact`) e la variante per il fondo (`dark` per fondi chiari,
`light` per fondi scuri, mantenendo l'interfaccia preesistente).

Next.js pubblica automaticamente `app/icon.svg` (simbolo con colore adattivo al
tema del browser), `app/favicon.ico` (16, 32 e 48 px), `app/apple-icon.png` (180 px)
e `app/manifest.ts`. Il manifest fornisce nome e icone ai collegamenti salvati;
non introduce service worker o funzionalità offline.
La console di monitoraggio riusa lo stesso simbolo in `public/monitoring/favicon.svg`.

Per rigenerare tutti i derivati dall'originale, dalla radice frontend:

```powershell
node scripts/generate-brand-assets.mjs
```

Lo script usa `sharp`, già presente con Next.js e vincolato dagli override del
progetto. Se cambia la geometria del logo originale, verificare anche il viewport
del simbolo nello script. Non sostituire gli SVG con PNG ingranditi.
