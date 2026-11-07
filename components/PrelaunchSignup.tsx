"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { launchDate, launchPost, useLaunchStatus } from "@/lib/prelaunch";
import styles from "./Prelaunch.module.css";

const invitationKey = "socra:prelaunch-invitation";

export function PrelaunchSignup() {
  const router = useRouter();
  const { state, error: unavailable } = useLaunchStatus();
  const [email, setEmail] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [website, setWebsite] = useState("");
  const [updates, setUpdates] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviter, setInviter] = useState<string | null>(null);
  const [inviteState, setInviteState] = useState<"idle" | "loading" | "invalid">("idle");
  const referral = useRef<string | null>(null);
  const submission = useRef(false);
  const date = launchDate(state?.expected_launch_at);

  useEffect(() => {
    let active = true;
    if (referral.current === null) {
      const params = new URLSearchParams(window.location.hash.slice(1));
      referral.current = params.get("invito") || "";
      try {
        if (params.has("invito")) {
          if (referral.current) sessionStorage.setItem(invitationKey, referral.current);
          else sessionStorage.removeItem(invitationKey);
        } else referral.current = sessionStorage.getItem(invitationKey) || "";
      } catch { /* The original link remains usable without browser storage. */ }
      if (params.has("invito")) window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
    }
    if (referral.current) {
      queueMicrotask(() => { if (active) setInviteState("loading"); });
      launchPost<{ inviter: string }>("referral", { token: referral.current })
        .then(value => { if (active) { setInviter(value.inviter); setInviteState("idle"); } })
        .catch(() => { if (active) setInviteState("invalid"); });
    }
    return () => { active = false; };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submission.current) return;
    submission.current = true;
    setBusy(true);
    setError(null);
    try {
      const correction = new URLSearchParams(window.location.search).get("correggi") === "1";
      await launchPost("reserve", { email, accepted, website, updates_opt_in: updates, correction, referral: inviter ? referral.current : undefined });
      try { sessionStorage.removeItem(invitationKey); } catch { /* Reservation is already saved. */ }
      router.push("/prelancio/grazie");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Richiesta non riuscita. Riprova.");
    } finally {
      submission.current = false;
      setBusy(false);
    }
  }

  return <main className={styles.page} id="main-content"><div className={styles.content}>
    <h1>{date ? "Riserva il tuo posto su Socra." : "Socra sta arrivando. Riserva il tuo posto."}</h1>
    {date && <p className={styles.date}>Apertura prevista il {date}</p>}
    <p>La community dove la conoscenza finanziaria passa da persona a persona. Lascia la tua email per esserci dall’inizio.</p>
    {state?.phase === "open" ? <div className={styles.success}><p>Socra è aperta. Puoi creare il tuo account.</p><Link className="button dark" href="/register">Entra nella community</Link></div> :
      <form onSubmit={submit} className={styles.reservationForm}>
        {inviter && <p className={styles.inviteNotice}><strong>{inviter} ti ha invitato su Socra.</strong> Lascia la tua email e accetta l’invito.</p>}
        {inviteState === "loading" && <p role="status">Verifica dell’invito…</p>}
        {inviteState === "invalid" && <p role="status">Questo invito non è disponibile. Puoi comunque riservare un posto.</p>}
        <label className={styles.field} htmlFor="launch-email">La tua email
          <input id="launch-email" type="email" autoComplete="email" required maxLength={255} value={email} onChange={e => setEmail(e.target.value)} disabled={busy} />
        </label>
        <div className={styles.honeypot} aria-hidden="true"><label>Sito web
          <input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)} />
        </label></div>
        <label className={styles.consent}><input type="checkbox" required checked={accepted} onChange={e => setAccepted(e.target.checked)} disabled={busy} />
          <span>Richiedo il posto e dichiaro di aver letto l’<Link href="/prelancio/privacy">informativa privacy</Link>.</span>
        </label>
        <label className={styles.consent}><input type="checkbox" checked={updates} onChange={e => setUpdates(e.target.checked)} disabled={busy} />
          <span>Voglio ricevere aggiornamenti e promemoria sul lancio <span className={styles.optional}>(facoltativo)</span>.</span>
        </label>
        {error || unavailable ? <p className={styles.error} role="alert">{error || "Il servizio non è disponibile. Riprova tra poco."}</p> : null}
        <button className="button dark" type="submit" disabled={busy || !state || unavailable || inviteState === "loading"} aria-busy={busy}>
          {busy ? "Invio…" : inviter ? "Accetta l’invito" : "Riservami un posto"}
        </button>
        {inviter && <button type="button" className="button ghost" disabled={busy} onClick={() => {
          referral.current = "";
          try { sessionStorage.removeItem(invitationKey); } catch { /* The in-memory choice still applies. */ }
          setInviter(null); setError(null);
        }}>Continua senza invito</button>}
        <p className={styles.fine}>Riceverai un link personale per confermare il tuo indirizzo. <Link href="/prelancio/condizioni">Condizioni del pre-lancio</Link>.</p>
        {state && !state.email_delivery_enabled && <p className={styles.fine}>Anteprima locale. L’invio delle email è disattivato.</p>}
      </form>}
    <p className={styles.fine}>Hai già un account? <Link href="/login?accesso=1">Accedi</Link>.</p>
  </div></main>;
}
