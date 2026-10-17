"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {clientGet,clientPatch,clientPost} from '@/lib/api';
import {invitationSessionMarker,invitationStateLabel} from '@/lib/invitations';
import type {InvitationDetail} from '@/lib/types';
import {EmailSharingNotice} from './EmailSharingNotice';
import {InvitationSteps} from './InvitationFlowShell';
import styles from './Invitation.module.css';

export function InvitationProposal({invitationId}:{invitationId:string}){
  const router=useRouter(),owner=useRef(invitationSessionMarker()),generation=useRef(0),sending=useRef(false);
  const keys=useRef({accept:'',decline:''});
  const [value,setValue]=useState<InvitationDetail|null>(null),[sharing,setSharing]=useState(false),[available,setAvailable]=useState(false);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[attempt,setAttempt]=useState(0),[valid,setValid]=useState(true);
  const endpoint='/invitations/'+invitationId;
  const owns=(version:number)=>version===generation.current&&owner.current===invitationSessionMarker();
  useEffect(()=>{
    const version=++generation.current;
    clientGet<InvitationDetail>(endpoint).then(result=>{if(owns(version)){setValue(result);setError('');}})
      .catch(err=>{if(owns(version))setError(err.message||'Proposta non disponibile. Riprova.');});
    const refresh=()=>{
      if(owner.current!==invitationSessionMarker()){generation.current++;setValue(null);setSharing(false);setAvailable(false);setError('');setValid(false);}
      else if(!sending.current)setAttempt(current=>current+1);
    };
    window.addEventListener('socra:session-refresh',refresh);window.addEventListener('focus',refresh);
    return()=>{generation.current=version+1;window.removeEventListener('socra:session-refresh',refresh);window.removeEventListener('focus',refresh);};
  },[endpoint,attempt]);

  async function act(action:'accept'|'decline'){
    const version=generation.current;
    if(sending.current||!owns(version)||!value)return;
    if(action==='accept'&&(!sharing||(!value.prerequisite_state.mentor_available&&!available)))return;
    sending.current=true;setBusy(true);setError('');keys.current[action]||=crypto.randomUUID();
    try{
      if(action==='decline'){
        const result=await clientPost<InvitationDetail>(endpoint+'/decline',{idempotency_key:keys.current.decline});
        if(owns(version))setValue(result);
      }else{
        if(!value.prerequisite_state.mentor_available){
          await clientPatch('/profiles/me/mentor-status',{is_coach:true});
          if(!owns(version))return;
        }
        const result=await clientPost<{path_id:string}>(endpoint+'/accept',{idempotency_key:keys.current.accept,email_sharing_accepted:sharing});
        if(owns(version))router.push('/paths/'+result.path_id);
      }
    }catch(err){
      if(!owns(version))return;
      const current=await clientGet<InvitationDetail>(endpoint).catch(()=>null);if(!owns(version))return;
      if(action==='accept'&&current?.path_id){router.push('/paths/'+current.path_id);return;}
      if(current)setValue(current);
      if(!(action==='decline'&&current?.status==='declined'))setError(err instanceof Error?err.message:'Operazione non confermata. Riprova.');
    }finally{sending.current=false;if(owns(version))setBusy(false);}
  }

  if(!valid)return <p role="status">La sessione è cambiata. Ricarica la pagina per leggere la tua proposta.</p>;
  if(!value)return <section className="card stack">{error?<><p role="alert" className={styles.error}>{error}</p><button className="button primary" onClick={()=>setAttempt(current=>current+1)}>Riprova proposta</button></>:<p role="status">Caricamento della proposta…</p>}</section>;
  const requirements=value.prerequisite_state;
  const profileReady=requirements.email_verified&&requirements.onboarded&&requirements.skills_offered;
  const active=value.role==='recipient'&&!value.path_id&&!['expired','declined'].includes(value.status);
  const next='/inviti/'+invitationId;
  return <div className={styles.page}>
    {active?<InvitationSteps current={profileReady?3:1}/>:null}
    <article className={styles.proposal}>
      <header className={styles.proposalHeading}>
        <h1>{value.role==='recipient'?'La proposta di '+value.inviter_username:'Il tuo invito a '+value.recipient_email}</h1>
        <p>{value.role==='recipient'?'Ti chiede una mano su queste attività. Scopri la proposta e scegli se iniziare un percorso insieme.':'Hai invitato questa persona a condividere la sua esperienza sulle attività selezionate.'}</p>
      </header>
      <section className={styles.objectives} aria-label="Obiettivo del percorso"><h2>{value.topic}</h2><ul>{value.objective_labels.map(label=><li key={label}>{label}</li>)}</ul><p className={styles.note}>{value.discussion_mode_label}</p></section>
      {error?<p role="alert" className={styles.error}>{error}</p>:null}
      {value.path_id?<section className={styles.nextStep}><p role="status">{invitationStateLabel[value.status]||'Percorso iniziato'}</p><Link className="button primary" href={'/paths/'+value.path_id}>Apri il percorso</Link></section>
        :value.status==='expired'?<p role="status">Questo invito è scaduto. Chiedi alla persona che ti ha invitato di inviarti un nuovo link.</p>
        :value.status==='declined'?<p role="status">Hai rifiutato questo invito. Nessun percorso è stato aperto.</p>
        :value.role==='recipient'?<section className={styles.nextStep} aria-label="Prossimo passo">
          {!requirements.email_verified?<><h2>Conferma l’indirizzo dell’invito</h2><p>Riapri il link nell’email ricevuta per confermare questo indirizzo. In alternativa puoi richiedere la verifica dalle impostazioni.</p><Link className="button primary" href="/settings">Conferma la tua email</Link></>
          :!requirements.onboarded?<><h2>Prima, prepara il tuo profilo</h2><p>Indica la tua esperienza e su cosa ti fa piacere aiutare. Tornerai qui per confermare il percorso.</p><Link className="button primary" href={'/onboarding?next='+next}>Prepara il tuo profilo</Link></>
          :!requirements.skills_offered?<><h2>Scegli le attività su cui offrire aiuto</h2><p>Per iniziare, devi aver scelto di offrire aiuto sulle attività di questa proposta. Se non fanno per te, puoi rifiutare l’invito.</p><Link className="button primary" href={'/competenze?next='+next}>Rivedi le attività offerte</Link></>
          :<><h2>Pronto a iniziare?</h2><p>Con la conferma aprirete il percorso e potrete organizzare la prima chiacchierata.</p>
            {!requirements.mentor_available?<label className={styles.availability}><input type="checkbox" aria-label="Rendi disponibile il mio profilo come mentor" aria-describedby="invitation-availability-help" checked={available} disabled={busy} onChange={event=>setAvailable(event.target.checked)}/><span><strong>Rendi disponibile il mio profilo come mentor</strong><small id="invitation-availability-help">Potrai ricevere anche altre richieste. Puoi mettere in pausa la disponibilità dalle impostazioni.</small></span></label>:null}
            <EmailSharingNotice compact accepted={sharing} onChange={setSharing} disabled={busy}/>
            <button className="button primary" disabled={busy||!sharing||(!requirements.mentor_available&&!available)} aria-busy={busy} onClick={()=>void act('accept')}>{busy?'Apertura del percorso…':'Accetta e inizia il percorso'}</button>
          </>}
        </section>:<p role="status">{invitationStateLabel[value.status]||'In attesa di risposta'}</p>}
      <details className={styles.benefits}><summary>Crediti e bonus</summary><div><p>Il mentor riceve 1 credito al completamento. Questo percorso non usa i crediti dell’invitante.</p><p>{value.bonus_eligible===true?'Quando completerete il primo percorso insieme, riceverete anche 3 coin bonus ciascuno.':value.bonus_eligible===false?'Il bonus per nuovi iscritti non si applica a questo invito.':'Il bonus di 3 coin ciascuno al completamento vale solo per persone nuove su Socra.'}</p></div></details>
      <footer className={styles.proposalFooter}>{active?<button className={styles.quietButton} disabled={busy} onClick={()=>void act('decline')}>Rifiuta invito</button>:<Link className={styles.link} href="/inviti?elenco=1">I tuoi inviti</Link>}</footer>
    </article>
  </div>;
}
