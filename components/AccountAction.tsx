"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/Brand";
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";
import { accountPost, ClientApiError } from "@/lib/api";
import styles from "@/app/login/auth.module.css";

type Action = "verify" | "forgot" | "reset";
const copy = {
  verify: { title: "Verifica la tua email", intro: "Conferma l’indirizzo associato al tuo account Socra.", button: "Conferma email" },
  forgot: { title: "Password dimenticata?", intro: "Indica l’email del tuo account per richiedere un link di recupero.", button: "Richiedi recupero" },
  reset: { title: "Scegli una nuova password", intro: "Il link è personale e può essere utilizzato una sola volta.", button: "Salva nuova password" },
};

export function AccountAction({ action }: { action: Action }) {
  const token = useRef<string | null>(null);
  const [ready, setReady] = useState(action === "forgot");
  const [hasToken, setHasToken] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (action === "forgot") return;
    if (!token.current) token.current = new URLSearchParams(window.location.hash.slice(1)).get("token");
    // The fragment is never sent to the server, copied to storage, or kept in the address bar.
    window.history.replaceState(window.history.state, "", window.location.pathname);
    queueMicrotask(() => { setHasToken(Boolean(token.current)); setReady(true); });
  }, [action]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || (action !== "forgot" && !token.current)) return;
    setBusy(true); setError(null);
    try {
      if (action === "forgot") await accountPost("password-reset/request", { email: email.trim() });
      else if (action === "verify") await accountPost("email-verification/confirm", { token: token.current });
      else await accountPost("password-reset/confirm", { token: token.current, password });
      token.current = null; setPassword(""); setSuccess(true);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Operazione non riuscita. Riprova.");
    } finally { setBusy(false); }
  }

  return <div className={styles.page}>
    <PublicNavbar />
    <main className={styles.main} id="main-content" tabIndex={-1}>
      <section className={styles.card} aria-labelledby="account-action-title">
        <div className={styles.brandRow}><Link href="/" className={styles.brandLink} aria-label="Torna alla pagina iniziale di Socra"><Brand variant="dark" /></Link></div>
        <h1 className={styles.title} id="account-action-title">{copy[action].title}</h1>
        <p className={styles.subtitle}>{copy[action].intro}</p>
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
        {success ? <p className="success" role="status">{action === "verify" ? "Email verificata. Puoi continuare su Socra." : action === "reset" ? "Password aggiornata. Le sessioni precedenti sono state chiuse: accedi con la nuova password." : "Se esiste un account con questa email e l’invio è attivo, riceverai un link di recupero. Controlla anche la posta indesiderata."}</p>
          : !ready ? <p role="status">Preparazione del link…</p>
          : action !== "forgot" && !hasToken ? <p className={styles.error} role="alert">Link non valido o incompleto. {action === "reset" ? "Richiedi un nuovo link di recupero." : "Richiedi un nuovo link dalle impostazioni del tuo account."}</p>
          : <form method="post" onSubmit={submit} className={styles.form}>
            {action === "forgot" ? <div className={styles.field}><label className={styles.label} htmlFor="recovery-email">Email</label><input className={styles.input} id="recovery-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></div> : null}
            {action === "reset" ? <div className={styles.field}><label className={styles.label} htmlFor="new-password">Nuova password</label><input className={styles.input} id="new-password" type="password" autoComplete="new-password" required minLength={10} pattern="(?=.*[A-Za-z])(?=.*[0-9]).{10,}" aria-describedby="reset-password-hint" value={password} onChange={event => setPassword(event.target.value)} disabled={busy} /><p className={styles.hint} id="reset-password-hint">Almeno 10 caratteri, con almeno una lettera e un numero.</p></div> : null}
            <button className={styles.submit} type="submit" disabled={busy} aria-busy={busy}>{busy ? "Conferma in corso…" : copy[action].button}</button>
          </form>}
        <p className={styles.footerText}><Link href={action === "verify" ? "/settings" : "/login"} className={styles.footerLink}>{action === "verify" ? "Vai al tuo account" : "Torna all’accesso"}</Link></p>
        {action === "reset" && !success ? <p className={styles.footerText}><Link href="/forgot-password" className={styles.footerLink}>Richiedi un nuovo link</Link></p> : null}
      </section>
    </main>
    <PublicFooter />
  </div>;
}
