"use client";
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ChevronDown} from 'lucide-react';
import {clientGet,clientPost} from '@/lib/api';
import {useDiscoveryImpressions} from '@/lib/use-discovery-impressions';
import {AlignmentDialog} from './AlignmentDialog';
import {MatchingProfileCard} from './MatchingProfileCard';
import type {AggregateCandidate,CandidatePage,MatchRequestItem,UserMe,Goal,GoalsMe} from '@/lib/types';
import styles from './SkillLearning.module.css';
import matchingStyles from './AggregateMatching.module.css';

function marker(){try{return localStorage.getItem('socra-session-change');}catch{return null;}}

export function AggregateMatching({role='mentor'}:{role?:'mentor'|'mentee'}) {
  const [items,setItems]=useState<AggregateCandidate[]>([]),[cursor,setCursor]=useState<string|null>(null);
  const [me,setMe]=useState<UserMe|null>(null),[requests,setRequests]=useState<MatchRequestItem[]>([]);
  const [goals,setGoals]=useState<Goal[]>([]);
  const [goalsError,setGoalsError]=useState(false),[goalsRetry,setGoalsRetry]=useState(0);
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
    const reset=()=>{if(session!==marker()){generation.current++;setItems([]);setGoals([]);setGoalsError(false);setCursor(null);setRequests([]);setSelected(null);setMore(false);setPageError(null);setMessage('');setMe(null);setReady(false);setLoading(true);setError(null);setAttempt(v=>v+1);}};
    window.addEventListener('socra:session-refresh',reset);
    return()=>{active=false;window.removeEventListener('socra:session-refresh',reset);};
  },[endpoint,role,attempt]);
  useEffect(()=>{
    if(role!=='mentor')return;
    let active=true;const version=generation.current,session=marker();
    clientGet<GoalsMe>('/goals/me').then(selections=>{
      if(!active||version!==generation.current||session!==marker())return;
      setGoals(selections.active_goals||selections.goals?.filter(goal=>goal.is_active!==false)||[]);setGoalsError(false);
    }).catch(()=>{if(active&&version===generation.current&&session===marker())setGoalsError(true);});
    return()=>{active=false;};
  },[role,attempt,goalsRetry]);
  async function loadMore(){
    if(!cursor||more)return;const version=generation.current,session=owner.current;setMore(true);setPageError(null);
    try{const next=await clientPost<CandidatePage>(endpoint,{cursor});if(version!==generation.current||session!==marker())return;
      setItems(current=>{const existing=new Set(current.map(i=>i.mentor_id||i.mentee_id));return [...current,...next.items.filter(i=>!existing.has(i.mentor_id||i.mentee_id))];});setCursor(next.next_cursor);
    }catch(err){if(version===generation.current)setPageError(err instanceof Error?err.message:'Risultati non disponibili.');}
    finally{if(version===generation.current)setMore(false);}
  }
  function refresh(){generation.current++;setLoading(true);setMore(false);setMessage('');setReady(false);setItems([]);setGoals([]);setGoalsError(false);setCursor(null);setSelected(null);setError(null);setPageError(null);setAttempt(v=>v+1);}
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
    <header className={`${styles.intro} ${matchingStyles.intro}`}><h1>{role==='mentor'?'Trova il tuo mentor':'Trova persone da aiutare'}</h1><p>{role==='mentor'?'Persone con cui lavorare sui tuoi obiettivi, un confronto alla volta.':'Condividi ciò che sai sulle attività che queste persone vogliono imparare.'}</p><div className="cluster"><Link className="button secondary" href={role==='mentor'?'/goal':'/matching'}>{role==='mentor'?'Modifica obiettivi':'Cerca un mentor'}</Link>{me?.is_coach&&role==='mentor'?<Link className="button secondary" href="/matching/mentees">Cerca apprendisti</Link>:null}</div></header>
    {selected?<AlignmentDialog key={selected.mentor_id||selected.mentee_id} userId={selected.mentor_id||selected.mentee_id} name={selected.nickname||'questa persona'} mentorProposal={role==='mentee'} matches={selected.goal_matches} onSend={send} onClose={()=>setSelected(null)}/>:null}
    {goals.length ? <section className={matchingStyles.goals} aria-label="I tuoi obiettivi"><h2>I tuoi obiettivi</h2>{goals.map(goal=><details key={goal.id} open={goals.length===1||undefined}><summary>{goal.topic}<small>{goal.objective_labels?.length||0} {goal.objective_labels?.length===1?'obiettivo':'obiettivi'}</small><ChevronDown size={16} aria-hidden="true" /></summary><ul>{goal.objective_labels?.map(label=><li key={label}>{label}</li>)}</ul><p>Come vuoi lavorare: {goal.discussion_mode_label}</p></details>)}</section>:null}
    {role==='mentor'&&goalsError?<p role="status">Riepilogo obiettivi non disponibile. <button type="button" className="button secondary" onClick={()=>setGoalsRetry(value=>value+1)}>Riprova riepilogo</button></p>:null}
    {hasPending?<div className={styles.notice} role="status">Hai una proposta in attesa. <Link href="/requests">Gestisci la proposta</Link> prima di inviarne un’altra.</div>:null}
    {message?<p role="status">{message} <Link href="/requests">Vedi le proposte</Link></p>:null}
    {loading?<div className="card" role="status">Caricamento delle persone compatibili…</div>:error?<div className="card" role="alert"><p>{error}</p><button type="button" className="button secondary" onClick={refresh}>Riprova</button></div>:items.length===0?<section className={styles.section}><h2>Nessuna persona disponibile ora</h2><p>Controlla i tuoi obiettivi e le proposte in attesa, oppure riprova più tardi.</p><button className="button secondary" onClick={refresh}>Aggiorna risultati</button></section>:<div className={matchingStyles.grid}>{items.map(candidate => <MatchingProfileCard key={candidate.mentor_id||candidate.mentee_id} userId={(candidate.mentor_id||candidate.mentee_id)!} name={candidate.nickname||'Utente'} topic={candidate.goal_matches[0]?.topic||''} coverage={candidate.goal_matches[0]||{}} score={candidate.goal_matches[0]?.match_score||0} matches={candidate.goal_matches} recommended={candidate.is_recommended} discoveryOfferId={candidate.discovery_offer_id} disabled={blocked(candidate)} actionLabel={blocked(candidate)?'Proposta in attesa':role==='mentor'?'Chiedi un confronto':'Proponi un confronto'} onRequest={()=>setSelected(candidate)} />)}</div>}
    {pageError?<div role="alert"><p className="error">{pageError}</p><button className="button secondary" onClick={refresh}>Aggiorna risultati</button></div>:null}
    {cursor&&!loading?<button className="button secondary" type="button" disabled={more} onClick={loadMore}>{more?'Caricamento…':'Mostra altri'}</button>:null}
  </div>;
}
