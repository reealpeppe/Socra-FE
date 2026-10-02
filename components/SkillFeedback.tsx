"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { clientGet, clientPost } from "@/lib/api";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";
import type { PathItem, UserMe } from "@/lib/types";
import styles from "./SkillLearning.module.css";

type Result = "yes" | "partly" | "no";
type Outcome = { code: string; result: Result | ""; can_help: Result | null; share_skill: boolean };

export function PathFeedbackBoundary({ actor, legacy }: { actor: "mentee" | "mentor"; legacy: ReactNode }) {
  const { pathId } = useParams<{ pathId: string }>();
  const [path, setPath] = useState<PathItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    Promise.all([clientGet<PathItem>(`/paths/${pathId}`), clientGet<UserMe>("/auth/me")]).then(([next, user]) => {
      if (next[`${actor}_id`] !== user.id) throw new Error("Questo feedback è riservato al partecipante del percorso.");
      if (next.skill_model && !next[`${actor}_closed_at`]) throw new Error("Chiudi prima il tuo lato del percorso.");
      if (next.skill_model && next[`${actor}_feedback_submitted`]) throw new Error("Hai già inviato il feedback per questo percorso.");
      if (active) setPath(next);
    }).catch(err => { if (active) setError(err instanceof Error ? err.message : "Feedback non disponibile."); });
    return () => { active = false; };
  }, [pathId, actor, attempt]);
  if (error) return <AppShell><div className="card stack" role="alert"><p>{error}</p><button className="button secondary" onClick={() => { setError(null); setAttempt(value => value + 1); }}>Riprova</button></div></AppShell>;
  if (!path) return <AppShell><div className="card" role="status">Caricamento feedback…</div></AppShell>;
  return path.skill_model ? <SkillFeedback key={`${path.id}:${actor}`} path={path} actor={actor} /> : legacy;
}

