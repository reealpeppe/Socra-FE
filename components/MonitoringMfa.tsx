"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./MonitoringMfa.module.css";

type Setup={secret:string;qr_svg:string};

export function MonitoringMfa({enrolled}:{enrolled:boolean}) {
  const [setup,setSetup]=useState<Setup|null>(null);
  const [password,setPassword]=useState("");
  const [code,setCode]=useState("");
  const [recovery,setRecovery]=useState(false);
  const [codes,setCodes]=useState<string[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  useEffect(()=>{
    const clear=()=>{setSetup(null);setCodes([]);setPassword("");setCode("");location.replace("/admin/monitoraggio/verifica");};
    const restored=(event:PageTransitionEvent)=>{if(event.persisted)clear();};
    const changed=(event:StorageEvent)=>{if(event.key==="socra-session-change")clear();};
    addEventListener("pageshow",restored);addEventListener("storage",changed);
    return ()=>{removeEventListener("pageshow",restored);removeEventListener("storage",changed);};
  },[]);
  async function submit(event:FormEvent) {
    event.preventDefault();setBusy(true);setError("");
    const action=enrolled?"verify":setup?"confirm":"enroll";
    try {
      const response=await fetch(`/api/monitoring/mfa/${action}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(action==="enroll"?{password}:{code}),cache:"no-store"});
      const body=await response.json();
      if(response.status===401){location.assign("/login?next=/admin/monitoraggio");return;}
      if(!response.ok) throw new Error(body.detail || "Verifica non riuscita");
      setPassword("");setCode("");
      if(action==="enroll") setSetup(body);
      else if(body.recovery_codes){setSetup(null);setCodes(body.recovery_codes);}
      else location.assign("/admin/monitoraggio");
    } catch(reason) {setError(reason instanceof Error?reason.message:"Verifica non riuscita. Riprova.");}
    finally {setBusy(false);}
  }
  return <main className={styles.page}><section className={styles.card} aria-labelledby="monitor-title">
    <Link className={styles.brand} href="/">socra<span>.</span><small>MONITOR</small></Link>
    <p className={styles.eyebrow}>ACCESSO RISERVATO</p>
    <h1 id="monitor-title">{codes.length?"Conserva i codici di recupero.":enrolled?"Un ultimo passo per entrare.":"Proteggi il tuo accesso."}</h1>
    {codes.length?<><p>Questi dieci codici vengono mostrati una sola volta. Salvali nel tuo password manager: ognuno funziona una sola volta se perdi l’app autenticatore.</p><ul className={styles.codes}>{codes.map(value=><li key={value}><code>{value}</code></li>)}</ul><button onClick={()=>{setCodes([]);location.replace("/admin/monitoraggio");}}>Ho salvato i codici · Apri dashboard</button></>:<>
      <p>{enrolled?"Inserisci il codice della tua app autenticatore. Lo sblocco dura al massimo 15 minuti.":setup?"Scansiona il QR con la tua app autenticatore, poi inserisci il primo codice per confermare.":"Configura la tua app autenticatore. Per iniziare, conferma la password dell’account Socra con cui hai effettuato l’accesso."}</p>
      {setup?<div className={styles.setup}>
        {/* Generated entirely on our backend, rendered as an image without HTML injection. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={220} height={220} src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(setup.qr_svg)}`} alt="QR per configurare l’app autenticatore" />
        <details><summary>Configura manualmente</summary><p>Socra Monitor · TOTP, 6 cifre, 30 secondi</p><code>{setup.secret}</code></details>
      </div>:null}
      <form onSubmit={submit}>
        {!enrolled&&!setup?<label>Password Socra<input type="password" autoComplete="current-password" required maxLength={1024} value={password} onChange={event=>setPassword(event.target.value)} /></label>:<label>{recovery?"Codice di recupero":"Codice dell’app autenticatore"}<input type="text" inputMode={recovery?"text":"numeric"} autoComplete="one-time-code" pattern={recovery?"[a-fA-F0-9]{24}":"[0-9]{6}"} maxLength={recovery?24:6} required value={code} onChange={event=>setCode(event.target.value.replace(/\s/g,""))} /></label>}
        {error?<p role="alert" className={styles.error}>{error}</p>:null}
        <button disabled={busy} type="submit">{busy?"Verifica in corso…":!enrolled&&!setup?"Configura autenticatore":"Verifica e accedi"}</button>
      </form>
      {enrolled?<button className={styles.secondary} type="button" onClick={()=>{setRecovery(!recovery);setCode("");setError("");}}>{recovery?"Usa l’app autenticatore":"Usa un codice di recupero"}</button>:null}
    </>}
    <a className={styles.back} href="/dashboard">← Torna a Socra</a>
  </section></main>;
}
