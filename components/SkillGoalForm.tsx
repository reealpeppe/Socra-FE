"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { clientGet, clientPost } from "@/lib/api";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";
import type { Goal, GoalsMe, SkillCatalog, SkillProfile } from "@/lib/types";
import styles from "./SkillLearning.module.css";

export function SkillGoalForm({ catalog }: { catalog: SkillCatalog }) {
  const router = useRouter();
  const pathId = useSearchParams().get("pathId");
  const [form, setForm] = useState({ topic: "", objective_codes: [] as string[], discussion_mode: "" });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [profileMissing, setProfileMissing] = useState(false);
  useUnsavedChangesGuard(dirty && !busy);
  useEffect(() => {
    let active = true;
    Promise.all([clientGet<GoalsMe>("/goals/me"), clientGet<SkillProfile | null>("/skills/me")]).then(([goals, profile]) => {
      if (!active) return;
      const goal = goals.current || goals.active_goal;
      setProfileMissing(profile === null);
      setEditing(!!goal);
      if (goal?.skill_model) setForm({ topic: goal.topic_code || "", objective_codes: goal.objective_codes || [], discussion_mode: goal.discussion_mode || "" });
      setLoading(false);
    }).catch(err => { if (active) { setError(err instanceof Error ? err.message : "Obiettivo non disponibile."); setLoading(false); } });
    return () => { active = false; };
  }, [attempt]);
  const topic = catalog.topics.find(item => item.code === form.topic);
  function toggle(code: string) {
    const selected = form.objective_codes.includes(code);
    if (!selected && form.objective_codes.length >= catalog.max_objectives) { setLimit(true); return; }
    setLimit(false); setDirty(true);
    setForm(value => ({ ...value, objective_codes: selected ? value.objective_codes.filter(item => item !== code) : [...value.objective_codes, code] }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.topic || !form.objective_codes.length || !form.discussion_mode || busy) { setError("Scegli da uno a tre obiettivi e una modalità di confronto."); return; }
    setBusy(true); setError(null);
    try {
      const goal = await clientPost<Goal>(pathId ? `/paths/${pathId}/update-goal` : "/surveys/goal/me", form);
      setDirty(false);
      router.push(pathId ? `/paths/${pathId}?goalReviewed=1` : editing ? `/matching?goalId=${goal.id}` : `/tour?goalId=${goal.id}`);
    } catch (err) { setError(err instanceof Error ? err.message : "Obiettivo non salvato."); }
    finally { setBusy(false); }
  }
  if (loading) return <div className="card" role="status">Caricamento obiettivo…</div>;
  if (profileMissing) return <section className={`${styles.section} stack`}><h1>Partiamo dalle tue capacità</h1><p>Indica le attività che sai svolgere prima di scegliere cosa vuoi imparare. Puoi anche partire senza capacità da offrire.</p><Link className="button dark" href="/competenze">Aggiorna la tua esperienza</Link></section>;
  return <form className={styles.page} onSubmit={submit} aria-busy={busy}>
    <header className={styles.intro}><p className={styles.eyebrow}>Il prossimo passo</p><h1>{pathId ? "Cosa vuoi approfondire adesso?" : editing ? "Aggiorna cosa vuoi imparare" : "Cosa vuoi imparare?"}</h1><p>Scegli da uno a tre obiettivi dello stesso tema e una modalità per affrontarli insieme. Il percorso partirà dagli obiettivi concordati con il mentor.</p></header>
    <section className={styles.section}><label className={styles.field}>Tema<select className="input select" aria-label="Tema" value={form.topic} required disabled={busy} onChange={event => { setDirty(true); setLimit(false); setForm(value => ({ ...value, topic: event.target.value, objective_codes: [] })); }}><option value="">Scegli un tema</option>{catalog.topics.map(item => <option key={item.code} value={item.code}>{item.label}</option>)}</select></label>
      {topic ? <fieldset className={styles.fieldset} style={{ marginTop: 24 }} disabled={busy}><legend>Le attività che vuoi imparare</legend><p className="muted">{form.objective_codes.length} di {catalog.max_objectives} obiettivi selezionati</p><div className={styles.choices}>{topic.skills.map(skill => <label className={styles.choice} key={skill.code}><input type="checkbox" checked={form.objective_codes.includes(skill.code)} onChange={() => toggle(skill.code)} /><span>{skill.label}</span></label>)}</div>{limit ? <p className={styles.notice} role="alert">Puoi scegliere al massimo {catalog.max_objectives} obiettivi. Deseleziona una voce per sostituirla.</p> : null}</fieldset> : null}
    </section>
    <section className={styles.section}><fieldset className={styles.fieldset} disabled={busy}><legend>Come vuoi lavorarci?</legend><p className="muted">Scegli una sola modalità.</p><div className={styles.choices}>{catalog.discussion_modes.map(mode => <label className={styles.choice} key={mode.code}><input type="radio" name="discussion_mode" aria-label={mode.label} value={mode.code} checked={form.discussion_mode === mode.code} required onChange={() => { setDirty(true); setForm(value => ({ ...value, discussion_mode: mode.code })); }} /><span><strong>{mode.label}</strong><small>{mode.description}</small></span></label>)}</div></fieldset></section>
    {error ? <div role="alert"><p className="error">{error}</p>{!dirty ? <button className="button secondary" type="button" onClick={() => { setLoading(true); setError(null); setAttempt(value => value + 1); }}>Riprova</button> : null}</div> : null}
    <p className={styles.notice}>Socra facilita l’apprendimento tra persone. Ogni decisione di investimento rimane personale.</p>
    <div className={styles.actions}><button className="button dark" disabled={busy} type="submit">{busy ? "Salvataggio…" : pathId ? "Conferma la scelta" : editing ? "Aggiorna e vedi i mentor" : "Salva e continua"}</button></div>
  </form>;
}
