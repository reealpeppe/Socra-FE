"use client";

import { useState } from "react";
import Link from "next/link";
import { clientPost } from "@/lib/api";
import { parseApiDate } from "@/lib/date";
import type { PublicProfile, PublicReview } from "@/lib/types";
import styles from "./SkillLearning.module.css";
import { SkillPreparation } from "./SkillPreparation";

export function SkillPublicProfile({ profile, ownProfile }: { profile: PublicProfile; ownProfile: boolean }) {
  return <><section className={styles.section}><h2>Preparazione per argomento</h2><p className="muted">Le barre mostrano le attività conosciute sul totale di ciascun argomento, tra quelle dichiarate e quelle confermate nei percorsi.</p>
    {profile.skill_groups?.length ? profile.skill_groups.map(group => <div className={styles.topic} key={group.topic}>
      <SkillPreparation group={group} />
      <div className={styles.offeredSkills}>{group.offered_count ? <><h3>{group.offered_count} {group.offered_count === 1 ? "attività offerta" : "attività offerte"}</h3><p className="muted">Su queste attività {ownProfile ? "vuoi aiutare" : "può aiutarti"}:</p><ul className={styles.list}>{group.skills.map(skill => <li key={skill.code}>{skill.label}{skill.source === "path" ? <small className="muted"> · Confermata in un percorso</small> : null}</li>)}</ul></> : <p className="muted">Nessuna attività offerta su questo argomento.</p>}</div>
    </div>) : <p className="muted">Nessuna attività conosciuta indicata al momento.</p>}
    {typeof profile.mentor_completion_rate === "number" && (profile.mentor_started_paths || 0) > 0 ? <p className={styles.notice}>{Math.round(profile.mentor_completion_rate)}% di percorsi completati come mentor su {profile.mentor_started_paths} avviati.</p> : null}
  </section><section className={styles.section}><h2>Le voci degli apprendisti</h2><p className="muted">Commenti pubblici dopo un percorso completato da entrambe le persone.</p>{profile.public_reviews?.length ? profile.public_reviews.map(review => <Review key={review.id} review={review} ownProfile={ownProfile} />) : <p>Non ci sono ancora commenti pubblici.</p>}</section></>;
}

function Review({ review, ownProfile }: { review: PublicReview; ownProfile: boolean }) {
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const date = parseApiDate(review.created_at);
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!reason.trim() || busy) return;
    setBusy(true); setError(null);
    try { await clientPost(`/skills/reviews/${review.id}/report`, { reason: reason.trim() }); setSent(true); setReporting(false); }
    catch (err) { setError(err instanceof Error ? err.message : "Segnalazione non inviata."); }
    finally { setBusy(false); }
  }
  return <article className={styles.review}><strong><Link href={`/profiles/${review.author_id}`}>{review.author_name || "Utente Socra"}</Link></strong>{date ? <small> · <time dateTime={review.created_at}>{date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</time></small> : null}<p>{review.comment}</p><small>{review.topic_label} · {review.objective_labels.join(" · ")}</small>
    {sent ? <p role="status">Segnalazione inviata.</p> : <div><button className="button secondary" type="button" onClick={() => setReporting(value => !value)}>Segnala commento</button></div>}
    {reporting ? <form className={styles.inlineForm} onSubmit={submit}><label className={styles.field}>Motivo della segnalazione<textarea className="input" value={reason} onChange={event => setReason(event.target.value)} minLength={1} maxLength={2000} required disabled={busy} /></label>{ownProfile ? <small className="muted">Il team valuterà la segnalazione. Il commento rimane visibile durante la verifica.</small> : null}<button className="button dark" disabled={busy} type="submit">Invia segnalazione</button></form> : null}
    {error ? <p className="error" role="alert">{error}</p> : null}
  </article>;
}
