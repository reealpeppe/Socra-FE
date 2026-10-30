"use client";
import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {launchPost} from "@/lib/prelaunch";
import styles from "./Prelaunch.module.css";
export function PrelaunchTokenAction({action}:{action:"confirm"|"unsubscribe"}) {
  const token=useRef<string|null>(null);
  const [hasToken,setHasToken]=useState(false);
  const [ready,setReady]=useState(false),[success,setSuccess]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
  useEffect(() => {
    if(!token.current) token.current=new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(window.history.state,"",window.location.pathname);
    const present=Boolean(token.current);
    queueMicrotask(()=>{setHasToken(present);setReady(true);});
  },[]);
  async function submit() {
    if(!token.current || busy)return;
    setBusy(true);setError(null);
    try {await launchPost(action,{token:token.current});token.current=null;setSuccess(true);}
    catch(reason){setError(reason instanceof Error ? reason.message : "Operazione non riuscita.");}
    finally{setBusy(false);}
  }
  const confirming=action==="confirm";
  return <main className={styles.page} id="main-content"><div className={styles.content}>
    <h1>{confirming ? "Ci sentiamo al lancio." : "Annulla l’avviso di apertura"}</h1>
    {success ? <div className={styles.success} role="status">{confirming ? "Indirizzo confermato. Ti avviseremo via email prima del lancio di Socra." : "Richiesta annullata. Non riceverai l’avviso su questo indirizzo."}</div>
      : !ready ? <p role="status">Preparazione del link…</p> : !hasToken ? <p role="alert">Il link è incompleto. <Link href="/prelancio">Torna alla richiesta di avviso</Link>.</p>
      : <><p>{confirming ? "Conferma il tuo indirizzo per ricevere l’avviso di apertura e riservare il bonus previsto dalle condizioni." : "Conferma per rimuovere il tuo indirizzo dalla lista degli avvisi. Il tuo eventuale account Socra resterà disponibile."}</p>
        <button className="button dark" disabled={busy} onClick={()=>void submit()}>{busy ? "Conferma…" : confirming ? "Conferma il mio indirizzo" : "Annulla la richiesta"}</button></>}
    {error ? <p role="alert" className={styles.error}>{error}</p>:null}
    <div className={styles.secondary}><Link className="button secondary" href="/register">Crea il tuo account</Link> <p><Link href="/prelancio/condizioni">Condizioni dei bonus</Link></p></div>
  </div></main>;
}
