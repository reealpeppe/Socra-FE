---
name: Socra
description: "Identità Socra blu inchiostro e oro, dalla home alla community; correzione approvata il 18/10/2026."
colors:
  community-ink: "#20272e"
  community-muted: "#59666f"
  community-line: "#d7dfe5"
  community-paper: "#f3f6f8"
  brand-blue: "#20313e"
  brand-blue-hover: "#344957"
  brand-blue-soft: "#edf2f6"
  brand-blue-line: "#cbd7df"
  brand-gold: "#f3bb40"
  brand-gold-border: "#a7791f"
  community-control-line: "#788994"
  community-sidebar: "#f6f8fa"
  community-sidebar-selected: "#20313e"
  ink: "#20272e"
  muted: "#62676e"
  line: "#e4e3df"
  control-line: "#8d9295"
  paper: "#f8f8f6"
  card: "#fff"
  navy-900: "#293139"
  navy-850: "#323a42"
  navy-800: "#3b444c"
  home-hero-surface: "#20313e"
  home-hero-copy: "#dce3e8"
  home-hero-accent: "#ffe3a5"
  home-hero-control: "#8596a2"
  home-hero-control-hover: "#a9b7c0"
  home-hero-hover: "#344957"
  gold-500: "#f3bb40"
  gold-400: "#e7ab2b"
  gold-300: "#fff0ca"
  honey-soft: "#fff5dc"
  honey-ink: "#795611"
  info-surface: "#f0f3f5"
  info-text: "#344653"
  success-surface: "#edf2f6"
  success-text: "#20313e"
  danger-surface: "#fdf0ee"
  danger-text: "#a33028"
  neutral-surface: "#f5f5f2"
  neutral-text: "#62676e"
typography:
  community-page-title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(1.875rem, 3vw, 2.5rem)"
    fontWeight: 600
  community-dialog-title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
  community-profile-name:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
  display:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(2.25rem, 3.5vw, 3.65rem)"
    fontWeight: 550
    lineHeight: 1.12
    letterSpacing: "-.035em"
  headline:
    fontFamily: "Manrope, sans-serif"
    fontSize: "clamp(1.8rem, 3vw, 2.65rem)"
    fontWeight: 550
    lineHeight: 1.2
    letterSpacing: "-.03em"
  title:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "15px"
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, sans-serif"
    fontSize: ".875rem"
    fontWeight: 600
  button:
    fontFamily: "Manrope, sans-serif"
    fontSize: ".875rem"
    fontWeight: 650
  input:
    fontFamily: "Manrope, sans-serif"
    fontSize: "1rem"
  caption:
    fontFamily: "Manrope, sans-serif"
    fontSize: ".8125rem"
    fontWeight: 500
  badge:
    fontFamily: "Manrope, sans-serif"
    fontSize: ".75rem"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  radius: "12px"
  radius-sm: "8px"
  radius-lg: "16px"
  badge: "6px"
  alert: "10px"
  tab: "7px"
  progress: "4px"
spacing:
  "4": "4px"
  "6": "6px"
  "8": "8px"
  "12": "12px"
  "16": "16px"
  "18": "18px"
  "20": "20px"
  "24": "24px"
  "28": "28px"
  "32": "32px"
  "36": "36px"
  "40": "40px"
  "44": "44px"
  "48": "48px"
  "64": "64px"
components:
  button-primary:
    backgroundColor: "{colors.gold-500}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.radius-sm}"
    padding: "11px 18px"
  button-primary-hover:
    backgroundColor: "{colors.gold-400}"
  button-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.radius-sm}"
    padding: "11px 18px"
  button-secondary-hover:
    backgroundColor: "{colors.paper}"
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    typography: "{typography.button}"
    rounded: "{rounded.radius-sm}"
    padding: "11px 18px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.radius-sm}"
    padding: "11px 18px"
  button-ghost-hover:
    backgroundColor: "{colors.neutral-surface}"
  button-danger:
    backgroundColor: "{colors.danger-surface}"
    textColor: "{colors.danger-text}"
    typography: "{typography.button}"
    rounded: "{rounded.radius-sm}"
    padding: "11px 18px"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.input}"
    rounded: "{rounded.radius-sm}"
    padding: "10px 12px"
    width: "100%"
  navigation-link:
    textColor: "{colors.muted}"
    rounded: "{rounded.radius-sm}"
    padding: "10px 12px"
  navigation-link-active:
    backgroundColor: "{colors.brand-blue}"
    textColor: "{colors.card}"
  badge-neutral:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.neutral-text}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "5px 9px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "24px"
  card-auth:
    backgroundColor: "rgba(255, 255, 255, 0.98)"
    rounded: "{rounded.radius-lg}"
    padding: "clamp(26px, 5vw, 44px)"
    width: "min(100%, 510px)"
  card-dashboard-learning:
    backgroundColor: "{colors.brand-blue-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "25px"
    width: "100%"
  card-dashboard-secondary:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius}"
    padding: "28px"
  button-dashboard-learning:
    backgroundColor: "{colors.gold-500}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius-sm}"
    padding: "13px 18px"
    width: "100%"
  button-dashboard-mentor:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.radius-sm}"
    padding: "11px 16px"
  notification-unread:
    backgroundColor: "{colors.honey-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.radius-sm}"
    padding: "12px"
    width: "100%"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    rounded: "{rounded.tab}"
    padding: "9px 14px"
  tab-active:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
