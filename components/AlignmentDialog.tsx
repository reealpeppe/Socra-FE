"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, MessagesSquare, X } from "lucide-react";
import { EmailSharingNotice } from "@/components/EmailSharingNotice";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import type { SkillCoverage, GoalMatch, Wallet } from "@/lib/types";
import { coverageCounts, MissingObjectives } from "@/components/SkillSummary";
import { clientGet } from "@/lib/api";
import { GoalMatchChoices } from "./GoalMatchChoices";
import styles from "./AlignmentDialog.module.css";

export function AlignmentDialog({ name, userId, avatarUrl, topic, mode, mentorProposal = false, coverage, matches, onSend, onClose }: {
  name: string;
  userId?: string;
  avatarUrl?: string | null;
  topic?: string;
  mode?: string | null;
  mentorProposal?: boolean;
  coverage?: SkillCoverage | null;
  matches?: GoalMatch[];
  onSend: (message: string, agreedObjectives?: string[], goalId?: string) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailSharing, setEmailSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState<string[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(matches?.length === 1 ? matches[0].goal_id : null);
  const selectedCoverage = matches ? matches.find(match => match.goal_id === selectedGoalId) : coverage;
  const selectedTopic = matches?.find(match => match.goal_id === selectedGoalId)?.topic || topic;
  const selectedMode = matches?.find(match => match.goal_id === selectedGoalId)?.discussion_mode_label || mode;
  const needsAgreement = !!matches?.length || coverage?.skill_model === true;
  useEffect(() => {
    if (mentorProposal) return;
    let active = true;
    clientGet<Wallet>("/wallet/me").then(value => { if (active) setWallet(value); })
      .catch(() => { if (active) setWallet(null); });
    return () => { active = false; };
  }, [mentorProposal]);
  const counts = selectedCoverage ? coverageCounts(selectedCoverage) : null;
  const canSend = message.trim().length >= 20 && emailSharing && (!needsAgreement || agreed.length > 0);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} className={styles.dialog} aria-labelledby="alignment-title" onCancel={(event) => {
    event.preventDefault();
    if (!busy) onClose();
  }}>
    <form className={styles.form} onSubmit={async (event) => {
      event.preventDefault();
      if (busy || !canSend) return;
      setBusy(true);
      setError(null);
      try { await onSend(message.trim(), needsAgreement ? agreed : undefined, selectedGoalId || undefined); onClose(); }
      catch (err) { setError(err instanceof Error ? err.message : "Invio non riuscito. Riprova."); }
      finally { setBusy(false); }
    }}>
      <header className={styles.header}>
        <ProfileAvatar name={name} userId={userId} src={avatarUrl} />
        <div className={styles.heading}><h2 id="alignment-title">{mentorProposal ? "Proponi un percorso" : "Chiedi un confronto"}</h2><p><strong>{name}</strong>{selectedTopic ? <span className={styles.topic}>{selectedTopic}</span> : null}</p></div>
        <button className={styles.close} type="button" aria-label="Chiudi richiesta" disabled={busy} onClick={onClose}><X size={18} aria-hidden="true" /></button>
      </header>
      {!mentorProposal && wallet?.advance_available === 1 ? <p className={styles.coverage}>Puoi usare il credito anticipato per questo percorso. La disponibilità sarà verificata all’accettazione; l’eventuale addebito avverrà dopo i feedback di entrambi.</p> : null}
      {matches && matches.length > 1 ? <fieldset className={styles.fieldset} disabled={busy}><GoalMatchChoices matches={matches} selectedGoalId={selectedGoalId} onSelect={id => { setSelectedGoalId(id); setAgreed([]); }} /></fieldset> : null}
      {needsAgreement && selectedCoverage ? <fieldset className={styles.fieldset} disabled={busy}>
        <legend>Su cosa vuoi lavorare?</legend>
        <p className={styles.coverage}>{counts?.count} di {counts?.total} {counts?.total === 1 ? "obiettivo disponibile" : "obiettivi disponibili"}</p>
        <div className={styles.choices}>{selectedCoverage.covered_objective_codes?.map((code, index) => <label className={styles.choice} key={code}>
          <input type="checkbox" aria-label={selectedCoverage.covered_objective_labels?.[index] || code} checked={agreed.includes(code)} onChange={event => setAgreed(current => event.target.checked ? [...current, code] : current.filter(item => item !== code))} />
          <span><strong>{selectedCoverage.covered_objective_labels?.[index] || code}</strong>{selectedMode && index === 0 ? <span className={styles.mode}><MessagesSquare size={14} aria-hidden="true" />{selectedMode}</span> : null}</span>
        </label>)}</div>
        <MissingObjectives coverage={selectedCoverage} />
      </fieldset> : null}
      <div className={styles.message}>
        <label htmlFor="alignment-message">Il tuo messaggio</label>
        <p id="alignment-help" className={styles.help}>Messaggio obbligatorio: da 20 a 500 caratteri per spiegare cosa vorresti approfondire insieme.</p>
        <textarea id="alignment-message" required minLength={20} maxLength={500} rows={3} placeholder={mentorProposal ? "Racconta l’esperienza che puoi condividere su questo obiettivo…" : "Racconta da dove parti e cosa vuoi capire insieme…"}
          value={message} disabled={busy} onChange={event => setMessage(event.target.value)} aria-describedby="alignment-help alignment-count" />
        <span id="alignment-count" className={styles.count}>{message.trim().length}/500 caratteri</span>
      </div>
      <EmailSharingNotice compact accepted={emailSharing} onChange={setEmailSharing} disabled={busy} />
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <footer className={styles.footer}>
        <button className={styles.cancel} type="button" disabled={busy} onClick={onClose}>Annulla</button>
        <button className={styles.send} type="submit" disabled={busy || !canSend} aria-busy={busy}>{busy ? "Invio…" : "Invia richiesta"}<ArrowRight size={18} aria-hidden="true" /></button>
      </footer>
    </form>
  </dialog>;
}
