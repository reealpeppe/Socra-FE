"use client";
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {clientGet,clientPost} from '@/lib/api';
import {useDiscoveryImpressions} from '@/lib/use-discovery-impressions';
import {AlignmentDialog} from './AlignmentDialog';
import {UserAvatar} from './Ui';
import type {AggregateCandidate,CandidatePage,MatchRequestItem,UserMe} from '@/lib/types';
import styles from './SkillLearning.module.css';

function marker(){try{return localStorage.getItem('socra-session-change');}catch{return null;}}

export function AggregateMatching({role='mentor'}:{role?:'mentor'|'mentee'}) {
  const [items,setItems]=useState<AggregateCandidate[]>([]),[cursor,setCursor]=useState<string|null>(null);
  const [me,setMe]=useState<UserMe|null>(null),[requests,setRequests]=useState<MatchRequestItem[]>([]);
  const [loading,setLoading]=useState(true),[more,setMore]=useState(false),[ready,setReady]=useState(false);
  const [error,setError]=useState<string|null>(null),[pageError,setPageError]=useState<string|null>(null),[message,setMessage]=useState('');
  const [selected,setSelected]=useState<AggregateCandidate|null>(null),[attempt,setAttempt]=useState(0);
  const generation=useRef(0),owner=useRef<string|null>(null);
  const endpoint=role==='mentor'?'/matching/candidates/all':'/matching/mentees/all';
  const root=useDiscoveryImpressions(items.map(i=>i.discovery_offer_id||'').join(','));
  useEffect(()=>{
    let active=true;const version=++generation.current,session=marker();owner.current=session;
    Promise.all([clientGet<UserMe>('/auth/me'),clientGet<MatchRequestItem[]>(`/matching/requests/me?role=${role==='mentor'?'mentee':'mentor'}`),clientPost<CandidatePage>(endpoint,{})]).then(([user,pending,page])=>{
      if(!active||version!==generation.current||session!==marker())return;
      setMe(user);setRequests(pending);setItems(page.items);setCursor(page.next_cursor);setReady(true);setLoading(false);
    }).catch(err=>{if(active&&version===generation.current){setError(err.message);setLoading(false);}});
    const reset=()=>{if(session!==marker()){generation.current++;setItems([]);setCursor(null);setRequests([]);setSelected(null);setMore(false);setPageError(null);setMessage('');setMe(null);setReady(false);setLoading(true);setError(null);setAttempt(v=>v+1);}};
    window.addEventListener('socra:session-refresh',reset);
    return()=>{active=false;window.removeEventListener('socra:session-refresh',reset);};
  },[endpoint,role,attempt]);
  async function loadMore(){
    if(!cursor||more)return;const version=generation.current,session=owner.current;setMore(true);setPageError(null);
    try{const next=await clientPost<CandidatePage>(endpoint,{cursor});if(version!==generation.current||session!==marker())return;
      setItems(current=>{const existing=new Set(current.map(i=>i.mentor_id||i.mentee_id));return [...current,...next.items.filter(i=>!existing.has(i.mentor_id||i.mentee_id))];});setCursor(next.next_cursor);
    }catch(err){if(version===generation.current)setPageError(err instanceof Error?err.message:'Risultati non disponibili.');}
    finally{if(version===generation.current)setMore(false);}
  }
  function refresh(){generation.current++;setLoading(true);setMore(false);setMessage('');setReady(false);setItems([]);setCursor(null);setSelected(null);setError(null);setPageError(null);setAttempt(v=>v+1);}
  const hasPending=requests.some(r=>r.status==='pending'&&r.mentee_id===me?.id);
  function blocked(candidate:AggregateCandidate){return !ready||(role==='mentor'?hasPending:requests.some(r=>r.status==='pending'&&r.mentee_id===candidate.mentee_id));}
  async function send(text:string,agreed?:string[],goalId?:string){
    if(!selected||!goalId||blocked(selected)||!selected.goal_matches.some(m=>m.goal_id===goalId))throw new Error('Scegli il tema da proporre.');
    const session=owner.current,version=generation.current;
    const request=await clientPost<MatchRequestItem>(role==='mentor'?'/matching/requests':'/matching/proposals',{
      [role==='mentor'?'mentor_id':'mentee_id']:selected.mentor_id||selected.mentee_id,goal_id:goalId,
      agreed_objective_codes:agreed,alignment_message:text,email_sharing_accepted:true});
    if(session!==marker()||version!==generation.current)return;
    setRequests(current=>[request,...current]);setMessage('Proposta inviata. L’altra persona ha 48 ore per rispondere.');
  }
  return <div className={styles.page} ref={root}>
    <header className={styles.intro}><p className={styles.eyebrow}>{role==='mentor'?'La tua ricerca':'Modalità mentor'}</p><h1>{role==='mentor'?'I mentor per i tuoi obiettivi':'Trova persone da aiutare'}</h1><p>{role==='mentor'?'Una ricerca per tutti i tuoi temi. Ogni persona indica le attività su cui può aiutarti.':'Una scheda per persona, con tutti gli obiettivi su cui puoi offrire un confronto.'}</p><div className="cluster"><Link className="button secondary" href={role==='mentor'?'/goal':'/matching'}>{role==='mentor'?'Modifica obiettivi':'Cerca un mentor'}</Link>{me?.is_coach&&role==='mentor'?<Link className="button secondary" href="/matching/mentees">Cerca apprendisti</Link>:null}</div></header>
    {selected?<AlignmentDialog key={selected.mentor_id||selected.mentee_id} name={selected.nickname||'questa persona'} mentorProposal={role==='mentee'} matches={selected.goal_matches} onSend={send} onClose={()=>setSelected(null)}/>:null}
    {hasPending?<div className={styles.notice} role="status">Hai una proposta in attesa. <Link href="/requests">Gestisci la proposta</Link> prima di inviarne un’altra.</div>:null}
    {message?<p role="status">{message} <Link href="/requests">Vedi le proposte</Link></p>:null}
    {loading?<div className="card" role="status">Caricamento delle persone compatibili…</div>:error?<div className="card" role="alert"><p>{error}</p><button type="button" className="button secondary" onClick={refresh}>Riprova</button></div>:items.length===0?<section className={styles.section}><h2>Nessuna persona disponibile ora</h2><p>Controlla i tuoi obiettivi e le proposte in attesa, oppure riprova più tardi.</p><button className="button secondary" onClick={refresh}>Aggiorna risultati</button></section>:items.map(candidate=><article key={candidate.mentor_id||candidate.mentee_id} data-person-id={candidate.mentor_id||candidate.mentee_id} data-discovery-offer={candidate.discovery_offer_id} className={`${styles.section} ${styles.personCard} stack`}>
      <div className={`cluster ${styles.personHeader}`}><UserAvatar name={candidate.nickname||'Utente'} size="md"/><h2 style={{margin:0}}>{candidate.nickname||'Utente'}</h2><Link href={`/profiles/${candidate.mentor_id||candidate.mentee_id}`}>Vedi profilo</Link></div>
      <p className="muted">{role==='mentor'?'Può aiutarti su':'Puoi aiutare su'} {candidate.goal_matches.length} {candidate.goal_matches.length===1?'tema':'temi'}. La compatibilità si riferisce al singolo tema.</p>
      {candidate.goal_matches.map(match=><details key={match.goal_id} className={styles.topic}>
        <summary><span>{match.topic}</span><small>{match.coverage_count}/{match.requested_count} attività · {Math.round(match.match_score)}% compatibilità</small></summary>
        <strong>Su cosa potete lavorare</strong><ul className={styles.list}>{match.covered_objective_labels?.map(label=><li key={label}>{label}</li>)}</ul>
        {match.missing_objective_labels?.length?<><p>Da affrontare in un altro percorso:</p><ul className={styles.list}>{match.missing_objective_labels.map(label=><li key={label}>{label}</li>)}</ul></>:null}
        <p>{match.discussion_mode_label}</p>
      </details>)}
      <button type="button" className="button dark" disabled={blocked(candidate)} onClick={()=>setSelected(candidate)}>{blocked(candidate)?'Proposta in attesa':role==='mentor'?'Chiedi un confronto':'Proponi un confronto'}</button>
    </article>)}
    {pageError?<div role="alert"><p className="error">{pageError}</p><button className="button secondary" onClick={refresh}>Aggiorna risultati</button></div>:null}
    {cursor&&!loading?<button className="button secondary" type="button" disabled={more} onClick={loadMore}>{more?'Caricamento…':'Mostra altri'}</button>:null}
  </div>;
}
