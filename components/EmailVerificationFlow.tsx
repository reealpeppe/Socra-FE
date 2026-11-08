"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/Brand";
import { LoginForm } from "@/components/LoginForm";
import { accountPost, clientGet, ClientApiError, refreshClientSession } from "@/lib/api";
import { launchPost } from "@/lib/prelaunch";
import type { UserMe } from "@/lib/types";
import styles from "@/app/(public)/login/auth.module.css";

type Context = { email: string; requires_login: boolean; verified: boolean; prelaunch: boolean };

/** Keep the proof in memory while credentials are checked, including across browser contexts. */
export function EmailVerificationFlow({ token: suppliedToken, email, kind = "account" }: {
  token?: string;
  email?: string;
  kind?: "account" | "prelaunch";
}) {
  const token = useRef<string | null>(suppliedToken ?? null);
  const submitting = useRef(false);
  const [context, setContext] = useState<Context | null>(null);
  const [hasToken, setHasToken] = useState(false);
  const [phase, setPhase] = useState<"loading" | "login" | "confirm" | "success" | "error">("loading");
  const [ownerSession, setOwnerSession] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    if (token.current === null) token.current = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
    window.history.replaceState(window.history.state, "", window.location.pathname);
    async function load() {
      if (active) setHasToken(!!token.current);
      if (!token.current) throw new Error("Il link è incompleto. Riapri l’email oppure richiedi un nuovo link dal tuo account.");
      const owner = await clientGet<UserMe>("/auth/me").catch(reason => {
        if (reason instanceof ClientApiError && reason.status === 401) return null;
        throw reason;
      });
      const value = kind === "account"
        ? await accountPost<Context>("email-verification/context", { token: token.current })
        : { email: email!, requires_login: !owner || owner.email.trim().toLowerCase() !== email!.toLowerCase(), verified: false, prelaunch: true };
      if (!active) return;
      setContext(value);
      setOwnerSession(!!owner && owner.email.trim().toLowerCase() === value.email.toLowerCase());
      setError(null);
      setPhase(value.verified ? "success" : value.requires_login ? "login" : "confirm");
    }
    load().catch(reason => {
      if (active) { setError(reason instanceof Error ? reason.message : "Non riusciamo a verificare il link."); setPhase("error"); }
    });
    return () => { active = false; };
  }, [kind, email, attempt]);

  async function confirm() {
    if (!token.current || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      if (kind === "account") await accountPost("email-verification/confirm", { token: token.current });
      else await launchPost("profile-confirm", { token: token.current });
      token.current = null;
      refreshClientSession();
      setPhase("success");
    } catch (reason) {
      // Another tab may have completed the same proof after this page loaded.
      // Re-read it without weakening expiry, address or invalidation checks.
      if (reason instanceof ClientApiError && reason.status === 400 && token.current) {
        try {
          const completed = kind === "account"
            ? (await accountPost<Context>("email-verification/context", { token: token.current })).verified
            : (await launchPost<{ mode?: string }>("profile-link", { token: token.current })).mode === "access";
          if (completed) { token.current = null; refreshClientSession(); setPhase("success"); return; }
        } catch { /* Preserve the original failure when the proof is no longer valid. */ }
      }
      if (reason instanceof ClientApiError && [401, 403].includes(reason.status)) {
        setOwnerSession(false);
        setPhase("login");
        setError("Accedi con la password che hai scelto per questo indirizzo. La conferma riprenderà da qui.");
      } else setError(reason instanceof Error ? reason.message : "Conferma non riuscita. Riprova.");
    } finally { submitting.current = false; setBusy(false); }
  }

  return <div className={styles.page}><main className={styles.main} id="main-content" tabIndex={-1}>
    <section className={styles.card} aria-labelledby="email-proof-title">
      <div className={styles.brandRow}><Link className={styles.brandLink} href="/" aria-label="Torna alla pagina iniziale di Socra"><Brand variant="dark" /></Link></div>
      <h1 className={styles.title} id="email-proof-title">{phase === "success" ? context?.prelaunch ? "Email confermata." : "Email verificata." : "Conferma la tua email"}</h1>
      {phase === "loading" ? <p role="status">Verifica del link…</p> : <>
        {phase === "success" ? <p role="status">{context?.prelaunch
          ? "Il tuo posto su Socra è riservato. Nella tua area puoi ritrovare il profilo e prepararti al lancio."
          : "Email verificata. Puoi continuare su Socra."}</p>
          : context && <p className={styles.subtitle}>{phase === "login"
            ? <>Hai preparato il profilo per <strong>{context.email}</strong>. Inserisci la password scelta: confermeremo l’email senza farti riaprire il link.</>
            : <>Conferma <strong>{context.email}</strong> per completare questo passaggio.</>}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        {phase === "login" && context && <LoginForm compact initialIdentifier={context.email} submitLabel="Accedi e conferma"
          onSuccess={async user => {
            if (user.email.trim().toLowerCase() !== context.email.toLowerCase()) { setError("Accedi all’account associato all’indirizzo indicato."); return; }
            setOwnerSession(true);
            await confirm();
          }} />}
        {phase === "confirm" && <button className={styles.submit} disabled={busy} onClick={() => void confirm()}>{busy ? "Conferma…" : "Conferma email"}</button>}
        {phase === "error" && hasToken && <button className="button secondary" onClick={() => { setPhase("loading"); setAttempt(value => value + 1); }}>Riprova</button>}
        {phase === "error" && <p><Link href="/login">Accedi per richiedere un nuovo link</Link></p>}
        {phase === "success" && <p className={styles.footerText}><Link className={styles.footerLink}
          href={!context?.prelaunch ? "/settings" : ownerSession ? "/dashboard" : "/login"}>{!context?.prelaunch ? "Vai al tuo account" : ownerSession ? "Vai alla tua area" : "Accedi alla tua area"}</Link></p>}
        {phase === "success" && !context?.prelaunch && <p className={styles.footerText}><Link href="/inviti" className={styles.footerLink}>Riprendi una proposta di invito</Link></p>}
        {phase === "confirm" && <p className={styles.footerText}><Link className={styles.footerLink} href="/forgot-password">Non riconosci questa richiesta?</Link></p>}
      </>}
    </section>
  </main></div>;
}
