---
name: Socra
description: "Grafite e miele: interfaccia pulita e minimale, accogliente e professionale."
colors:
  ink: "#20272e"
  muted: "#62676e"
  line: "#e4e3df"
  control-line: "#8d9295"
  paper: "#f8f8f6"
  card: "#fff"
  navy-900: "#293139"
  navy-850: "#323a42"
  navy-800: "#3b444c"
  gold-500: "#f3bb40"
  gold-400: "#e7ab2b"
  gold-300: "#fff0ca"
  honey-soft: "#fff5dc"
  honey-ink: "#795611"
  info-surface: "#f0f3f5"
  info-text: "#344653"
  success-surface: "#edf5ef"
  success-text: "#32654c"
  danger-surface: "#fdf0ee"
  danger-text: "#a33028"
  neutral-surface: "#f5f5f2"
  neutral-text: "#62676e"
typography:
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
    backgroundColor: "{colors.honey-soft}"
    textColor: "{colors.ink}"
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

**Creative North Star: "Grafite e miele"**

Il brief approvato richiede un'interfaccia pulita e minimale, accogliente ma professionale, con un font professionale e senza grafica AI generica. Il codice finale traduce questa direzione in superfici chiare, testo grafite, accenti miele e gerarchie tipografiche sobrie. Spaziatura e bordi distinguono le aree; le decorazioni non competono con i contenuti.

Il movimento accompagna gli stati con piccoli spostamenti e variazioni di colore. Il contenuto rimane visibile anche senza animazioni; `prefers-reduced-motion` disattiva animazioni e transizioni. La home impiega un'immagine illustrativa di apprendimento: non va letta come una testimonianza di persone o incontri reali.

**Key Characteristics:**

- Superfici chiare e card piatte con bordi sottili.
- Testi grafite e miele per azioni e selezione.
- Manrope locale, gerarchia sobria e pesi intermedi.
- Motion discreto con supporto a reduced-motion.
- Contenuti, destinazioni e logica funzionale preservati.

Questa documentazione è un'estrazione statica del codice sul branch `design/grafite-miele`, non una certificazione visiva o un risultato di QA browser. Fonti: `app/theme.css`, `app/Home.module.css`, `components/PublicLayout.module.css`, `app/(community)/dashboard/Dashboard.module.css`, `app/login/auth.module.css` e `app/layout.tsx`; `app/globals.css` fornisce soltanto le proprietà ancora ereditate. `layout.tsx` importa il tema dopo i globals: il tema finale prevale a parità di specificità. I selettori più specifici dei moduli mantengono le loro varianti.

Il redesign conserva testi e logica; il markup della home è riordinato per la presentazione. Questo documento e il sidecar non modificano JSX, testi o comportamento e non aggiungono regole di prodotto. La wiki backend resta proprietaria di quelle regole.

## Colors

La palette combina neutrali chiari e grafite con un solo accento di marca, miele. I token nel frontmatter mantengono i nomi del CSS; i prefissi storici non identificano un secondo tema.

### Primary

- **Miele** (`gold-500`): pulsanti principali, indicatori di progresso e piccoli segnali della navigazione.
- **Miele hover** (`gold-400`): stato hover delle azioni principali.
- **Miele chiaro** (`gold-300`): selezione del testo.
- **Miele tenue** (`honey-soft`): selezione in navigazione, avvisi e superfici di richiamo.
- **Miele scuro** (`honey-ink`): testo su fondi miele, checkbox e indicatori compatibili con questa superficie.

### Neutral

- **Grafite** (`ink`): testo principale, focus, pulsanti scuri e footer pubblico. `navy` e `navy-950` sono alias dello stesso valore.
- **Grafite secondarie** (`navy-900`, `navy-850`, `navy-800`): varianti scure già definite; l'ultima è usata anche nell'hover delle azioni scure pubbliche.
- **Testo secondario** (`muted`, `neutral-text`): descrizioni e metadati.
- **Fondo pagina** (`paper`): sfondo uniforme, pannelli di supporto e hover neutri.
- **Superficie card** (`card`): card, header e campi.
- **Bordo superficie** (`line`): separatori e contenitori.
- **Bordo controllo** (`control-line`): campi e controlli che devono restare distinguibili.
- **Superficie neutra** (`neutral-surface`): badge e piccoli contenitori.

### Semantic states

Le coppie `info-surface` / `info-text`, `success-surface` / `success-text` e `danger-surface` / `danger-text` mantengono separati informazione, successo ed errore. `warning-surface` / `warning-text` condividono i valori di `honey-soft` / `honey-ink`. Gli alias compatibili (`blue`, `blue-600`, `cyan`, `mint-600`, `mint-100`, `green`, `amber`, `danger`, `orange-100`) non costituiscono nuovi accenti decorativi. Alcuni bordi di stato sono valori locali, riportati nei componenti del sidecar quando necessari.

