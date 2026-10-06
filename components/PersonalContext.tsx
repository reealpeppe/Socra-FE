"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clientGet, clientPatch } from "@/lib/api";
import { sectionDQuestions } from "@/lib/options";
import type { SkillProfile } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";
import styles from "./SkillLearning.module.css";

export function PersonalContext({ profile, onSaved, expanded = false, onContinue }: { profile: SkillProfile | null; onSaved: (profile: SkillProfile) => void; expanded?: boolean; onContinue?: () => void }) {
  const [answers, setAnswers] = useState(profile?.section_d || {});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const key = useRef("");
  const details = useRef<HTMLDetailsElement>(null);
  const owner = useRef<string | null>(null);
  const [sessionValid, setSessionValid] = useState(true);
  const marker = () => { try { return localStorage.getItem('socra-session-change'); } catch { return null; } };
  useEffect(() => {
    owner.current = marker();
    const openContext = () => { if (window.location.hash === '#personal-context' && details.current) details.current.open = true; };
    openContext();
    const followContext = (event: MouseEvent) => { const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null; if (anchor && new URL((anchor as HTMLAnchorElement).href).hash === '#personal-context' && details.current) details.current.open = true; };
    window.addEventListener('hashchange', openContext);
    document.addEventListener('click', followContext);
    const refresh = () => { if (owner.current !== marker()) { setAnswers({}); setMessage(''); setError(null); setSessionValid(false); key.current = ''; } };
    window.addEventListener('socra:session-refresh', refresh);
    return () => { window.removeEventListener('socra:session-refresh', refresh); window.removeEventListener('hashchange', openContext); document.removeEventListener('click', followContext); };
  }, []);
  const dirty = sectionDQuestions.some(question => answers[question.key] !== profile?.section_d[question.key]);
  const answeredCount = sectionDQuestions.filter(question => question.options.some(option => option.value === answers[question.key]) || (question.key === 'D2' && answers.D2 === 'gt_75k')).length;
  const complete = answeredCount === 5;
  useUnsavedChangesGuard(dirty && !busy);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !complete || busy || !sessionValid || owner.current !== marker()) return;
    if (onContinue && !dirty) { onContinue(); return; }
    setBusy(true); setError(null); setMessage("");
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const next = await clientPatch<SkillProfile>("/skills/me/context", { section_d: answers, idempotency_key: key.current });
      if (owner.current !== marker()) return;
      onSaved(next); setAnswers(next.section_d); setMessage("Contesto personale aggiornato."); onContinue?.();
    } catch (err) {
      if (owner.current !== marker()) return;
      // A timed-out write may have committed: read before claiming failure/success.
      try {
        const current = await clientGet<SkillProfile | null>('/skills/me');
        if (owner.current !== marker()) return;
        if (current && sectionDQuestions.every(q => current.section_d[q.key] === answers[q.key])) {
          onSaved(current); setAnswers(current.section_d); setMessage('Contesto personale aggiornato.'); onContinue?.(); return;
        }
      } catch { /* Keep the same payload/key available for an idempotent retry. */ }
      setError(err instanceof Error ? err.message : "Contesto personale non salvato.");
    }
    finally { setBusy(false); }
  }

  if (!sessionValid) return <p role="status">Sessione cambiata. Riapri il contesto personale dal tuo profilo.</p>;
  return <details ref={details} className="card settings-card" id="personal-context" open={expanded || undefined}>
    <summary className={styles.contextSummary}>Contesto personale</summary>
    <p className={styles.notice}>Queste informazioni non compaiono sul tuo profilo pubblico.</p>
    <details><summary className={styles.contextSummary}>Perché ci serve questa informazione?</summary><p className="muted">Queste informazioni ci aiutano a conoscere meglio la community e a comprenderne bisogni e caratteristiche nel tempo.</p></details>
    {profile ? <form className={styles.fields} onSubmit={save} aria-busy={busy}>
      <p role="status">{answeredCount}/5 risposte</p>
      {sectionDQuestions.map(question => <label className={styles.field} key={question.key}>{question.label}<select className="input select" name={question.key} value={answers[question.key] || ""} disabled={busy} onChange={event => { key.current = ""; setMessage(""); setAnswers(current => ({ ...current, [question.key]: event.target.value })); }}><option value="">Scegli una risposta</option>{question.key === 'D2' && answers.D2 === 'gt_75k' ? <option value="gt_75k">Oltre 75.000 € (risposta precedente)</option> : null}{question.options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>)}
      {error ? <p className="error" role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      {!onContinue && complete && !dirty ? <p className="muted">Le risposte sono già salvate.</p> : null}
      <div className={styles.actions}>{onContinue ? complete ? <button className="button dark" disabled={busy} type="submit">{busy ? "Salvataggio…" : "Continua"}</button> : null : <button className="button secondary" disabled={busy || !complete || !dirty} type="submit">{busy ? "Salvataggio…" : "Salva contesto personale"}</button>}</div>
    </form> : <p>Prima completa la tua esperienza, anche senza selezionare attività. <Link href="/competenze">Vai alla tua esperienza</Link></p>}
  </details>;
}