---

# Design System: Socra

## Overview

**Creative North Star: "Blu inchiostro e oro Socra"**

La correzione approvata il 18/10/2026 estende alla community la palette della home: blu `#20313e`, grafite del logo `#20272e` e oro `#f3bb40`. La modalità della community è **Operate**: leggibilità, azioni riconoscibili e stati coerenti hanno la precedenza sulla decorazione. Il blu identifica navigazione, link, icone e selezioni; l'oro mette in evidenza le azioni principali. Le superfici sono bianche o neutre fredde. Il verde non appartiene alla UI autenticata, nemmeno agli stati positivi, che conservano testo e icone di conferma.

La sola correzione cromatica preserva layout, Manrope locale, asset del marchio, contenuti e comportamento. La home conserva la sua presentazione. Nessun gradiente, ombra o elemento decorativo viene aggiunto da questa correzione. Il flusso guidato di invito ha invece una shell dedicata e una gerarchia semplificata, descritta nei Components; le regole funzionali restano nella wiki backend.

Le fonti visive sono `app/theme.css`, il blocco community di `app/globals.css` e i moduli locali. `app/layout.tsx` importa il tema dopo i globals; i selettori community più specifici e i moduli mantengono le varianti esplicite. Questo documento e `.impeccable/design.json` sono strumenti di sviluppo: non aggiungono regole di prodotto e non attestano un collaudo browser. La wiki backend rimane proprietaria delle regole.

**Key Characteristics:**

- Blu per navigazione, selezioni e stati positivi con testo/icone.
- Oro e grafite per le azioni principali.
- Superfici bianche e neutre fredde, card piatte.
- Manrope locale e asset ufficiali.
- Nessun verde nella UI autenticata.

## Colors

La home e la community condividono gli stessi colori di marca. I neutrali pubblici mantengono i valori esistenti; `.app-shell` usa `community-*` per i neutrali freddi.

### Brand and action

- **Blu inchiostro** (`brand-blue`): `#20313e`, uguale alla hero della home. Navigazione corrente con testo bianco, link, icone, checkbox, focus e conferme.
- **Blu hover** (`brand-blue-hover`): `#344957`, variante già presente nella home.
- **Blu tenue** (`brand-blue-soft`): `#edf2f6`, selezioni dei form, pannello di apprendimento, badge e stati positivi.
- **Bordo blu** (`brand-blue-line`): `#cbd7df`, separatori su superfici blu tenui.
- **Oro** (`brand-gold`, alias `gold-500`): `#f3bb40`, azione principale con testo grafite. L'hover mantiene `gold-400` (`#e7ab2b`).
- **Bordo azione oro** (`brand-gold-border`): `#a7791f`, distingue il controllo sulle superfici chiare.
- **Oro tenue/scuro** (`honey-soft`, `honey-ink`): richiami, avvisi, notifiche non lette e testo leggibile su fondi oro.

### Neutral

Grafite `ink` (`#20272e`) per il testo, bianco `card` per card e header. Nella community: `muted` `#59666f`, `paper` `#f3f6f8`, `line` `#d7dfe5`, `control-line` `#788994`, sidebar `#f6f8fa`. I bordi di superficie separano aree; quelli dei controlli mantengono contrasto sufficiente con il fondo.

### Semantic states

