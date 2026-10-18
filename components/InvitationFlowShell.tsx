"use client";

import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {Brand} from './Brand';
import {clientGet,ClientApiError} from '@/lib/api';
import {invitationSessionMarker} from '@/lib/invitations';
import styles from './InvitationFlowShell.module.css';

export function InvitationSteps({current}:{current:1|2|3}){
  return <ol className={styles.steps} aria-label="Passaggi per iniziare">{['Invito','Profilo','Conferma'].map((label,index)=><li key={label} aria-current={current===index+1?'step':undefined} data-complete={current>index+1||undefined}><span aria-hidden>{index+1}</span>{label}</li>)}</ol>;
}

export function InvitationFlowShell({children,returnTo}:{children:React.ReactNode;returnTo:string}){
  const [state,setState]=useState<'loading'|'ready'|'login'|'error'>('loading');
  const [attempt,setAttempt]=useState(0);
  const owner=useRef(invitationSessionMarker());
  useEffect(()=>{
    let active=true,generation=0;
    const refresh=()=>{
      const current=++generation,marker=invitationSessionMarker();
      if(owner.current!==marker){owner.current=marker;setState('loading');}
      clientGet('/auth/me').then(()=>{if(active&&current===generation)setState('ready');})
        .catch(error=>{if(active&&current===generation)setState(error instanceof ClientApiError&&error.status===401?'login':'error');});
    };
    refresh();window.addEventListener('socra:session-refresh',refresh);
    return()=>{active=false;generation++;window.removeEventListener('socra:session-refresh',refresh);};
  },[attempt]);
  return <div className={`app-shell ${styles.shell}`}>
    <a className="skip-link" href="#main-content">Vai al contenuto principale</a>
    <header className={styles.header}><Link href="/" aria-label="Socra, pagina iniziale"><Brand variant="dark"/></Link><Link className={styles.exit} href="/dashboard">Torna a Socra</Link></header>
    <main id="main-content" tabIndex={-1} className={styles.main}>
      {state==='ready'?children:state==='loading'?<p role="status">Prepariamo il tuo invito…</p>:<section className="card stack"><h1>{state==='login'?'Accedi per aprire l’invito':'Non riusciamo a caricare il tuo account'}</h1>
        {state==='login'?<Link className="button primary" href={'/login?next='+encodeURIComponent(returnTo)}>Accedi</Link>:<button className="button primary" onClick={()=>setAttempt(value=>value+1)}>Riprova</button>}
      </section>}
    </main>
  </div>;
}
