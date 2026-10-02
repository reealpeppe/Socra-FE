"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { clientPatch } from "@/lib/api";
import { sectionDQuestions } from "@/lib/options";
import type { SkillProfile } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";
import styles from "./SkillLearning.module.css";

export function PersonalContext({ profile, onSaved }: { profile: SkillProfile | null; onSaved: (profile: SkillProfile) => void }) {
  const [answers, setAnswers] = useState(profile?.section_d || {});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const key = useRef("");
  const dirty = sectionDQuestions.some(question => answers[question.key] !== profile?.section_d[question.key]);
  const complete = sectionDQuestions.every(question => question.options.some(option => option.value === answers[question.key]));
  useUnsavedChangesGuard(dirty && !busy);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile || !complete || busy) return;
    setBusy(true); setError(null); setMessage("");
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const next = await clientPatch<SkillProfile>("/skills/me/context", { section_d: answers, idempotency_key: key.current });
      onSaved(next); setAnswers(next.section_d); setMessage("Contesto personale aggiornato.");
    } catch (err) { setError(err instanceof Error ? err.message : "Contesto personale non salvato."); }
    finally { setBusy(false); }
  }

  return <details className="card settings-card" id="personal-context">
    <summary className={styles.contextSummary}>Contesto personale</summary>
    <p className={styles.notice}>Privato e facoltativo. Queste informazioni non influenzano la compatibilità e non compaiono sul tuo profilo pubblico.</p>
    {profile ? <form className={styles.fields} onSubmit={save} aria-busy={busy}>
      <p className="muted">Puoi lasciare questa sezione vuota. Se vuoi salvarla, scegli una risposta per ogni domanda; è sempre disponibile “Preferisco non rispondere”.</p>
      {sectionDQuestions.map(question => <label className={styles.field} key={question.key}>{question.label}<select className="input select" name={question.key} value={answers[question.key] || ""} disabled={busy} onChange={event => { key.current = ""; setMessage(""); setAnswers(current => ({ ...current, [question.key]: event.target.value })); }}><option value="">Scegli una risposta</option>{question.options.map(option => <option value={option.value} key={option.value}>{option.label}</option>)}</select></label>)}
      {error ? <p className="error" role="alert">{error}</p> : null}
      {message ? <p role="status">{message}</p> : null}
      <div className={styles.actions}><button className="button secondary" disabled={busy || !complete || !dirty} type="submit">{busy ? "Salvataggio…" : "Salva contesto personale"}</button></div>
    </form> : <p>Prima completa la tua esperienza, anche senza selezionare attività. <Link href="/competenze">Vai alla tua esperienza</Link></p>}
  </details>;
}
