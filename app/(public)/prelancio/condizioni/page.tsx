import Link from "next/link";
import styles from "@/components/Prelaunch.module.css";
export const metadata = {title:"Condizioni dei bonus pre-lancio — Socra"};
export default function Page(){return <main className={styles.page} id="main-content"><article className={styles.terms}>
  <p className="eyebrow">Pre-lancio Socra · versione 30 ottobre 2026</p>
  <h1>Un grazie a chi parte con noi.</h1>
  <p>I bonus pre-lancio sono crediti extra rispetto alla dotazione iniziale. Servono per i percorsi su Socra: non si acquistano, non si convertono in denaro e non sono trasferibili.</p>
  <h2>1 credito extra per chi lascia l’email</h2>
  <p>Richiedi l’avviso durante il pre-lancio e conferma il tuo indirizzo tramite il link ricevuto. Per riscattare il credito devi creare un nuovo account e verificarlo con lo stesso indirizzo entro 30 giorni dall’apertura di Socra.</p>
  <h2>2 crediti extra per chi si registra prima del lancio</h2>
  <p>Crea un nuovo account durante il pre-lancio e verifica l’email prima dell’apertura. I due crediti saranno accreditati all’apertura. Puoi già compilare e modificare survey, esperienza e obiettivi: completare la survey non è un requisito per il bonus.</p>
  <h2>Un solo bonus, quello maggiore</h2>
  <p>I due bonus non si sommano. Se lasci prima l’email e poi crei e verifichi l’account prima del lancio, ricevi 2 crediti extra complessivi. Ogni account e ogni indirizzo possono ricevere un solo bonus pre-lancio. Gli account precedenti alla campagna non ricevono bonus retroattivi.</p>
  <h2>Quando si applicano</h2>
  <p>La data di apertura viene comunicata negli avvisi di lancio, insieme alla scadenza per il riscatto via email. Gli account devono essere attivi; indirizzi non confermati, richieste revocate e verifiche oltre la scadenza non danno diritto al bonus email.</p>
  <p>Il bonus per gli account verificati durante il pre-lancio è distinto dall’adesione alla lista email. Puoi annullare l’avviso senza cancellare il tuo account. I bonus per gli inviti personali seguono le loro condizioni separate.</p>
  <h2>Il tuo profilo resta tuo</h2>
  <p>Durante il pre-lancio puoi preparare e aggiornare il profilo. Matching, richieste, inviti e percorsi saranno accessibili all’apertura. Un profilo compilato aiuta la ricerca, ma non garantisce un abbinamento o la disponibilità di un’altra persona.</p>
  <p>Per chiarimenti: <a href="mailto:info@socra.it">info@socra.it</a>.</p>
  <p><Link href="/prelancio">Lascia la tua email</Link> · <Link href="/register">Crea il tuo account</Link> · <Link href="/prelancio/privacy">Informativa per l’avviso</Link></p>
</article></main>;}
