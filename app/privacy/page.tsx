import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";
import publicStyles from "@/components/PublicLayout.module.css";
import styles from "./legal.module.css";

export const metadata: Metadata = {
  title: "Privacy Socra — Come trattiamo i dati",
  description: "Informazioni sul trattamento dei dati nella community peer-to-peer Socra.",
};

export default function PrivacyPage() {
  return (
    <>
      <PublicNavbar />
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <header className={styles.hero}>
          <div className={styles.heroInner}>
            <p className={styles.eyebrow}>Informazioni sui dati</p>
            <h1>Privacy, senza zone d’ombra.</h1>
            <p className={styles.lead}>
              Socra usa i dati necessari per creare l’account, proporre incontri coerenti,
              gestire i percorsi e proteggere la community. Non vende dati e non pubblica
              le risposte dettagliate della survey.
            </p>
          </div>
        </header>

        <div className={styles.content}>
          <aside className={styles.status} aria-label="Stato del documento">
            <strong>Documento in validazione</strong>
            <p>
              Questa pagina rende consultabili le regole già definite. Identità del
              gestore, contatti privacy, fornitori e data di efficacia devono essere
              completati e validati prima dell’apertura a utenti reali.
            </p>
          </aside>

          <section className={styles.section}>
            <h2>1. Che cos’è Socra</h2>
            <p>
              Socra è una community peer-to-peer che mette in contatto persone interessate
              a confrontarsi su obiettivi di educazione e consapevolezza finanziaria.
              Socra non partecipa ordinariamente agli incontri e non decide come le persone
              usano le informazioni scambiate.
            </p>
          </section>

          <section className={styles.section}>
            <h2>2. Quali dati trattiamo</h2>
            <ul>
              <li>Account: email, password protetta, identificativo interno, nome nella community, stato account e verifica email. Lo username degli account precedenti resta utilizzabile per l’accesso.</li>
              <li>Profilo: nome nella community, presentazione breve e foto facoltativa, modificabili dalle impostazioni.</li>
              <li>Onboarding: risposte alla survey, valutazioni interne per argomento ed esperienza pratica.</li>
              <li>Obiettivi e percorsi: argomento, descrizione generalizzata, proposte, stati, crediti interni e conferme per lo scambio dei contatti.</li>
              <li>Feedback e sicurezza: risposte strutturate, note private, badge e segnalazioni.</li>
              <li>Prima sessione: stanza, presenza e durata quando disponibili dal provider.</li>
              <li>Dati tecnici necessari a sessioni, sicurezza, errori e audit amministrativi.</li>
            </ul>
            <p>
              La presentazione può contenere al massimo 500 caratteri. La foto viene
              ritagliata in quadrato e ricodificata senza i metadati del file originale;
              puoi rimuoverla dalle impostazioni. Sono accettate foto statiche JPEG,
              PNG o WebP fino a 2 MiB, non SVG o immagini animate.
            </p>
            <p className={styles.callout}>
              Non chiediamo di pubblicare portafogli, allocazioni o importi personali.
              Evita di inserire credenziali, documenti, dati di terzi o informazioni
              finanziarie non necessarie.
            </p>
          </section>

          <section className={styles.section}>
            <h2>3. Perché li usiamo</h2>
            <p>
              Usiamo i dati per creare e proteggere l’account, completare onboarding e
              matching, aprire e chiudere i percorsi, gestire crediti e feedback, prevenire
              abusi e rispondere a obblighi applicabili. Le funzioni facoltative richiedono
              una scelta separata quando vengono proposte.
            </p>
            <h3>Sezione di contesto personale</h3>
            <p>
              La survey include professione, fascia di reddito, risparmio mensile,
              debiti e fondo di emergenza. Per ciascuna domanda puoi scegliere
              “Preferisco non rispondere”. Le informazioni che scegli di condividere
              servono a conoscere la community in forma aggregata: restano private,
              non cambiano il matching e non sono visibili ai mentor. Questa scelta
              non attiva comunicazioni marketing o usi commerciali.
            </p>
          </section>

          <section className={styles.section}>
            <h2>4. Matching e visibilità</h2>
            <p>Per distribuire le opportunità di incontro registriamo le schede effettivamente visualizzate: utente che cerca, profilo mostrato, ruolo, argomento e momento della visualizzazione. Questi dati operativi restano privati e sono conservati per un massimo di 30 giorni. Non modificano le recensioni né i punteggi di competenza.</p>
            <p>
              Le valutazioni per argomento e il matching servono a rendere più pertinenti gli incontri.
              La persona sceglie sempre se inviare o accettare una proposta. Il profilo
              nella community può mostrare nome, presentazione breve, foto facoltativa, disponibilità mentor,
              argomenti generalizzati, percorsi completati, badge e risultati aggregati.
            </p>
            <p>
              Risposte dettagliate, importi, descrizioni private, valutazioni interne e
              note del percorso non vengono pubblicati.
            </p>
            <h3>Condivisione dei contatti nel percorso</h3>
            <p>
              La tua email non è pubblica: non compare nel profilo, nei suggerimenti
              di matching o nelle proposte in attesa o rifiutate. Prima di avviare un
              nuovo percorso, entrambe le persone devono accettare esplicitamente la
              condivisione della propria email per organizzare gli incontri. Dopo
              l’accettazione, i recapiti sono disponibili soltanto alla coppia nel
              dettaglio del percorso.
            </p>
            <p>
              I percorsi già aperti non autorizzano automaticamente lo scambio:
              anche qui servono entrambe le conferme prima che i contatti diventino
              visibili, senza nuovi addebiti di crediti. Questa scelta è distinta dal
              marketing e non autorizza usi commerciali o la diffusione dei recapiti.
            </p>
          </section>

          <section className={styles.section}>
            <h2>5. Prima sessione e trascrizione</h2>
            <p>
              Socra non registra audio o video. Per la prima sessione può conservare dati
              tecnici di presenza e durata necessari a gestire il percorso e rilevare
              anomalie. Questi dati non costituiscono una verifica forte dell’identità.
            </p>
            <p className={styles.callout}>
              La trascrizione non è attiva. Non verrà acquisito testo finché non saranno
              completate la valutazione privacy, le misure tecniche e una scelta esplicita
              separata di entrambe le persone.
            </p>
          </section>

          <section className={styles.section}>
            <h2>6. Conservazione e sicurezza</h2>
            <p>
              I dati restano disponibili solo per il tempo necessario alla finalità
              dichiarata. Le durate definitive, le procedure di cancellazione e la
              gestione dei backup devono essere validate prima dell’apertura pubblica.
              Socra usa controlli di accesso, password protette, sessioni sicure e audit
              delle attività amministrative; nessun sistema è privo di rischi.
            </p>
            <h3>Email operative e fornitori</h3>
            <p>
              Quando l’invio è attivo, Socra usa Resend per le email di verifica
              dell’indirizzo, recupero password richiesto dall’utente e comunicazione
              di accettazione di un nuovo percorso. Resend riceve l’indirizzo del
              destinatario e il contenuto necessario al messaggio. Per l’accettazione
              vengono preparati due messaggi individuali, senza destinatari in copia,
              con il contatto della controparte e il collegamento al percorso; il link
              Google Meet compare solo se disponibile. Questi invii non sono marketing.
            </p>
            <p>
              Se l’invio è disattivato, Socra non spedisce queste email e i messaggi
              soppressi non vengono recuperati alla riattivazione. I contatti già
              autorizzati restano consultabili nel percorso. Non sono previsti invii
              per proposte ricevute, feedback o promemoria. La conferma tecnica del
              provider non garantisce la consegna nella casella di posta.
            </p>
            <p>
              I link di verifica email e recupero password sono personali, monouso
              e soggetti a scadenza: rispettivamente 24 ore e 30 minuti. Il recupero
              password chiude tutte le sessioni precedenti. I dettagli contrattuali
              dei fornitori, le durate definitive e le condizioni privacy devono
              essere completati nella versione validata del documento.
            </p>
          </section>

          <section className={styles.section}>
            <h2>7. Scelte e diritti</h2>
            <p>
              Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità
              quando applicabile e opposizione. Puoi revocare un consenso facoltativo
              senza modificare la liceità del trattamento già svolto.
            </p>
            <p>
              Il canale privacy ufficiale e l’identità del gestore saranno indicati nella
              versione validata. La community è riservata a persone maggiorenni.
            </p>
            <div className={styles.linkRow}>
              <Link className={publicStyles.actionDark} href="/termini">Leggi i Termini</Link>
              <Link className={publicStyles.textLink} href="/register">Torna alla registrazione</Link>
            </div>
          </section>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
