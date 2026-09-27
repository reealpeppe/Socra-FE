"use client";

import { useState } from "react";
import { accountPost, correctAccountEmail, ClientApiError } from "@/lib/api";
import type { UserMe } from "@/lib/types";

type DeliveryResult = { status: string; email_delivery_enabled: boolean };

export function EmailVerificationNotice({ user }: { user: UserMe }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(user.email);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (user.email_verified || !user.email_verification_required) return null;

  function fail(err: unknown) {
    setError(err instanceof ClientApiError ? err.message : "Richiesta non riuscita. Riprova.");
  }

  async function resend() {
    if (busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const result = await accountPost<DeliveryResult>("email-verification/request");
      setMessage(result.email_delivery_enabled
        ? "Richiesta di verifica registrata. Controlla la posta e la cartella indesiderata; il link vale 24 ore."
        : "L’invio email è disattivato in questo ambiente. Nessuna email è stata inviata.");
    } catch (err) { fail(err); }
    finally { setBusy(false); }
  }

  async function correct(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(null); setMessage(null);
    try {
      const result = await correctAccountEmail<DeliveryResult>(email.trim());
      setMessage(result.email_delivery_enabled
        ? "Email aggiornata. Richiesta di verifica registrata per il nuovo indirizzo."
        : "Email aggiornata. L’invio email è disattivato in questo ambiente.");
      setEditing(false);
    } catch (err) { fail(err); }
    finally { setBusy(false); }
  }

  return <section className="card stack" aria-label="Verifica email" style={{ marginBottom: 20 }}>
    <strong>Email da confermare</strong>
    <p className="muted">Conferma {user.email} per cercare profili e usare il matching. Puoi già compilare la survey, scegliere gli obiettivi e completare il tuo profilo.</p>
    {error ? <p className="error" role="alert">{error}</p> : null}
    {message ? <p className="success" role="status">{message}</p> : null}
    {!user.email_delivery_enabled ? <p className="muted">L’invio email è disattivato in questo ambiente.</p> : null}
    <div className="actions">
      <button className="button secondary" type="button" disabled={busy || !user.email_delivery_enabled} onClick={() => void resend()}>Invia link di verifica</button>
      <button className="button secondary" type="button" disabled={busy} onClick={() => { setEmail(user.email); setEditing(value => !value); }}>Correggi email</button>
    </div>
    {editing ? <form className="stack" onSubmit={correct}>
      <label htmlFor="corrected-email">Email corretta</label>
      <input className="input" id="corrected-email" autoComplete="email" type="email" required maxLength={255}
        value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
      <button className="button dark" disabled={busy} type="submit">Salva email e invia verifica</button>
    </form> : null}
    <small className="muted">Per un nuovo link attendi almeno 60 secondi. Massimo 5 richieste all’ora.</small>
  </section>;
}