Successo e informazione conservano messaggi, icone e struttura esistenti; il successo usa blu su blu tenue. Gli stati warning mantengono oro tenue e testo scuro; gli errori mantengono rosso. I vecchi alias `mint-600`, `mint-100` e `green` restano compatibili con componenti storici ma risolvono rispettivamente a blu e blu tenue: non reintroducono verde. Le varianti CSS storiche `.green` e `actionDark` non descrivono il colore finale.

## Typography

**Display Font:** Manrope, con fallback sans-serif.

**Body Font:** Manrope, con fallback sans-serif.

`next/font/local` carica `public/fonts/manrope-variable.ttf`, espone `--font-socra`, imposta `display: swap` e dichiara l'intervallo variabile (200–800). La licenza è SIL Open Font License 1.1, conservata in `public/fonts/OFL-Manrope.txt`. Non serve una richiesta a un servizio font remoto.

### Hierarchy

- **Display:** il titolo della home usa il ruolo `display` del frontmatter; il peso intermedio limita la massa del titolo. A 1100px cambia la scala e a 760px passa a `clamp(2rem, 5.8vw, 2.6rem)`.
- **Headline:** titoli di sezione pubblici secondo la scala esistente. Nella dashboard il saluto usa `clamp(1.75rem, 2.6vw, 2.25rem)`, peso 600, line-height 1.2; fino a 760px resta a 1.75rem. Il tema di apprendimento usa 1.3125rem; gli altri titoli di card 1.5rem o 1.375rem secondo il ruolo esistente.
- **Title:** titoli di passi e piccoli blocchi. Nella home i titoli dei pilastri hanno line-height 1.45.
- **Body:** base (15px), line-height (1.6). Le descrizioni della home arrivano a line-height (1.7), con larghezza massima (58ch); le descrizioni degli header applicativi arrivano a (70ch).
- **Label:** etichette dei campi con peso (600). I pulsanti usano il ruolo separato `button`, con peso (650).
- **Input:** `1rem`, pari a (16px) con la dimensione radice standard; la base body da 15px non riduce la dimensione dei campi.
- **Caption / Badge:** metadati e indici; le label di sezione restano in caso normale, senza tracking decorativo. Contatori e valori metrici usano cifre tabulari.

I ruoli documentano gli stili osservati, non una scala matematica obbligatoria. Le dimensioni in `rem` non devono essere reinterpretate come multipli della base body.

## Layout

La shell applicativa ha sidebar (252px) e contenuto flessibile; il contenuto usa padding (36px 40px 56px), ridotto a (28px 28px 48px) sotto 1100px e a (24px 18px 32px) sotto 620px. Sotto 960px la sidebar lascia posto alla navigazione mobile inferiore, con spazio per la safe area. La topbar è alta almeno (76px), poi (68px) sotto 620px.

La dashboard è larga al massimo (1240px), con griglia a due colonne e gap (20px). La card “Impara” occupa tutta la prima riga e usa una superficie blu tenue, contenuti a sinistra e azioni a destra, separate da un bordo sottile. Le card hanno padding (25px). Sotto 960px la card di apprendimento diventa una colonna e il wallet può andare a capo; sotto 760px l'intera griglia diventa una colonna, con gap (17px) e padding card (22px). La sezione competenze mantiene un divisore superiore e nessuna superficie card aggiuntiva. Queste misure documentano il layout esistente, preservato dalla correzione cromatica.

La navigazione pubblica è fissa, alta (64px). Sotto 900px usa il menu mobile; sotto 600px riduce il padding e le CTA di sezione diventano larghe quanto il contenitore. Il footer passa da tre aree a due e poi a una colonna.

Dal refinement approvato il 12/10/2026 la hero della home è una fascia blu inchiostro a tutta larghezza, con titolo bianco, testo chiaro e CTA miele invariata. I token `home-hero-*` sono locali a `app/(public)/Home.module.css`; il secondario è trasparente con bordo e focus leggibili sulla fascia. Il resto della pagina conserva le superfici precedenti e il contenitore da (1240px). La hero ha una sola colonna con testo centrato, larghezza massima del testo (960px) e altezza minima (540px). Sotto 760px il testo è allineato a sinistra e l'altezza segue il contenuto. Pilastri e regole passano da tre colonne a una; i passi da due a una. Testi, destinazioni, markup e logica sono invariati.

