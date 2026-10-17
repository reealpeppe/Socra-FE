"use client";

import Link from "next/link";
import {useEffect,useRef,useState} from "react";
import {CheckCircle2,X} from "lucide-react";
import {clientGet,clientPost} from "@/lib/api";
import type {Goal,InvitationDetail} from "@/lib/types";
import {EmailSharingNotice} from "./EmailSharingNotice";
import styles from "./Invitation.module.css";

function marker(){try{return localStorage.getItem('socra-session-change');}catch{return null;}}
export function invitationDelivery(status:string|null){
  if(status==='sent')return 'Email inviata';
  if(status==='suppressed')return 'Invito salvato. L’invio email non è disponibile in questo momento.';
  if(status==='failed'||status==='cancelled')return 'Invito salvato. L’email non è stata inviata: puoi riprovare dalla pagina dei tuoi inviti.';
  return 'Invito in coda. Riceverai aggiornamenti sullo stato dalla pagina dei tuoi inviti.';
}

export function InvitationDialog({goals,onClose,onCreated}:{goals:Goal[];onClose:()=>void;onCreated?:(value:InvitationDetail)=>void}){
  const available=goals.filter(goal=>goal.is_active!==false&&goal.objective_codes?.length);
  const [email,setEmail]=useState(''),[goalId,setGoalId]=useState(available.length===1?available[0].id:''),[agreed,setAgreed]=useState<string[]>([]);
  const [sharing,setSharing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[result,setResult]=useState<InvitationDetail|null>(null),[validSession,setValidSession]=useState(true);
  const dialog=useRef<HTMLDialogElement>(null),input=useRef<HTMLInputElement>(null),request=useRef<{fingerprint:string;key:string}|null>(null);
  const owner=useRef(marker()),mounted=useRef(true),sending=useRef(false);
  const goal=available.find(value=>value.id===goalId);
  const owns=()=>mounted.current&&owner.current===marker();
  useEffect(()=>{
    mounted.current=true;const trigger=document.activeElement;
    dialog.current?.showModal();input.current?.focus();
    const current=dialog.current;
    const reset=()=>{if(owner.current!==marker()){setValidSession(false);setResult(null);setEmail('');setError('');}};
    window.addEventListener('socra:session-refresh',reset);
    return()=>{mounted.current=false;window.removeEventListener('socra:session-refresh',reset);current?.close();if(trigger instanceof HTMLElement&&trigger.isConnected)trigger.focus();};
  },[]);
  async function submit(event:React.FormEvent){
    event.preventDefault();if(sending.current||!owns()||!goal||!agreed.length||!sharing)return;
    sending.current=true;setBusy(true);setError('');
    const payload={email:email.trim().toLowerCase(),goal_id:goal.id,objective_codes:[...agreed].sort(),email_sharing_accepted:true};
    const fingerprint=JSON.stringify(payload);
    if(request.current?.fingerprint!==fingerprint)request.current={fingerprint,key:crypto.randomUUID()};
    const key=request.current.key;
    function confirm(value:InvitationDetail){if(owns()){setResult(value);onCreated?.(value);}}
    try{confirm(await clientPost<InvitationDetail>('/invitations',{...payload,idempotency_key:key}));}
    catch(err){
      if(!owns())return;
      const sent=await clientGet<InvitationDetail[]>('/invitations/sent').catch(()=>null);
      if(!owns())return;
      const saved=sent?.find(item=>item.creation_key===key);
      if(saved)confirm(saved);else setError(err instanceof Error?err.message:'Non abbiamo confermato l’invio. Riprova: conserveremo lo stesso invito.');
    }finally{sending.current=false;if(owns())setBusy(false);}
  }
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="invitation-title" onCancel={event=>{event.preventDefault();if(!busy)onClose();}}>
    <form className={styles.form} onSubmit={submit}>
      <header className={styles.header}><h2 id="invitation-title">Invita qualcuno su Socra</h2><button className={styles.close} type="button" aria-label="Chiudi invito" disabled={busy&&validSession} onClick={onClose}><X size={20} aria-hidden="true"/></button></header>
      {!validSession?<p role="status">La sessione è cambiata. Chiudi e ricarica la pagina prima di creare un invito.</p>:result?<>
        <div className={styles.success} role="status"><CheckCircle2 size={26} aria-hidden="true"/><p>{invitationDelivery(result.delivery_status)}</p><p>{result.recipient_email}</p></div>
        <p className={styles.note}>{result.delivery_status==='sent'?'Nell’email, la persona troverà la tua proposta e potrà scegliere se iniziare il percorso con te.':'Controlla lo stato dell’email dalla pagina dei tuoi inviti.'}</p><Link className="button secondary" href="/inviti">Gestisci i tuoi inviti</Link>
      </>:!available.length?<p className={styles.note}>Per invitare qualcuno, <Link className={styles.link} href="/goal">scegli prima un obiettivo</Link> con le attività su cui vuoi confrontarti.</p>:<>
        <p className={styles.note}>Invita una persona che conosci a condividere la sua esperienza. Le invieremo un’email a tuo nome.</p>
        <div className={styles.field}><label htmlFor="invitation-email">Email della persona da invitare</label><input ref={input} id="invitation-email" type="email" autoComplete="off" maxLength={255} required value={email} disabled={busy} onChange={event=>setEmail(event.target.value)}/></div>
        <div className={styles.field}><label htmlFor="invitation-goal">Tema del confronto</label><select id="invitation-goal" required value={goalId} disabled={busy} onChange={event=>{setGoalId(event.target.value);setAgreed([]);}}><option value="" disabled>Scegli un tema</option>{available.map(value=><option key={value.id} value={value.id}>{value.topic}</option>)}</select></div>
        {goal?<fieldset className={styles.fieldset} disabled={busy}><legend>Su cosa vuoi lavorare insieme?</legend>{goal.objective_codes?.map((code,index)=><label key={code} className={styles.choice}><input type="checkbox" checked={agreed.includes(code)} onChange={event=>setAgreed(current=>event.target.checked?[...current,code]:current.filter(item=>item!==code))}/><span>{goal.objective_labels?.[index]||code}</span></label>)}</fieldset>:null}
        <div className={styles.terms}><p>Il vostro primo percorso da invito non userà i tuoi crediti.</p><p>Se è una persona nuova su Socra, al completamento riceverete <strong>3 coin bonus ciascuno</strong>. L’invitato riceve anche il normale credito per il percorso svolto come mentor.</p></div>
        <EmailSharingNotice compact accepted={sharing} onChange={setSharing} disabled={busy}/>
        {error?<p role="alert" className={styles.error}>{error}</p>:null}
        <footer className={styles.footer}><button className="button secondary" type="button" disabled={busy} onClick={onClose}>Annulla</button><button className="button primary" type="submit" disabled={busy||!email.trim()||!agreed.length||!sharing||!goal} aria-busy={busy}>{busy?'Invio…':'Invia invito'}</button></footer>
      </>}
    </form>
  </dialog>;
}
