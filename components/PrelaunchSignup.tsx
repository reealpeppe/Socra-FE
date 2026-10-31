"use client";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {launchPost,useLaunchStatus} from "@/lib/prelaunch";
import styles from "./Prelaunch.module.css";
export function PrelaunchSignup() {
  const router=useRouter();
  const {state,error:unavailable}=useLaunchStatus();
  const [email,setEmail]=useState(""),[accepted,setAccepted]=useState(false),[website,setWebsite]=useState("");
  const [updates,setUpdates]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
  async function submit(event:React.FormEvent) {
    event.preventDefault(); if(busy)return;
    setBusy(true);setError(null);
    try {await launchPost("join",{email,accepted,website,updates_opt_in:updates});router.push('/prelancio/grazie');}
    catch(reason){setError(reason instanceof Error ? reason.message : "Richiesta non riuscita. Riprova.");}
    finally {setBusy(false);}
  }
  return <main className={styles.page} id="main-content"><div className={styles.content}>
    <p className="eyebrow">Ci sei dall’inizio</p>
    <h1>La community di finanza personale più grande d’Italia sta arrivando.</h1>
    <p>Un posto per imparare, condividere ciò che sai e crescere insieme. Lascia la tua email per preparare il tuo profilo prima dell’apertura.</p>
    {state?.phase==="open" ? <><p>Socra è aperta: puoi creare il tuo account.</p><Link className="button dark" href="/register">Entra nella community</Link></> : <form onSubmit={submit}>
      <label className={styles.field} htmlFor="launch-email">La tua email<input id="launch-email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>
      <div className={styles.honeypot} aria-hidden="true"><label>Sito web<input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
      <label className={styles.consent}><input type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)} disabled={busy}/>
        <span>Richiedo il link per completare la registrazione e dichiaro di aver letto l’<Link href="/prelancio/privacy">informativa privacy</Link>.</span></label>
      <label className={styles.consent}><input type="checkbox" checked={updates} onChange={e=>setUpdates(e.target.checked)} disabled={busy}/>
        <span>Acconsento a ricevere via email aggiornamenti e comunicazioni sul pre-lancio di Socra <span className={styles.optional}>(facoltativo)</span>.</span></label>
      <p className={styles.fine}>Puoi completare la registrazione anche senza ricevere aggiornamenti. Puoi revocare il consenso in qualsiasi momento dal link nelle email.</p>
      <p className={styles.fine}>Ti invieremo un link personale per inserire i tuoi dati, completare la survey e scegliere il tuo primo obiettivo. <Link href="/prelancio/condizioni">Condizioni del pre-lancio</Link>.</p>
      {error || unavailable ? <p className={styles.error} role="alert">{error || "Il servizio non è disponibile. Riprova tra poco."}</p>:null}
      <button className="button dark" type="submit" disabled={busy || !state || unavailable} aria-busy={busy}>{busy ? "Invio…" : "Inizia da qui"}</button>
      {state && !state.email_delivery_enabled ? <p className={styles.fine}>Anteprima: l’invio email è disattivato in questo ambiente. Nessun messaggio sarà spedito.</p>:null}
    </form>}
    <p className={styles.fine}>Hai già creato il tuo account? <Link href="/login?accesso=1">Accedi al tuo profilo</Link>.</p>
  </div></main>;
}
