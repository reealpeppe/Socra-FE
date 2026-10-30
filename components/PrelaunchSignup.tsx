"use client";
import Link from "next/link";
import {useState} from "react";
import {launchPost,useLaunchStatus} from "@/lib/prelaunch";
import styles from "./Prelaunch.module.css";
export function PrelaunchSignup() {
  const {state,error:unavailable}=useLaunchStatus();
  const [email,setEmail]=useState(""),[accepted,setAccepted]=useState(false),[website,setWebsite]=useState("");
  const [busy,setBusy]=useState(false),[success,setSuccess]=useState(false),[error,setError]=useState<string|null>(null);
  async function submit(event:React.FormEvent) {
    event.preventDefault(); if(busy)return;
    setBusy(true);setError(null);
    try {await launchPost("subscribe",{email,accepted,website});setSuccess(true);}
    catch(reason){setError(reason instanceof Error ? reason.message : "Richiesta non riuscita. Riprova.");}
    finally {setBusy(false);}
  }
  return <main className={styles.page} id="main-content"><div className={styles.content}>
    <p className="eyebrow">Un nuovo modo di imparare, insieme</p>
    <h1>Il prossimo passo di Socra, nella tua email.</h1>
    <p>Lascia il tuo indirizzo: ti avviseremo prima dell’apertura della community. Non serve creare un account adesso.</p>
    {success ? <div className={styles.success} role="status"><strong>Controlla la tua email.</strong>
      <p>Se la richiesta è nuova e l’invio è attivo, riceverai un link per confermare il tuo indirizzo. Dopo la conferma ti avviseremo prima del lancio. Controlla anche la posta indesiderata.</p>
      <p>Il link dura 48 ore. Se lo hai già richiesto, resta valido quello più recente; un nuovo invio è disponibile dopo 24 ore.</p>
    </div> : state?.phase==="open" ? <p>Puoi già entrare: Socra è aperta.</p> : <form onSubmit={submit}>
      <label className={styles.field} htmlFor="launch-email">La tua email<input id="launch-email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={e=>setEmail(e.target.value)} disabled={busy}/></label>
      <div className={styles.honeypot} aria-hidden="true"><label>Sito web<input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e=>setWebsite(e.target.value)}/></label></div>
      <label className={styles.consent}><input type="checkbox" required checked={accepted} onChange={e=>setAccepted(e.target.checked)} disabled={busy}/>
        <span>Desidero ricevere via email l’avviso di apertura di Socra e ho letto l’<Link href="/prelancio/privacy">informativa dedicata</Link>. Posso annullare la richiesta in qualsiasi momento.</span></label>
      <p className={styles.fine}>Conferma l’indirizzo dal link che riceverai. L’adesione confermata riserva <strong>1 credito extra</strong>, da riscattare con un account verificato entro 30 giorni dal lancio. <Link href="/prelancio/condizioni">Leggi tutte le condizioni</Link>.</p>
      {error || unavailable ? <p className={styles.error} role="alert">{error || "Il servizio non è disponibile. Riprova tra poco."}</p>:null}
      <button className="button dark" type="submit" disabled={busy || !state || unavailable} aria-busy={busy}>{busy ? "Invio…" : "Avvisami al lancio"}</button>
      {state && !state.email_delivery_enabled ? <p className={styles.fine}>Anteprima: l’invio email è disattivato in questo ambiente. Nessun messaggio sarà spedito.</p>:null}
    </form>}
    <div className={styles.secondary}><h2>{state?.phase === "open" ? "Entra nella community" : "Vuoi portarti avanti?"}</h2>{state?.phase === "open" ? <p>Crea il tuo account e prepara il profilo per cercare persone con cui imparare. Se hai confermato l’adesione via email durante il pre-lancio, verifica l’account entro la scadenza per riscattare il credito extra previsto dalle condizioni.</p> : <p>Puoi già registrarti e preparare survey e obiettivi. Con un nuovo account verificato prima del lancio, il bonus sale a <strong>2 crediti extra</strong>, secondo le condizioni.</p>}
      <Link className="button secondary" href="/register">Crea il tuo account</Link>
    </div>
  </div></main>;
}