function SkillFeedback({ path, actor }: { path: PathItem; actor: "mentee" | "mentor" }) {
  const router = useRouter();
  const learner = actor === "mentee";
  const [outcomes, setOutcomes] = useState<Outcome[]>(() => (path.agreed_objective_codes || []).map(code => ({ code, result: "", can_help: null, share_skill: false })));
  const [clarity, setClarity] = useState("");
  const [repeat, setRepeat] = useState("");
  const [promotion, setPromotion] = useState("");
  const [engagement, setEngagement] = useState("");
  const [comment, setComment] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = outcomes.some(item => item.result) || !!clarity || !!repeat || !!promotion || !!engagement || !!comment || !!note;
  useUnsavedChangesGuard(dirty && !busy && !sent);
  function update(index: number, patch: Partial<Outcome>) {
    setOutcomes(current => current.map((item, i) => {
      if (i !== index) return item;
      const next = { ...item, ...patch };
      if (next.result !== "yes") { next.can_help = null; next.share_skill = false; }
      if (next.can_help !== "yes") next.share_skill = false;
      return next;
    }));
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const complete = outcomes.length > 0 && outcomes.every(item => item.result && (!learner || item.result !== "yes" || item.can_help));
    if (!complete || (learner ? !clarity || !repeat || !promotion : !engagement) || busy) { setError("Rispondi per ciascun obiettivo e completa le valutazioni richieste."); return; }
    setBusy(true); setError(null);
    try {
      await clientPost(`/feedback/${path.id}/${actor}`, {
        answers: learner ? { objective_outcomes: outcomes, clarity, would_repeat: repeat, external_promotion: promotion === "yes" }
          : { objective_outcomes: outcomes.map(({ code, result }) => ({ code, result })), engagement },
        text_note: note.trim() || null,
        ...(learner ? { public_comment: comment.trim() || null } : {}),
      });
      setSent(true); router.push(`/paths/${path.id}?feedback=sent`);
    } catch (err) { setError(err instanceof Error ? err.message : "Feedback non salvato."); }
    finally { setBusy(false); }
  }
  return <AppShell primaryAction={{ href: `/paths/${path.id}`, label: "Torna al percorso" }}><form className={styles.page} onSubmit={submit} aria-busy={busy}>
    <header className={styles.intro}><p className={styles.eyebrow}>Il percorso, attività per attività</p><h1>{learner ? "Cosa porti con te?" : "Com’è andato il percorso?"}</h1><p>Le risposte sono indipendenti. Capacità acquisite e commento pubblico saranno aggiornati dopo il completamento di entrambe le persone.</p></header>
    {outcomes.map((outcome, index) => { const label = path.agreed_objective_labels?.[index] || outcome.code; return <section className={styles.section} key={outcome.code}><h2>{label}</h2><div className={styles.fields}>
      <label className={styles.field}>{learner ? "Hai raggiunto questo obiettivo?" : "L’apprendista ha raggiunto questo obiettivo?"}<select className="input select" aria-label={`Risultato: ${label}`} value={outcome.result} required disabled={busy} onChange={event => update(index, { result: event.target.value as Result })}><option value="">Scegli una risposta</option><option value="yes">Sì</option><option value="partly">In parte</option><option value="no">No</option></select></label>
      {learner && outcome.result === "yes" ? <label className={styles.field}>Sapresti aiutare un’altra persona su questa attività?<select className="input select" aria-label={`Sai aiutare: ${label}`} value={outcome.can_help || ""} required disabled={busy} onChange={event => update(index, { can_help: event.target.value as Result })}><option value="">Scegli una risposta</option><option value="yes">Sì</option><option value="partly">In parte</option><option value="no">No</option></select></label> : null}
      {learner && outcome.result === "yes" && outcome.can_help === "yes" ? <label className={styles.check}><input type="checkbox" aria-label={`Offri: ${label}`} checked={outcome.share_skill} disabled={busy} onChange={event => update(index, { share_skill: event.target.checked })} /><span>Voglio offrire questa capacità come mentor. La disponibilità globale in pausa rimane in pausa.</span></label> : null}
    </div></section>; })}
    <section className={styles.section}><h2>Il confronto</h2><div className={styles.fields}>{learner ? <>
      <label className={styles.field}>Chiarezza del confronto<select className="input select" required value={clarity} disabled={busy} onChange={event => setClarity(event.target.value)}><option value="">Scegli una risposta</option><option value="clear">Chiaro</option><option value="mixed">In parte chiaro</option><option value="unclear">Poco chiaro</option></select></label>
      <label className={styles.field}>Rifaresti questo percorso?<select className="input select" required value={repeat} disabled={busy} onChange={event => setRepeat(event.target.value)}><option value="">Scegli una risposta</option><option value="yes">Sì</option><option value="no">No</option></select></label>
      <label className={styles.field}>Hai ricevuto proposte commerciali esterne?<select className="input select" required value={promotion} disabled={busy} onChange={event => setPromotion(event.target.value)}><option value="">Scegli una risposta</option><option value="no">No</option><option value="yes">Sì</option></select></label>
    </> : <label className={styles.field}>Partecipazione dell’apprendista<select className="input select" required value={engagement} disabled={busy} onChange={event => setEngagement(event.target.value)}><option value="">Scegli una risposta</option><option value="active">Attiva</option><option value="mixed">Discontinua</option><option value="low">Limitata</option></select></label>}
      <label className={styles.field}>Nota privata facoltativa<textarea className="input" rows={3} maxLength={2000} value={note} disabled={busy} onChange={event => setNote(event.target.value)} /></label><small className="muted">La nota sarà visibile ai partecipanti e agli admin dopo il completamento bilaterale. Non sarà pubblicata sul profilo.</small>
    </div></section>
    {learner ? <section className={styles.section}><label className={styles.field}>Commento pubblico facoltativo<textarea className="input" rows={4} maxLength={2000} value={comment} disabled={busy} onChange={event => setComment(event.target.value)} aria-describedby="public-comment-visibility" /></label><p className={styles.notice} id="public-comment-visibility">Sarà visibile alla community sul profilo del mentor, con il tuo nome e la data, dopo il completamento bilaterale. Puoi raccontare anche cosa non ha funzionato. Evita recapiti e informazioni personali.</p></section> : null}
    {error ? <p className="error" role="alert">{error}</p> : null}
    <div className={styles.actions}><button type="submit" className="button dark" disabled={busy || !outcomes.length}>{busy ? "Invio…" : "Invia feedback"}</button></div>
  </form></AppShell>;
}
