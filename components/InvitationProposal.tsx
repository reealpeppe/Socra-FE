"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {clientGet,clientPatch,clientPost} from '@/lib/api';
import {invitationSessionMarker,invitationStateLabel} from '@/lib/invitations';
import type {InvitationDetail} from '@/lib/types';
import {EmailSharingNotice} from './EmailSharingNotice';
import styles from './Invitation.module.css';

export function InvitationProposal({invitationId}:{invitationId:string}){
  const router=useRouter(),owner=useRef(invitationSessionMarker()),generation=useRef(0),sending=useRef(false),key=useRef('');
  const [value,setValue]=useState<InvitationDetail|null>(null),[sharing,setSharing]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[valid,setValid]=useState(true);
  const endpoint='/invitations/'+invitationId;
  const owns=(version:number)=>version===generation.current&&owner.current===invitationSessionMarker();
  useEffect(()=>{
    const version=++generation.current;
    clientGet<InvitationDetail>(endpoint).then(result=>{if(owns(version)){setValue(result);setError('');}}).catch(err=>{if(owns(version))setError(err.message||'Proposta non disponibile. Riprova.');});
    const refresh=()=>{if(owner.current!==invitationSessionMarker()){generation.current++;setValue(null);setError('');setSharing(false);setValid(false);}else if(!sending.current)setAttempt(current=>current+1);};
    window.addEventListener('socra:session-refresh',refresh);
    return()=>{generation.current=version+1;window.removeEventListener('socra:session-refresh',refresh);};
  },[endpoint,attempt]);
  async function act(action:'accept'|'decline'|'available'){
    const version=generation.current;if(sending.current||!owns(version)||!value)return;
    sending.current=true;setBusy(true);setError('');key.current||=crypto.randomUUID();
    try{
      if(action==='available'){await clientPatch('/profiles/me/mentor-status',{is_coach:true});if(owns(version))setAttempt(current=>current+1);}
      else if(action==='decline'){const result=await clientPost<InvitationDetail>(endpoint+'/decline',{idempotency_key:key.current});if(owns(version))setValue(result);}
      else {const result=await clientPost<{path_id:string}>(endpoint+'/accept',{idempotency_key:key.current,email_sharing_accepted:sharing});if(owns(version))router.push('/paths/'+result.path_id);}
    }catch(err){
      if(!owns(version))return;
      const current=await clientGet<InvitationDetail>(endpoint).catch(()=>null);if(!owns(version))return;
      if(action==='accept'&&current?.path_id){router.push('/paths/'+current.path_id);return;}
      if(current)setValue(current);
      if(!(action==='decline'&&current?.status==='declined'))setError(err instanceof Error?err.message:'Operazione non confermata. Riprova.');
    }finally{sending.current=false;if(owns(version))setBusy(false);}
  }
  if(!valid)return <p role="status">La sessione è cambiata. Ricarica la pagina per leggere la tua proposta.</p>;
  if(!value)return <div className="card stack">{error?<><p role="alert" className={styles.error}>{error}</p><button className="button secondary" onClick={()=>setAttempt(current=>current+1)}>Riprova proposta</button></>:<p role="status">Caricamento della proposta…</p>}</div>;
  const requirements=value.prerequisite_state;
  const ready=['email_verified','onboarded','skills_offered','mentor_available'].every(item=>requirements[item]);
  const next='/inviti/'+invitationId;
  return <div className={styles.page}><Link className={styles.link} href="/inviti?elenco=1">I tuoi inviti</Link><section className="card stack">
    <h1>{value.role==='recipient'?`La proposta di ${value.inviter_username}`:`Il tuo invito a ${value.recipient_email}`}</h1>
    <p>{value.role==='recipient'?'Ti propone di condividere la tua esperienza come mentor su queste attività.':'Hai invitato questa persona a fare da mentor sulle attività selezionate.'}</p>
    <h2>{value.topic}</h2><ul>{value.objective_labels.map(label=><li key={label}>{label}</li>)}</ul><p className={styles.note}>{value.discussion_mode_label}</p>
    <div className={styles.terms}><p>Questo percorso non userà i crediti dell’invitante. Il mentor riceve il normale credito al completamento.</p><p>{value.bonus_eligible===true?'Quando completerete il primo percorso insieme, riceverete anche 3 coin bonus ciascuno.':value.bonus_eligible===false?'Il bonus per nuovi iscritti non si applica a questo invito.':'Il bonus di 3 coin ciascuno al completamento vale solo per persone nuove su Socra.'}</p></div>
    {error?<p role="alert" className={styles.error}>{error}</p>:null}
    {value.path_id?<><p role="status">{invitationStateLabel[value.status]||'Percorso iniziato'}</p><Link className="button primary" href={'/paths/'+value.path_id}>Apri il percorso</Link></>:value.status==='expired'?<p role="status">Questo invito è scaduto. Chiedi alla persona che ti ha invitato di inviarti un nuovo link.</p>:value.status==='declined'?<p role="status">Hai rifiutato questo invito. Nessun percorso è stato aperto.</p>:value.role==='recipient'?<>
      {!ready?<div className="stack"><h2>Prima di iniziare</h2><p className={styles.note}>La proposta resta qui mentre completi i passaggi. Potrai confermare il percorso quando sarai pronto.</p>
        {!requirements.onboarded?<Link className="button primary" href={'/onboarding?next='+next}>Continua con la survey</Link>:!requirements.skills_offered?<Link className="button primary" href={'/competenze?next='+next}>Rivedi le attività offerte</Link>:null}
        {!requirements.email_verified?<Link className="button secondary" href="/settings">Conferma la tua email</Link>:null}
        {requirements.onboarded&&requirements.skills_offered&&!requirements.mentor_available?<button className="button primary" disabled={busy} onClick={()=>void act('available')}>Attiva disponibilità come mentor</button>:null}
        <button className="button secondary" disabled={busy} onClick={()=>setAttempt(current=>current+1)}>Ho completato i passaggi: aggiorna</button>
      </div>:<><EmailSharingNotice compact accepted={sharing} onChange={setSharing} disabled={busy}/><button className="button primary" disabled={busy||!sharing} aria-busy={busy} onClick={()=>void act('accept')}>{busy?'Conferma…':'Accetta e inizia il percorso'}</button></>}
      <button className="button secondary" disabled={busy} onClick={()=>void act('decline')}>Rifiuta invito</button>
    </>:<p role="status">{invitationStateLabel[value.status]||'In attesa di risposta'}</p>}
  </section></div>;
}
