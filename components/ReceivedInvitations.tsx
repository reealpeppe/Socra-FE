"use client";
import Link from 'next/link';
import {useRouter} from 'next/navigation';
import {useEffect,useRef,useState} from 'react';
import {clientGet,clientPost} from '@/lib/api';
import type {InvitationDetail} from '@/lib/types';
import {invitationSessionMarker,invitationStateLabel} from '@/lib/invitations';
import {invitationContextRequest} from './InvitationLanding';
import {invitationDelivery} from './InvitationDialog';
import styles from './Invitation.module.css';

export function ReceivedInvitations(){
  const router=useRouter(),owner=useRef(invitationSessionMarker()),generation=useRef(0),keys=useRef<Record<string,string>>({});
  const [received,setReceived]=useState<InvitationDetail[]>([]),[sent,setSent]=useState<InvitationDetail[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0),[busy,setBusy]=useState(''),[message,setMessage]=useState(''),[valid,setValid]=useState(true);
  const owns=(version:number)=>version===generation.current&&owner.current===invitationSessionMarker();
  useEffect(()=>{
    const version=++generation.current;
    async function load(){
      try{
        const context=await invitationContextRequest<{invitation:InvitationDetail|null}>('/api/invitations/claim',{});
        if(!owns(version))return;
        if(context.invitation){router.replace('/inviti/'+context.invitation.id);return;}
        const [incoming,outgoing]=await Promise.all([clientGet<InvitationDetail[]>('/invitations/received'),clientGet<InvitationDetail[]>('/invitations/sent')]);
        if(!owns(version))return;
        const active=incoming.filter(item=>item.status==='claimed');
        if(active.length===1&&new URLSearchParams(window.location.search).get('elenco')!=='1'){router.replace('/inviti/'+active[0].id);return;}
        setReceived(incoming);setSent(outgoing);setError('');setLoading(false);
      }catch(err){if(owns(version)){setError(err instanceof Error?err.message:'Inviti non disponibili. Riprova.');setLoading(false);}}
    }
    void load();
    const reset=()=>{if(owner.current!==invitationSessionMarker()){generation.current++;setReceived([]);setSent([]);setError('');setMessage('');setValid(false);}};
    window.addEventListener('socra:session-refresh',reset);
    return()=>{generation.current=version+1;window.removeEventListener('socra:session-refresh',reset);};
  },[attempt,router]);
  async function resend(id:string){
    if(busy||!valid)return;const version=generation.current;if(!owns(version))return;
    setBusy(id);setError('');setMessage('');keys.current[id]??=crypto.randomUUID();
    try{
      const value=await clientPost<InvitationDetail>(`/invitations/${id}/resend`,{idempotency_key:keys.current[id]});
      if(!owns(version))return;
      setSent(current=>current.map(item=>item.id===id?value:item));delete keys.current[id];setMessage(invitationDelivery(value.delivery_status));
    }catch(err){if(owns(version))setError(err instanceof Error?err.message:'Reinvio non confermato. Riprova per verificare lo stesso invito.');}
    finally{if(owns(version))setBusy('');}
  }
  return <div className={styles.page}><h1>I tuoi inviti</h1>{!valid?<p role="status">La sessione è cambiata. Ricarica la pagina per leggere i tuoi inviti.</p>:<>
    {loading?<p role="status">Caricamento dei tuoi inviti…</p>:null}
    {error?<div className="card stack"><p role="alert" className={styles.error}>{error}</p><div className={styles.controls}><button className="button secondary" onClick={()=>{setLoading(true);setAttempt(value=>value+1);}}>Riprova</button><Link className={styles.link} href="/login?next=/inviti">Accedi con un altro account</Link></div></div>:null}
    {message?<p role="status" className={styles.success}>{message}</p>:null}
    {!loading&&!error?<>
      <section className="card stack"><h2>Proposte ricevute</h2>{!received.length?<p className={styles.note}>Non hai inviti associati a questo account. Apri il link ricevuto via email per leggere la proposta.</p>:received.map(item=><article className={styles.row} key={item.id}><strong>{item.inviter_username} · {item.topic}</strong><p>{invitationStateLabel[item.status]||item.status}</p><Link className="button secondary" href={'/inviti/'+item.id}>Apri proposta</Link></article>)}</section>
      <section className="card stack"><h2>Inviti inviati</h2>{!sent.length?<p className={styles.note}>Puoi invitare qualcuno dalla pagina <Link className={styles.link} href="/matching">Trova un mentor</Link>.</p>:sent.map(item=><article className={styles.row} key={item.id}><strong>{item.recipient_email}</strong><p>{item.topic} · {invitationStateLabel[item.status]||item.status}</p><p className={styles.note}>{invitationDelivery(item.delivery_status)}</p>{item.path_id?<Link className="button secondary" href={'/paths/'+item.path_id}>Apri percorso</Link>:['pending','claimed','expired'].includes(item.status)?<button className="button secondary" disabled={!!busy} onClick={()=>void resend(item.id)}>{busy===item.id?'Reinvio…':'Reinvia invito'}</button>:null}</article>)}</section>
    </>:null}
  </>}<Link className={styles.link} href="/matching">Trova un mentor</Link></div>;
}
