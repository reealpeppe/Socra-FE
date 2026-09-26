import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";
import publicStyles from "@/components/PublicLayout.module.css";
import styles from "../privacy/legal.module.css";

export const metadata: Metadata = {
  title: "Termini Socra — Regole della community",
  description: "Le regole essenziali per partecipare alla community peer-to-peer Socra.",
};

export default function TermsPage() {
  return (
    <>
      <PublicNavbar />
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>Regole della community</p>
            <h1>Un patto chiaro tra persone.</h1>
            <p className={styles.lead}>
              Socra facilita l’incontro. Apprendista e mentor restano responsabili delle proprie
              parole, delle informazioni condivise e delle decisioni prese in autonomia.
            </p>
          </div>
        </header>

        <div className={styles.content}>
          <aside className={styles.status} aria-label="Stato del documento">
            <strong>Documento in validazione</strong>
            <p>
              Le regole di prodotto sono consultabili. Gestore, contatti ufficiali,
              legge applicabile e data di efficacia devono essere completati e validati
              prima dell’apertura a utenti reali.
            </p>
          </aside>

          <section className={styles.section}>
            <h2>1. Che cos’è Socra</h2>
            <p>
              Socra è una community peer-to-peer e uno strumento tecnico di incontro tra
              persone maggiorenni. Permette di indicare un obiettivo generale, incontrare
              possibili mentor o apprendisti, proporre un percorso e scambiarsi feedback.
            </p>
            <p className={styles.callout}>
              Socra non presta consulenza finanziaria, non approva ciò che un utente dice,
              non riceve ordini, non custodisce denaro e non garantisce risultati o rendimenti.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Responsabilità di chi partecipa</h2>
            <ul>
              <li>Decidi autonomamente cosa condividere e come usare le informazioni ricevute.</li>
              <li>Verifica informazioni, rischi e qualifiche prima di prendere decisioni.</li>
              <li>Proteggi credenziali e dati di accesso e usa un solo account.</li>
              <li>Rispetta l’altra persona e mantieni il confronto sull’obiettivo concordato.</li>
              <li>Non registrare o diffondere l’incontro senza una base lecita e l’accordo delle persone coinvolte.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>3. Cosa non è consentito</h2>
            <ul>
              <li>Frode, impersonificazione, molestie, minacce o contenuti illeciti.</li>
              <li>Pressioni commerciali, spam, promesse di rendimento o inviti a investire.</li>
              <li>Raccolta o gestione di denaro per conto di altre persone.</li>
              <li>Promozione non richiesta di consulenze, corsi, broker, affiliazioni o canali esterni.</li>
              <li>Manipolazione di survey, matching, feedback, incontri, inviti o crediti.</li>
              <li>Account multipli, percorsi fittizi, scraping o aggiramento dei limiti tecnici.</li>
            </ul>
          </section>

          <section className={styles.section}>
            <h2>4. Matching, percorsi e crediti</h2>
            <p>
              Esperienza dichiarata, risultati dei percorsi e compatibilità aiutano a trovare un incontro pertinente:
              non certificano una persona e non indicano che un investimento sia adatto.
              Ogni percorso si apre solo dopo l’accettazione di chi riceve la proposta.
            </p>
            <p>
              Per avviare un nuovo percorso, entrambe le persone devono accettare
              esplicitamente la condivisione della propria email per organizzare gli
              incontri. Il recapito non è pubblico: diventa disponibile alla coppia
              nel percorso dopo l’accettazione, non nelle proposte in attesa o rifiutate.
              I percorsi già aperti richiedono entrambe le conferme prima di mostrare
              i contatti, senza nuovi addebiti. Questa scelta non autorizza marketing,
              usi commerciali o diffusione dei recapiti.
            </p>
            <p>
              I crediti sono unità interne di partecipazione. Non sono denaro, non si
              acquistano, non si trasferiscono fuori dalla piattaforma e non attribuiscono
              diritti patrimoniali.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Incontri e feedback</h2>
            <p>
              Quando Google Meet è disponibile, puoi preparare la stanza della prima
              sessione dal percorso. Se l’integrazione non è disponibile, segui le
              indicazioni nel percorso o usa “Segnala un problema” per concordare con
              l’amministrazione i passaggi di verifica del primo incontro. Socra può
              conservare presenza e durata quando disponibili per gestire il percorso
              e rilevare anomalie. Non registra audio o video e oggi non acquisisce trascrizioni.
            </p>
            <p>
              Entrambe le persone inviano il proprio feedback senza vedere prima quello
              altrui. Le note restano visibili soltanto alla coppia e agli amministratori
              autorizzati; non vengono mostrate a futuri mentor.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Segnalazioni e account</h2>
            <p>
              Puoi segnalare un problema dal dettaglio del percorso. Socra può esaminare
              la segnalazione, chiedere chiarimenti e adottare misure proporzionate quando
              necessario. Non controlla preventivamente tutte le conversazioni.
            </p>
            <p>
              Le email operative di verifica indirizzo, recupero password richiesto
              dall’utente e accettazione di un nuovo percorso vengono gestite tramite
              Resend solo quando l’invio è attivo; non sono comunicazioni marketing.
              L’invio può essere disattivato e non equivale a una garanzia di consegna.
              I contatti autorizzati rimangono disponibili nel percorso anche senza email.
            </p>
            <p>
              La procedura di contestazione, i contatti di supporto e le regole definitive
              per chiusura e sospensione account saranno indicati nella versione validata.
            </p>
            <div className={styles.linkRow}>
              <Link className={publicStyles.actionDark} href="/privacy">Leggi la Privacy</Link>
              <Link className={publicStyles.textLink} href="/register">Torna alla registrazione</Link>
            </div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