I form di autenticazione sono centrati, larghi al massimo (510px), oppure (600px) per la registrazione; i campi affiancati diventano una colonna sotto 600px. La spaziatura estratta nel frontmatter raccoglie valori ricorrenti osservati, senza imporre una nuova griglia a tutte le pagine.

## Elevation & Depth

Le superfici sono piatte per default: card, metriche, righe, header e pulsanti non hanno ombra. Bordi e differenze di fondo separano i livelli. Le ombre servono ai menu sovrapposti e agli elementi effettivamente elevati, come il tab attivo; non sono una decorazione delle card.

### Shadow Vocabulary

- **Menu** (`--shadow`): `0 12px 32px rgb(32 39 46 / 8%)`; dropdown e menu pubblico mobile.
- **Elemento elevato compatto** (`--shadow-tight`): `0 3px 8px rgb(32 39 46 / 6%)`; tab attivo.

Il tema rimuove blur e sfondi decorativi dalla shell principale. I campi della community usano bordo e outline blu in focus, senza alone decorativo.

## Shapes

Card applicative e dropdown usano angoli (12px); pulsanti, campi, link di navigazione e contenitori delle icone usano generalmente (8px). Badge e tag hanno angoli (6px), avvisi e wallet (10px), tab (7px) e barre di progresso (4px). Avatar e piccoli indicatori conservano la forma circolare.

La card di autenticazione è una variante osservata con angoli (16px), coerente con `radius-lg`; non estendere questa variante a tutte le card. I bordi dei contenitori sono generalmente (1px). I nomi storici “pill” non implicano una sagoma a capsula: il tema finale la rende più compatta e rettangolare.

## Components

### Buttons

Azioni principali oro con testo grafite e bordo `brand-gold-border`; nella community anche la classe storica `button.dark` segue questo ruolo. Le secondarie hanno fondo trasparente o bianco, bordo `control-line` e testo blu. Le azioni danger conservano i token di errore. La home conserva le proprie varianti pubbliche.

Il pulsante condiviso mantiene padding (11px 18px), altezza minima (44px) e raggio (8px). Dashboard, matching e dialog mantengono le proprie misure esistenti. L'hover principale usa `gold-400`; disabled, caricamento e pressione conservano i comportamenti del componente. La correzione non aggiunge ombre o animazioni.

### Chips / Tags

Badge piccoli, con padding (5px 9px), raggio `badge` e peso (600). I badge informativi usano coppie semantiche; i tag della dashboard usano blu tenue e testo blu. Sono etichette, non controlli, salvo un comportamento esplicito già presente nel componente. Il colore non autorizza a inventare nuovi stati di prodotto.

### Cards / Containers

Contenitori piatti su superficie card, con bordo `line` e raggio `radius`. Il padding condiviso è (24px), poi (20px) nella shell sotto 620px; la dashboard mantiene la propria variante descritta in Layout. La card auth ha la forma e la larghezza riportate in `card-auth`, nessuna ombra e padding mobile (24px 18px). Non introdurre un hover su card prive di interazione.

La card “Impara” usa `brand-blue-soft`, testo grafite e bordo `brand-blue-line`. Icone, metadati di stato e link sono blu. Le card mentor e obiettivo rimangono bianche; la sezione competenze conserva la sua struttura. Il layout non è ridisegnato dalla correzione di palette.

### Aiuto ETF e notifiche

L'aiuto ETF conserva `details` / `summary` nativi, testo e condizioni di disponibilità. Le notifiche mantengono altezza automatica, testo a capo e lista scorrevole; lo stato non letto resta oro tenue con il badge “Nuova”. Nessuna variazione di logica accompagna il colore.

### Inputs / Fields

Campi bianchi, testo grafite, bordo `control-line`, raggio `radius-sm` e dimensione `input`. Il campo condiviso ha altezza minima (46px), padding (10px 12px); l'auth usa (48px) e (11px 13px). Nella community il focus cambia bordo a blu e usa un outline leggibile, senza ring; le pagine pubbliche conservano il focus precedente.

Il focus globale è un outline grafite (2px), offset (4px), ridotto a (2px) per i campi. L'auth mantiene un'eccezione specifica: outline (3px), offset (3px) per le azioni e ring traslucido grafite con offset (1px) per gli input. Anche alcune azioni pubbliche scure/outline e i link del footer mantengono outline (3px) locali. Queste differenze sono osservate nel CSS, non una richiesta di uniformare la UI. Il campo auth invalido usa un bordo rosso; il feedback conserva messaggi e logica esistenti.

