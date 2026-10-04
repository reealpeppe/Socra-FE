"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { clientPut } from "@/lib/api";
import { useConfirmation } from "@/components/ConfirmationDialog";
import type { SkillCatalog, SkillProfile } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";
import styles from "./SkillLearning.module.css";

export function SkillMentorPreferences({ catalog, profile, onSaved }: { catalog: SkillCatalog; profile: SkillProfile; onSaved: (profile: SkillProfile) => void }) {
  const [offered, setOffered] = useState(profile.mentor_skills);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const key = useRef("");
  const { confirm, confirmationDialog } = useConfirmation();
  const dirty = offered.join(",") !== profile.mentor_skills.join(",");
  useUnsavedChangesGuard(dirty && !busy);
  async function save() {
    if (busy) return;
    setBusy(true); setError(null); setMessage("");
    if (profile.mentor_skills.length && !offered.length && !await confirm("Stai rimuovendo tutte le attività su cui offri aiuto. La tua disponibilità come mentor verrà disattivata e non riceverai nuove richieste. I percorsi già aperti continueranno. Vuoi salvare questa modifica?")) {
      setBusy(false);
      return;
    }
    if (!key.current) key.current = crypto.randomUUID();
    try {
      const next = await clientPut<SkillProfile>("/skills/me", { known_skills: profile.known_skills, mentor_skills: offered, idempotency_key: key.current });
      onSaved(next); setOffered(next.mentor_skills); setMessage("Capacità offerte aggiornate.");
    } catch (err) { setError(err instanceof Error ? err.message : "Capacità non salvate."); }
    finally { setBusy(false); }
  }
  return <div className={styles.fields} style={{ marginTop: 24 }}>{confirmationDialog}<strong>Attività su cui vuoi aiutare</strong><p className="muted">Scegli tra le capacità che hai indicato. Puoi aggiornare ciò che sai fare dalla tua esperienza.</p>
    {catalog.topics.map(topic => { const skills = topic.skills.filter(skill => profile.known_skills.includes(skill.code)); return skills.length ? <fieldset className={styles.fieldset} disabled={busy} key={topic.code}><legend>{topic.label}</legend><div className={styles.choices}>{skills.map(skill => <label className={styles.check} key={skill.code}><input type="checkbox" aria-label={`Offri: ${skill.label}`} checked={offered.includes(skill.code)} onChange={event => { key.current = ""; setMessage(""); setOffered(current => event.target.checked ? [...current, skill.code] : current.filter(code => code !== skill.code)); }} /><span>{skill.label}</span></label>)}</div></fieldset> : null; })}
    {!profile.known_skills.length ? <p>Non hai ancora indicato capacità da offrire.</p> : null}
    <Link href="/competenze">Aggiorna la tua esperienza</Link>
    {error ? <p className="error" role="alert">{error}</p> : null}{message ? <p role="status">{message}</p> : null}
    <button type="button" className="button secondary" disabled={busy || !dirty} onClick={save}>{busy ? "Salvataggio…" : "Salva capacità offerte"}</button>
  </div>;
}