Le rampe OKLCH del sidecar sono anteprime sintetiche per il pannello di design, non nuovi token applicativi e non indicazioni per cambiare il tema.

## Typography

**Display Font:** Manrope, con fallback sans-serif.

**Body Font:** Manrope, con fallback sans-serif.

`next/font/local` carica `public/fonts/manrope-variable.ttf`, espone `--font-socra`, imposta `display: swap` e dichiara l'intervallo variabile (200–800). La licenza è SIL Open Font License 1.1, conservata in `public/fonts/OFL-Manrope.txt`. Non serve una richiesta a un servizio font remoto.

### Hierarchy

- **Display:** il titolo della home usa il ruolo `display` del frontmatter; il peso intermedio limita la massa del titolo. A 1100px cambia la scala e a 760px passa a `clamp(2rem, 5.8vw, 2.6rem)`.
- **Headline:** titoli di sezione della home; i titoli applicativi hanno scale locali, fra cui `clamp(2rem, 3.2vw, 2.6rem)` nella dashboard.
- **Title:** titoli di passi e piccoli blocchi. Nella home i titoli dei pilastri hanno line-height 1.45.
- **Body:** base (15px), line-height (1.6). Le descrizioni della home arrivano a line-height (1.7), con larghezza massima (58ch); le descrizioni degli header applicativi arrivano a (70ch).
- **Label:** etichette dei campi con peso (600). I pulsanti usano il ruolo separato `button`, con peso (650).
- **Input:** `1rem`, pari a (16px) con la dimensione radice standard; la base body da 15px non riduce la dimensione dei campi.
- **Caption / Badge:** metadati e indici; le label di sezione restano in caso normale, senza tracking decorativo. Contatori e valori metrici usano cifre tabulari.

I ruoli documentano gli stili osservati, non una scala matematica obbligatoria. Le dimensioni in `rem` non devono essere reinterpretate come multipli della base body.

## Layout

La shell applicativa ha sidebar (252px) e contenuto flessibile; il contenuto usa padding (36px 40px 56px), ridotto a (28px 28px 48px) sotto 1100px e a (24px 18px 32px) sotto 620px. Sotto 960px la sidebar lascia posto alla navigazione mobile inferiore, con spazio per la safe area. La topbar è alta almeno (76px), poi (68px) sotto 620px.

La dashboard è larga al massimo (1240px), con due colonne proporzionali (1.1fr / 1fr) e gap (24px). Sotto 760px passa a una colonna, gap (16px), card con padding (22px) e azioni a larghezza piena. I padding delle card dashboard sono (28px) sul desktop e (24px) sotto 1100px.

La navigazione pubblica è fissa, alta (64px). Sotto 900px usa il menu mobile; sotto 600px riduce il padding e le CTA di sezione diventano larghe quanto il contenitore. Il footer passa da tre aree a due e poi a una colonna.

La home limita il contenitore principale a (1240px) e la hero a (1600px). La hero ha immagine e testo in due colonne; sotto 760px il testo precede l'immagine, che assume rapporto (4 / 3). Pilastri e regole passano da tre colonne a una; i passi da due a una. La home alterna superfici e separatori anziché trasformare ogni blocco in una card. Questa composizione appartiene alla home e non è un requisito per tutte le schermate.

I form di autenticazione sono centrati, larghi al massimo (510px), oppure (600px) per la registrazione; i campi affiancati diventano una colonna sotto 600px. La spaziatura estratta nel frontmatter raccoglie valori ricorrenti osservati, senza imporre una nuova griglia a tutte le pagine.

## Elevation & Depth

Le superfici sono piatte per default: card, metriche, righe, header e pulsanti non hanno ombra. Bordi e differenze di fondo separano i livelli. Le ombre servono ai menu sovrapposti e agli elementi effettivamente elevati, come il tab attivo; non sono una decorazione delle card.

### Shadow Vocabulary

- **Menu** (`--shadow`): `0 12px 32px rgb(32 39 46 / 8%)`; dropdown e menu pubblico mobile.
- **Elemento elevato compatto** (`--shadow-tight`): `0 3px 8px rgb(32 39 46 / 6%)`; tab attivo.

Il ring miele del campo in focus è feedback di interazione, non elevazione. Il tema rimuove blur e sfondi decorativi dalla shell principale.

## Shapes

Card applicative e dropdown usano angoli (12px); pulsanti, campi, link di navigazione e contenitori delle icone usano generalmente (8px). Badge e tag hanno angoli (6px), avvisi e wallet (10px), tab (7px) e barre di progresso (4px). Avatar e piccoli indicatori conservano la forma circolare.

La card di autenticazione è una variante osservata con angoli (16px), coerente con `radius-lg`; non estendere questa variante a tutte le card. I bordi dei contenitori sono generalmente (1px). I nomi storici “pill” non implicano una sagoma a capsula: il tema finale la rende più compatta e rettangolare.

## Components

