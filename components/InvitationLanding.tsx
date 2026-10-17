"use client";
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import type {InvitationPreview} from '@/lib/types';
import styles from './Invitation.module.css';

export async function invitationContextRequest<T>(path:string,body?:object,method?:'DELETE'):Promise<T>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
  try{
    const response=await fetch(path,{method:method??(body?'POST':'GET'),credentials:'include',cache:'no-store',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:controller.signal});
    const data=await response.json();if(!response.ok)throw new Error(typeof data.detail==='string'?data.detail:'Invito non disponibile. Riprova.');return data;
  }finally{clearTimeout(timer);}
}

export function InvitationLanding(){
  const token=useRef<string|null>(null),started=useRef(false);
  const [preview,setPreview]=useState<InvitationPreview|null>(null),[error,setError]=useState(''),[attempt,setAttempt]=useState(0);
  useEffect(()=>{
    let active=true;
    if(!started.current){token.current=new URLSearchParams(window.location.hash.slice(1)).get('token');window.history.replaceState(window.history.state,'',window.location.pathname);started.current=true;}
    invitationContextRequest<InvitationPreview>('/api/invitations/context',token.current?{token:token.current}:undefined)
      .then(value=>{if(active){setPreview(value);token.current=null;setError('');}})
      .catch(err=>{if(active)setError(err instanceof Error?err.message:'Invito non disponibile. Riprova.');});
    return()=>{active=false;};
  },[attempt]);
  return <main id="main-content" tabIndex={-1} className={`${styles.page} ${styles.landing}`}>
    {!preview?<section className="card stack">{error?<><h1>Non riusciamo ad aprire l’invito</h1><p className={styles.error} role="alert">{error}</p><button className="button secondary" onClick={()=>setAttempt(value=>value+1)}>Riprova invito</button></>:<p role="status">Preparazione della tua proposta…</p>}</section>:<section className="card stack">
      <h1>{preview.inviter_username} ti invita su Socra</h1><p>La tua esperienza potrebbe aiutarlo a imparare qualcosa di nuovo. Ti va di dargli una mano?</p>
      <h2>{preview.topic}</h2><ul>{preview.objective_labels.map(label=><li key={label}>{label}</li>)}</ul><p className={styles.note}>{preview.discussion_mode_label}</p>
      {preview.status==='expired'?<p role="status">Questo invito è scaduto. Chiedi alla persona che ti ha invitato di inviarti un nuovo link.</p>:preview.status==='declined'?<p role="status">Questo invito è stato rifiutato.</p>:<>
        <p>Leggi la proposta e scegli se iniziare un percorso insieme. Prima di aprirlo, confermerai l’email e compilerai la survey sulle tue esperienze.</p>
        <p className={styles.note}>Se non eri ancora su Socra quando è partito l’invito, al completamento del primo percorso riceverete 3 coin bonus ciascuno. Come mentor riceverai anche il normale credito per il percorso.</p>
        <div className={styles.controls}><Link className="button primary" href="/register?next=/inviti">Crea account e scopri la proposta</Link><Link className="button secondary" href="/login?next=/inviti">Ho già un account</Link></div>
      </>}
    </section>}
    <p className={styles.note}>Socra è una community di apprendimento peer-to-peer sugli investimenti. <Link className={styles.link} href="/come-funziona">Scopri come funziona</Link></p>
  </main>;
}
