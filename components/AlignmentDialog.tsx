"use client";

import { useEffect, useRef, useState } from "react";
import { EmailSharingNotice } from "@/components/EmailSharingNotice";

export function AlignmentDialog({ name, mentorProposal = false, onSend, onClose }: {
  name: string;
  mentorProposal?: boolean;
  onSend: (message: string) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [emailSharing, setEmailSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} aria-labelledby="alignment-title" onCancel={(event) => {
    event.preventDefault();
    if (!busy) onClose();
  }} style={{ width: "min(560px, calc(100% - 32px))", border: "1px solid var(--line)", borderRadius: 20, padding: 28, color: "var(--navy-950)" }}>
    <form className="stack" onSubmit={async (event) => {
      event.preventDefault();
      if (busy || message.trim().length < 20 || !emailSharing) return;
      setBusy(true);
      setError(null);
      try { await onSend(message.trim()); onClose(); }
      catch (err) { setError(err instanceof Error ? err.message : "Invio non riuscito. Riprova."); }
      finally { setBusy(false); }
    }}>
      <h2 id="alignment-title">Un primo messaggio per {name}</h2>
      <p className="muted">{mentorProposal
        ? "Racconta quale esperienza pratica puoi condividere per questo obiettivo."
        : "Racconta da dove parti e cosa vorresti capire insieme."} Il messaggio sarà visibile solo a voi e agli admin.</p>
      <label htmlFor="alignment-message">Il tuo messaggio</label>
      <textarea id="alignment-message" className="input" autoFocus required minLength={20} maxLength={500} rows={5}
        value={message} disabled={busy} onChange={(event) => setMessage(event.target.value)} aria-describedby="alignment-count" />
      <small id="alignment-count" className="muted">{message.trim().length}/500 caratteri · almeno 20. Non inserire recapiti, importi o dati riservati.</small>
      <EmailSharingNotice accepted={emailSharing} onChange={setEmailSharing} disabled={busy} />
      {error ? <p className="error" role="alert">{error}</p> : null}
      <div className="cluster">
        <button className="button dark" type="submit" disabled={busy || message.trim().length < 20 || !emailSharing}>{busy ? "Invio…" : "Invia"}</button>
        <button className="button secondary" type="button" disabled={busy} onClick={onClose}>Annulla</button>
      </div>
    </form>
  </dialog>;
}