### Buttons

Azioni chiare, con angoli contenuti e pesi leggibili. La primaria usa miele e grafite; la secondaria una superficie bianca con bordo, la scura grafite con testo bianco, la ghost un fondo trasparente, la danger la coppia semantica di errore.

Il pulsante condiviso ha padding (11px 18px), altezza minima (44px) e raggio `radius-sm`. Le azioni pubbliche usano (12px 22px) e altezza minima (48px); quelle dashboard (11px 16px). Il submit auth ha altezza minima (50px). Hover e pressione non aggiungono ombre: la primaria cambia al miele hover e la pressione scala a (.98). Su puntatore fine il pulsante condiviso può salire di (1px); il disabled resta fermo, con opacità (.55), oppure (.62) nel submit auth.

### Chips / Tags

Badge piccoli, con padding (5px 9px), raggio `badge` e peso (600). I badge informativi usano coppie semantiche; i tag della dashboard usano fondo pagina e testo secondario. Sono etichette, non controlli, salvo un comportamento esplicito già presente nel componente. Il colore non autorizza a inventare nuovi stati di prodotto.

### Cards / Containers

Contenitori piatti su superficie card, con bordo `line` e raggio `radius`. Il padding condiviso è (24px), poi (20px) nella shell sotto 620px; la dashboard mantiene la propria variante descritta in Layout. La card auth ha la forma e la larghezza riportate in `card-auth`, nessuna ombra e padding mobile (24px 18px). Non introdurre un hover su card prive di interazione.

### Inputs / Fields

Campi bianchi, testo grafite, bordo `control-line`, raggio `radius-sm` e dimensione `input`. Il campo condiviso ha altezza minima (46px), padding (10px 12px); l'auth usa (48px) e (11px 13px). Il campo condiviso in focus cambia bordo a grafite e aggiunge ring miele (3px).

Il focus globale è un outline grafite (2px), offset (4px), ridotto a (2px) per i campi. L'auth mantiene un'eccezione specifica: outline (3px), offset (3px) per le azioni e ring traslucido grafite con offset (1px) per gli input. Anche alcune azioni pubbliche scure/outline e i link del footer mantengono outline (3px) locali. Queste differenze sono osservate nel CSS, non una richiesta di uniformare la UI. Il campo auth invalido usa un bordo rosso; il feedback conserva messaggi e logica esistenti.

### Navigation

La sidebar bianca usa link compatti, testo secondario e altezza minima (44px). L'hover usa fondo pagina; lo stato attivo fondo miele tenue, testo grafite e peso (650), con icona miele scuro. Il link della sidebar ha font-size (.875rem), distinto dal ruolo caption usato per i metadati.

La navigazione pubblica è bianca; la pagina attiva ha una sottolineatura miele (2px), che nel menu mobile diventa indicatore laterale (3px). Il footer resta grafite, con link chiari e sottolineatura miele all'hover. Sidebar e menu pubblico hanno breakpoint differenti, perché risolvono layout differenti.

### Tabs and motion

I tab si appoggiano a un contenitore neutro con padding (4px); il tab attivo è bianco e usa l'ombra compatta. Altezza minima (44px) e scorrimento orizzontale preservano lo spazio su schermi stretti.

I token condivisi sono `duration-press` (120ms), `duration-ui` (180ms), `duration-reveal` (260ms), `ease-out` e `ease-in-out`; la presenza di un token non impone il suo utilizzo su ogni elemento. Dropdown e dialog entrano con opacità e piccoli spostamenti solo all'inserimento, senza nascondere il contenuto come stato predefinito. La home osservata ha due animazioni locali (420ms) e (620ms), limitate a `no-preference`. Reduced-motion disattiva animazioni, transizioni e smooth scrolling.

## Do's and Don'ts

### Do:

- **Do** usare i token di `app/theme.css` come autorità visiva finale, verificando la specificità dei moduli.
- **Do** mantenere card piatte da 12px e controlli da 8px, rispettando le varianti esplicite.
- **Do** usare Manrope locale e conservare la licenza OFL insieme al font.
- **Do** mantenere la base body a 15px e i campi a 1rem, con focus visibile.
- **Do** distinguere accento di marca e coppie di colore degli stati semantici.
- **Do** limitare il movimento ai feedback osservati e rispettare reduced-motion.
- **Do** preservare testi, destinazioni e logica durante gli interventi visivi.

### Don't:

- **Don't** recuperare gradienti, blur o decorazioni dei vecchi globals quando il tema finale li sostituisce.
- **Don't** aggiungere ombre decorative alle card o ai pulsanti.
- **Don't** aggiungere grafica AI generica o trattare l'immagine illustrativa della home come prova di incontri reali.
- **Don't** inventare regole di prodotto, etichette di stato o nuovi comportamenti partendo dai token visivi.
- **Don't** considerare questa estrazione statica un collaudo browser o una verifica di accessibilità completa.