### Navigation

La sidebar usa un neutro freddo chiaro, link blu e altezza minima (44px). L'hover usa blu tenue; lo stato attivo ha fondo blu, testo e icona bianchi. La navigazione mobile adotta gli stessi colori. Il link della sidebar conserva font-size (.875rem) e misure esistenti.

La navigazione pubblica è bianca; la pagina attiva ha una sottolineatura miele (2px), che nel menu mobile diventa indicatore laterale (3px). Il footer resta grafite, con link chiari e sottolineatura miele all'hover. Sidebar e menu pubblico hanno breakpoint differenti, perché risolvono layout differenti.

### Tabs and motion

I tab si appoggiano a un contenitore neutro con padding (4px); il tab attivo è bianco e usa l'ombra compatta. Altezza minima (44px) e scorrimento orizzontale preservano lo spazio su schermi stretti.

I token condivisi sono `duration-press` (120ms), `duration-ui` (180ms), `duration-reveal` (260ms), `ease-out` e `ease-in-out`; la presenza di un token non impone il suo utilizzo su ogni elemento. Dropdown e dialog entrano con opacità e piccoli spostamenti solo all'inserimento, senza nascondere il contenuto come stato predefinito. La home osservata ha un reveal del testo (420ms), limitato a `no-preference`. Reduced-motion disattiva animazioni, transizioni e smooth scrolling.

Nella dashboard wallet e righe mentor cambiano fondo in (180ms) con `ease`; le CTA cambiano fondo con la stessa durata e scalano alla pressione in (120ms) con `ease-out`. La freccia dell'aiuto ETF ruota con (180ms) e `ease-out`. Le card restano ferme; reduced-motion elimina le transizioni anche da questi componenti.

### Flusso guidato di invito

Il pattern condiviso tra proposta e profilo mostra tre passi, **Invito → Profilo → Conferma**, con `aria-current="step"`. Il numero corrente ha fondo oro, bordo `brand-gold-border` e testo grafite; i passi completati hanno fondo blu e numero bianco. I cerchi sono indicatori (28px), non controlli. La sequenza usa un gap (24px), con label (.875rem) in caso normale.

La shell dedicata mantiene il marchio e il link di uscita in una testata essenziale, senza sidebar, wallet o notifiche. Il contenuto è largo al massimo (860px), con padding (44px 32px 64px), ridotto a (28px 20px 40px) sotto 620px. La proposta usa una card piatta con angoli (14px), padding (32px) e una sola azione principale per lo stato corrente; rifiuto e dettagli apribili restano secondari. Sotto 620px il padding diventa (24px 20px) e l'azione principale occupa tutta la larghezza. Questa composizione appartiene al flusso di invito e non sostituisce la shell generale.

Consensi e disponibilità restano scelte esplicite con etichetta associata al controllo. La label del consenso compatto, i summary informativi e le azioni di chiusura hanno target di almeno (44px); la dimensione visiva della checkbox può essere inferiore. Non derivare altri stati di prodotto dallo stile del passo.

## Do's and Don'ts

### Do:

- **Do** usare i token di `app/theme.css` come autorità visiva finale, verificando la specificità dei moduli.
- **Do** mantenere card piatte da 12px e controlli da 8px, rispettando le varianti esplicite.
- **Do** usare Manrope locale e conservare la licenza OFL insieme al font.
- **Do** mantenere la base body a 15px e i campi a 1rem, con focus visibile.
- **Do** usare il blu per orientamento e selezione, l'oro per le azioni principali e testo/icone per distinguere gli stati.
- **Do** mantenere la UI autenticata priva di verde, inclusi stati positivi e fallback.
- **Do** limitare il movimento ai feedback osservati e rispettare reduced-motion.
- **Do** preservare testi, destinazioni e logica durante gli interventi esclusivamente visivi.

### Don't:

- **Don't** recuperare gradienti, blur o decorazioni dei vecchi globals quando il tema finale li sostituisce.
- **Don't** aggiungere ombre decorative alle card o ai pulsanti.
- **Don't** aggiungere grafica AI generica o fotografie nella hero della home: la scelta corrente è tipografica.
- **Don't** inventare regole di prodotto, etichette di stato o nuovi comportamenti partendo dai token visivi.
- **Don't** considerare questa estrazione statica un collaudo browser o una verifica di accessibilità completa.
