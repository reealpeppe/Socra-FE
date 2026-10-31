"use client";
import Link from "next/link";
import {useLaunchStatus} from "@/lib/prelaunch";
import styles from "./Prelaunch.module.css";
export function PrelaunchThanks(){
  const {state}=useLaunchStatus();
  return <main className={styles.page} id="main-content"><div className={styles.content}>
    <p className="eyebrow">Il primo passo è fatto</p><h1>Grazie, ci sei anche tu.</h1>
    <p>Ti abbiamo inviato un’email con il link per completare il tuo profilo. Aprila per inserire i tuoi dati, raccontarci la tua esperienza e scegliere il tuo primo obiettivo.</p>
    <div className={styles.success}><strong>Controlla la tua posta.</strong><p>Cerca “Completa il tuo profilo su Socra”, anche nella cartella spam. Il link personale vale 48 ore e conferma già il tuo indirizzo.</p></div>
    <p className={styles.fine}>Se hai già un account, l’email ti indica come accedere. Se hai già richiesto il link, controlla quello ricevuto: puoi chiedere un nuovo invio dopo 24 ore.</p>
    {state&&!state.email_delivery_enabled?<p role="status">Anteprima: l’invio è disattivato. La richiesta è registrata, ma nessuna email è stata spedita.</p>:null}
    <p><Link href="/prelancio">Correggi l’indirizzo o richiedi un nuovo link</Link></p>
    <p className={styles.fine}>Hai già completato il profilo? <Link href="/login?accesso=1">Accedi</Link>.</p>
  </div></main>;
}
