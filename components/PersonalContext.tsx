"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { clientGet, clientPatch } from "@/lib/api";
import { sectionDQuestions } from "@/lib/options";
import type { SkillProfile } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";
import styles from "./SkillLearning.module.css";

export function PersonalContext({ profile, onSaved, expanded = false, navigationReady = true, onContinue }: { profile: SkillProfile | null; onSaved: (profile: SkillProfile) => void; expanded?: boolean; navigationReady?: boolean; onContinue?: () => void }) {
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
    const refresh = () => { if (owner.current !== marker()) { setAnswers({}); setMessage(''); setError(null); setSessionValid(false); key.current = ''; } };
    window.addEventListener('socra:session-refresh', refresh);
    return () => { window.removeEventListener('socra:session-refresh', refresh); };
  }, []);
  useEffect(() => {
    if (!navigationReady) return;
    let frame: number | undefined;
    const revealContext = () => {
      if (!details.current) return;
      details.current.open = true;
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // The anchor may mount after navigation, below asynchronously loaded settings.
        details.current?.scrollIntoView({ block: 'start' });
        details.current?.querySelector('summary')?.focus({ preventScroll: true });
      });
    };
    const followHash = () => { if (window.location.hash === '#personal-context') revealContext(); };
    const followLink = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null;
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
      const destination = new URL(anchor.href);
      if (destination.origin === window.location.origin && destination.pathname === window.location.pathname
        && destination.hash === '#personal-context') revealContext();
    };
    followHash();
    window.addEventListener('hashchange', followHash);
    document.addEventListener('click', followLink);
    return () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      window.removeEventListener('hashchange', followHash);
      document.removeEventListener('click', followLink);
    };
  }, [navigationReady]);
  const dirty = sectionDQuestions.some(question => answers[question.key] !== profile?.section_d[question.key]);
  const selected = Object.fromEntries(sectionDQuestions.flatMap(question => {
    const value = answers[question.key];
    return value && (question.options.some(option => option.value === value && value !== 'undisclosed') || (question.key === 'D2' && value === 'gt_75k'))
      ? [[question.key, value]] : [];
  }));
  const answeredCount = Object.keys(selected).length;
  const changes: Record<string, string | null> = {};
  for (const question of sectionDQuestions) {
    const previous = profile?.section_d[question.key];
    if (answers[question.key] === previous) continue;
    if (selected[question.key]) changes[question.key] = selected[question.key];
    else if (previous && previous !== 'undisclosed') changes[question.key] = null;
  }
  useUnsavedChangesGuard(dirty && !busy);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || answeredCount === 0 || busy || !sessionValid || owner.current !== marker()) return;
    if (onContinue && !dirty) { onContinue(); return; }
    setBusy(true); setError(null); setMessage("");
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const next = await clientPatch<SkillProfile>("/skills/me/context", { section_d: changes, idempotency_key: key.current });
      if (owner.current !== marker()) return;
      onSaved(next); setAnswers(next.section_d); setMessage("Contesto personale aggiornato."); onContinue?.();
    } catch (err) {
      if (owner.current !== marker()) return;
      // A timed-out write may have committed: read before claiming failure/success.
      try {
        const current = await clientGet<SkillProfile | null>('/skills/me');
        if (owner.current !== marker()) return;
        if (current && Object.entries(changes).every(([field, value]) => value === null
          ? current.section_d[field] === undefined : current.section_d[field] === value)) {
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
    <div className={styles.notice}><p>Conoscere la tua situazione economica e professionale ci aiuta a comprendere meglio il tuo punto di partenza e a favorire connessioni più pertinenti tra mentor e apprendisti, tenendo conto delle esperienze e delle esigenze di ciascuno.</p><p>Le risposte sono facoltative e riservate. Non saranno visibili agli altri utenti.</p></div>
    {profile ? <form className={styles.fields} onSubmit={save} aria-busy={busy}>
      <p role="status">{answeredCount}/5 risposte</p>
      {sectionDQuestions.map(question => <label className={styles.field} key={question.key}>{question.label}<select className="input select" name={question.key} value={answers[question.key] === 'undisclosed' ? '' : answers[question.key] || ""} disabled={busy} onChange={event => { key.current = ""; setMessage(""); setAnswers(current => ({ ...current, [question.key]: event.target.value })); }}><option value="">Scegli una risposta</option>{question.key === 'D2' && answers.D2 === 'gt_75k' ? <option value="gt_75k">Oltre 75.000 € (risposta precedente)</option> : null}{question.options.filter(option => option.value !== 'undisclosed').map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>)}
      {error ? <p className="error" role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      {!onContinue && answeredCount > 0 && !dirty ? <p className="muted">Le risposte sono già salvate.</p> : null}
      <div className={styles.actions}>{onContinue ? <><button className="button secondary" disabled={busy} type="button" onClick={onContinue}>Salta</button><button className={`button dark ${styles.contextSave}`} disabled={busy || answeredCount === 0} type="submit">{busy ? "Salvataggio…" : "Salva e continua"}</button></> : <button className={`button secondary ${styles.contextSave}`} disabled={busy || answeredCount === 0 || !dirty} type="submit">{busy ? "Salvataggio…" : "Salva contesto personale"}</button>}</div>
    </form> : <p>Prima completa la tua esperienza, anche senza selezionare attività. <Link href="/competenze">Vai alla tua esperienza</Link></p>}
  </details>;
}
