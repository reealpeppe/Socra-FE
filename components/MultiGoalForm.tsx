"use client";
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {clientGet,clientPut} from '@/lib/api';
import {useConfirmation} from '@/components/ConfirmationDialog';
import {useUnsavedChangesGuard} from '@/lib/use-unsaved-changes-guard';
import type {Goal,GoalSelection,GoalsMe,MatchRequestItem,SkillCatalog,SkillProfile} from '@/lib/types';
import styles from './SkillLearning.module.css';

function selections(goals:Goal[]) {return goals.filter(g=>g.skill_model).map(g=>({topic:g.topic_code!,objective_codes:g.objective_codes||[],discussion_mode:g.discussion_mode||''}));}
const marker=()=>{try{return localStorage.getItem('socra-session-change');}catch{return null;}};

export function MultiGoalForm({catalog}:{catalog:SkillCatalog}) {
  const router=useRouter();
  const [chosen,setChosen]=useState<GoalSelection[]>([]);
  const [original,setOriginal]=useState<Goal[]>([]);
  const [pending,setPending]=useState<MatchRequestItem[]>([]);
  const [loaded,setLoaded]=useState(false),[missing,setMissing]=useState(false),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
  const [error,setError]=useState<string|null>(null),[limit,setLimit]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
  const owner=useRef<string|null>(null), request=useRef<{payload:string;key:string}|null>(null);
  const {confirm,confirmationDialog}=useConfirmation();
  useUnsavedChangesGuard(dirty&&!busy);
  useEffect(()=>{
    let active=true;const session=marker();owner.current=session;
    Promise.all([clientGet<GoalsMe>('/goals/me'),clientGet<SkillProfile|null>('/skills/me'),clientGet<MatchRequestItem[]>('/matching/requests/me?role=mentee')]).then(([goals,profile,requests])=>{
      if(!active||session!==marker())return;
      const activeGoals=goals.active_goals||goals.goals.filter(g=>g.is_active!==false);
      setOriginal(activeGoals);setChosen(selections(activeGoals));setPending(requests.filter(r=>r.status==='pending'));setMissing(!profile);setLoaded(true);setDirty(false);
    }).catch(err=>{if(active&&session===marker()){setError(err.message);setLoaded(false);}});
    const reset=()=>{if(session!==marker()){setLoaded(false);setError(null);setBusy(false);setChosen([]);setOriginal([]);setPending([]);setDirty(false);request.current=null;setAttempt(v=>v+1);}};
    window.addEventListener('socra:session-refresh',reset);
    return()=>{active=false;window.removeEventListener('socra:session-refresh',reset);};
  },[attempt]);
  function change(topic:string,update:(selection:GoalSelection)=>GoalSelection){
    setDirty(true);setError(null);request.current=null;
    setChosen(current=>{
      const found=current.find(s=>s.topic===topic)||{topic,objective_codes:[],discussion_mode:''};
      const next=update(found);return [...current.filter(s=>s.topic!==topic),next];
    });
  }
  function toggle(topic:string,code:string){
    const selected=chosen.find(s=>s.topic===topic);
    if(!selected?.objective_codes.includes(code)&&(selected?.objective_codes.length||0)>=catalog.max_objectives){setLimit(topic);return;}
    setLimit(null);change(topic,s=>({...s,objective_codes:s.objective_codes.includes(code)?s.objective_codes.filter(c=>c!==code):[...s.objective_codes,code]}));
  }
  async function save(event:React.FormEvent){
    event.preventDefault();if(busy||!loaded||missing||owner.current!==marker())return;
    const payload=chosen.filter(s=>s.objective_codes.length);
    if(payload.some(s=>!s.discussion_mode)){setError('Scegli una modalità per ogni tema selezionato.');return;}
    const changedIds=original.filter(g=>{const next=payload.find(s=>s.topic===g.topic_code);return !next||JSON.stringify([...next.objective_codes].sort())!==JSON.stringify([...(g.objective_codes||[])].sort())||next.discussion_mode!==g.discussion_mode;}).map(g=>g.id);
    const session=owner.current;setBusy(true);
    if(pending.some(r=>changedIds.includes(r.goal_id))&&!await confirm('Questa modifica annullerà la proposta in attesa sull’obiettivo modificato. Gli altri obiettivi e i percorsi già aperti restano disponibili. Vuoi salvare?')){setBusy(false);return;}
    if(session!==marker())return;
    const serialized=JSON.stringify(payload);
    if(request.current?.payload!==serialized)request.current={payload:serialized,key:crypto.randomUUID()};
    try{
      await clientPut<GoalsMe>('/goals/me/selection',{selections:payload,idempotency_key:request.current.key});
      if(session!==marker())return;setDirty(false);router.push(payload.length?'/matching':'/dashboard');
    }catch(err){if(session===marker())setError(err instanceof Error?err.message:'Obiettivi non salvati.');}
    finally{if(session===marker())setBusy(false);}
  }
  if(!loaded)return <div className="card stack" role={error?"alert":"status"}>{error||"Caricamento obiettivi…"}{error?<button type="button" className="button secondary" onClick={()=>{setError(null);setAttempt(v=>v+1);}}>Riprova</button>:null}</div>;
  if(missing)return <div className="card stack"><h1>Partiamo dalle tue capacità</h1><Link href="/competenze">Aggiorna la tua esperienza</Link></div>;
  return <>{confirmationDialog}<form className={styles.page} onSubmit={save} aria-busy={busy}>
    <header className={styles.intro}><p className={styles.eyebrow}>La tua direzione</p><h1>{original.length?'Aggiorna cosa vuoi imparare':'Cosa vuoi imparare?'}</h1><p>Scegli più temi, con da una a tre attività e una modalità per ciascuno. Vedrai insieme i mentor compatibili; ogni percorso partirà da un solo tema.</p></header>
    <section className={styles.section}><h2>I tuoi obiettivi</h2><p role="status">{chosen.filter(s=>s.objective_codes.length).length} temi · {chosen.reduce((n,s)=>n+s.objective_codes.length,0)} attività selezionate</p>
      {catalog.topics.map(topic=>{const selection=chosen.find(s=>s.topic===topic.code);return <details key={topic.code} className={styles.topic} open={!!selection?.objective_codes.length}>
        <summary><span>{topic.label}</span><small>{selection?.objective_codes.length||0} di {catalog.max_objectives} attività</small></summary>
        <fieldset className={styles.fieldset} disabled={busy}><legend>Le attività che vuoi imparare</legend><div className={styles.choices}>{topic.skills.map(skill=><label className={styles.choice} key={skill.code}><input type="checkbox" checked={selection?.objective_codes.includes(skill.code)||false} onChange={()=>toggle(topic.code,skill.code)}/><span>{skill.label}</span></label>)}</div>
          {limit===topic.code?<p role="alert">Puoi scegliere al massimo {catalog.max_objectives} attività per tema.</p>:null}
          {selection?.objective_codes.length?<><p>Come vuoi lavorarci?</p><div className={styles.choices}>{catalog.discussion_modes.map(mode=><label className={styles.choice} key={mode.code}><input type="radio" name={`mode-${topic.code}`} aria-label={mode.label} checked={selection.discussion_mode===mode.code} onChange={()=>change(topic.code,s=>({...s,discussion_mode:mode.code}))}/><span>{mode.label}<small>{mode.description}</small></span></label>)}</div></>:null}
        </fieldset>
      </details>;})}
    </section>
    {error?<div role="alert"><p className="error">{error}</p>{!dirty?<button type="button" className="button secondary" onClick={()=>{setLoaded(false);setError(null);setAttempt(v=>v+1);}}>Riprova</button>:null}</div>:null}
    <div className={styles.actions}><button className="button dark" type="submit" disabled={busy}>{busy?'Salvataggio…':original.length?'Aggiorna e vedi i mentor':'Salva e continua'}</button></div>
  </form></>;
}
