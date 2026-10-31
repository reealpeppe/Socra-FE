"use client";
import {useEffect,useState} from "react";
import {clientGet,clientPost,refreshClientSession} from "@/lib/api";
import {Card,PageHeader} from "@/components/Ui";
import {PrelaunchScheduleEditor,type LaunchSchedule} from './PrelaunchScheduleEditor';
type Snapshot={phase:"prelaunch"|"open";campaign_enabled:boolean;email_delivery_enabled:boolean;subscribers:number;
  confirmed:number;registered:number;verified_registrations:number;redeem_until:string|null;
  readiness:{prepared_accounts:number;with_match:number;without_match:number;by_topic:Record<string,{goals:number;goals_with_match:number}>};
  mail:Record<string,number>;schedule:LaunchSchedule};
export function PrelaunchAdmin(){
  const [data,setData]=useState<Snapshot|null>(null),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
  const [confirmation,setConfirmation]=useState(""),[busy,setBusy]=useState(false);
  async function load(){try{setData(await clientGet<Snapshot>("/prelaunch/admin/summary"));setError(null);}catch(reason){setError(reason instanceof Error?reason.message:"Caricamento non riuscito.");}}
  useEffect(()=>{let active=true;clientGet<Snapshot>("/prelaunch/admin/summary").then(value=>{if(active)setData(value);}).catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Caricamento non riuscito.");});return()=>{active=false;};},[]);
  async function act(action:"open"|"announce"){
    setBusy(true);setMessage(null);setError(null);
    try{
      await clientPost("/prelaunch/admin/"+action,{confirm:confirmation});
      setConfirmation("");refreshClientSession();await load();
      setMessage(action==="open"?"Socra è aperta. Bonus registrati e avvisi accodati.":"Avviso prima del lancio accodato. L’accesso resta chiuso.");
    }catch(reason){setError(reason instanceof Error?reason.message:"Operazione non riuscita.");}
    finally{setBusy(false);}
  }
  return <div className="stack">
    <PageHeader title="Pre-lancio Socra"><p>Adesioni, preparazione della community e apertura degli scambi.</p></PageHeader>
    {error?<p role="alert" className="error">{error}</p>:null}
    {message?<p role="status">{message}</p>:null}
    {!data?<p role="status">Caricamento del riepilogo…</p>:<>
      <Card><h2>{data.phase==="prelaunch"?"Gli scambi sono ancora chiusi":"Socra è aperta"}</h2>
        {!data.campaign_enabled?<p>La modalità pre-lancio è disattivata in questo ambiente.</p>:null}
        {!data.email_delivery_enabled?<p><strong>Anteprima: invio email disattivato.</strong> Gli avvisi creati qui non verranno spediti, neppure riattivando l’invio.</p>:null}
        <dl><dt>Email raccolte</dt><dd>{data.subscribers}</dd><dt>Indirizzi confermati</dt><dd>{data.confirmed}</dd>
          <dt>Account del pre-lancio</dt><dd>{data.registered}</dd><dt>Account verificati prima dell’apertura</dt><dd>{data.verified_registrations}</dd></dl>
      </Card>
      <Card><h2>Possibilità di iniziare uno scambio</h2>
        <p>{data.readiness.prepared_accounts} persone hanno un account verificato, esperienza e obiettivi compatibili con i requisiti attuali.</p>
        <p><strong>{data.readiness.with_match}</strong> hanno almeno un mentor potenzialmente compatibile; <strong>{data.readiness.without_match}</strong> non ne hanno ancora uno.</p>
        <p className="muted">La compatibilità usa le regole del matching corrente. Non garantisce che le persone saranno disponibili al lancio.</p>
        {Object.keys(data.readiness.by_topic).length?<table><caption>Copertura per tema</caption><thead><tr><th>Tema</th><th>Obiettivi</th><th>Con un candidato</th></tr></thead><tbody>
          {Object.entries(data.readiness.by_topic).map(([topic,row])=><tr key={topic}><td>{topic}</td><td>{row.goals}</td><td>{row.goals_with_match}</td></tr>)}
        </tbody></table>:null}
      </Card>
      <Card><h2>Avvisi email</h2><p>In coda: {data.mail.pending+data.mail.retry} · Accettati dal servizio email: {data.mail.sent} · Da controllare: {data.mail.failed} · Invio disattivato: {data.mail.suppressed}</p>
        <p className="muted">L’accettazione del servizio email non certifica la consegna nella casella. Secondo servizio a consumo e capacità d’invio da definire prima della raccolta reale.</p></Card>
      {data.campaign_enabled&&data.phase==='prelaunch'&&data.schedule?<Card><PrelaunchScheduleEditor initial={data.schedule} onSaved={load}/></Card>:null}
      {data.campaign_enabled && data.phase==="prelaunch"?<Card><h2>Scegli il prossimo passo</h2>
        <p>Prima avvisa gli iscritti che il lancio si avvicina; quando decidi di partire, apri gli scambi. L’apertura di questa campagna è definitiva e assegna i bonus spettanti.</p>
        <label htmlFor="launch-confirm">Scrivi <strong>AVVISA GLI ISCRITTI</strong> oppure <strong>APRI SOCRA</strong></label>
        <input id="launch-confirm" className="input" value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/>
        <div className="actions"><button className="button secondary" disabled={busy||confirmation!=="AVVISA GLI ISCRITTI"} onClick={()=>void act("announce")}>Avvisa prima del lancio</button>
          <button className="button dark" disabled={busy||confirmation!=="APRI SOCRA"} onClick={()=>void act("open")}>Apri gli scambi</button></div>
      </Card>:null}
      <button className="button secondary" onClick={()=>void load()} disabled={busy}>Aggiorna il riepilogo</button>
    </>}
  </div>;
}
