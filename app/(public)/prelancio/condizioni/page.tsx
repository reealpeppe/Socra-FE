import Link from "next/link";
import styles from "@/components/Prelaunch.module.css";
export const metadata = {title:"Condizioni dei bonus pre-lancio — Socra"};
export default function Page(){return <main className={styles.page} id="main-content"><article className={styles.terms}>
  <p className="eyebrow">Pre-lancio Socra</p>
  <h1>Un grazie a chi parte con noi.</h1>
  <p>I bonus pre-lancio sono crediti extra rispetto alla dotazione iniziale. Servono per i percorsi su Socra: non si acquistano, non si convertono in denaro e non sono trasferibili.</p>
  <h2>Riserva il tuo posto</h2><p>Lascia il tuo indirizzo e ricevi il link per riprendere. Puoi preparare subito il profilo nello stesso browser e confermare l’email alla fine. Se continui dal link ricevuto, la verifica avviene durante la registrazione.</p><p>Solo se lo scegli nella seconda casella, riceverai aggiornamenti e comunicazioni sul pre-lancio, compresi eventuali promemoria per completare il profilo e avvisi di apertura. Il consenso è facoltativo e puoi revocarlo dal link nelle email. La scelta non condiziona la registrazione o il bonus previsto per l’account.</p>
  <h2>1 credito extra per chi lascia l’email</h2>
  <p>Questa condizione conserva l’eventuale adesione confermata con il precedente flusso email. Per riscattare il credito occorre creare e verificare un nuovo account con lo stesso indirizzo entro 30 giorni dall’apertura di Socra. Per le nuove prenotazioni si applica il bonus account descritto qui sotto.</p>
  <h2>2 crediti extra per chi si registra prima del lancio</h2>
  <p>Crea l’account e verifica il tuo indirizzo prima dell’apertura. I due crediti saranno accreditati all’apertura. Puoi già compilare e modificare survey, esperienza e obiettivi. Completare la survey è facoltativo per il bonus.</p>
  <h2>Un solo bonus, quello maggiore</h2>
  <p>I due bonus non si sommano. Se lasci prima l’email e poi crei e verifichi l’account prima del lancio, ricevi 2 crediti extra complessivi. Ogni account e ogni indirizzo possono ricevere un solo bonus pre-lancio. Gli account precedenti alla campagna non ricevono bonus retroattivi.</p>
  <h2>Quando si applicano</h2>
  <p>La data di apertura viene comunicata negli avvisi di lancio, insieme alla scadenza per il riscatto via email. Gli account devono essere attivi; indirizzi non confermati, richieste revocate e verifiche oltre la scadenza non danno diritto al bonus email.</p>
  <p>Il bonus per gli account verificati durante il pre-lancio è distinto dall’adesione alla lista email. Puoi annullare l’avviso senza cancellare il tuo account. Gli inviti personali di pre-lancio conteggiano gli account verificati. Condividere il link non dà diritto a crediti aggiuntivi.</p>
  <h2>Il tuo profilo resta tuo</h2>
  <p>Durante il pre-lancio puoi preparare e aggiornare il profilo. Matching, richieste di incontro e percorsi saranno accessibili all’apertura. Un profilo compilato aiuta la ricerca, ma non garantisce un abbinamento o la disponibilità di un’altra persona.</p>
  <p>Per chiarimenti: <a href="mailto:info@socra.it">info@socra.it</a>.</p>
  <p><Link href="/prelancio">Inizia dalla tua email</Link> · <Link href="/prelancio/privacy">Informativa sul pre-lancio</Link></p>
</article></main>;}
