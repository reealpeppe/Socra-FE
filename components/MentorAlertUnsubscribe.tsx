"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/Brand";
import styles from "@/app/(public)/login/auth.module.css";

export function MentorAlertUnsubscribe() {
  const token = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!token.current) token.current = new URLSearchParams(window.location.hash.slice(1)).get("token");
    window.history.replaceState(window.history.state, "", window.location.pathname);
    queueMicrotask(() => { setHasToken(Boolean(token.current)); setReady(true); });
  }, []);
  async function unsubscribe() {
    if (busy || !token.current) return;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/mentor-alerts/unsubscribe", { method: "POST", credentials: "omit", cache: "no-store",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: token.current }), signal: AbortSignal.timeout(15_000) });
      const result = await response.json();
      if (!response.ok) throw new Error(typeof result?.detail === "string" ? result.detail : "Link non valido. Puoi gestire gli avvisi nelle impostazioni.");
      token.current = null; setDone(true);
    } catch (err) { setError(err instanceof Error && err.name !== "TimeoutError" ? err.message : "Non abbiamo ricevuto la conferma. Riprova tra poco."); }
    finally { setBusy(false); }
  }
  return <div className={styles.page}><main className={styles.main} id="main-content" tabIndex={-1}><section className={styles.card} aria-labelledby="unsubscribe-title">
    <div className={styles.brandRow}><Link href="/" className={styles.brandLink} aria-label="Torna alla pagina iniziale di Socra"><Brand variant="dark" /></Link></div>
    <h1 className={styles.title} id="unsubscribe-title">Avvisi sui mentor</h1>
    <p className={styles.subtitle}>Puoi disattivare le email che ti avvisano quando c’è un mentor per i tuoi obiettivi. Continuerai a ricevere le email relative al tuo account e ai percorsi.</p>
    {error ? <p className={styles.error} role="alert">{error}</p> : null}
    {done ? <p className="success" role="status">Avvisi sui mentor disattivati. Puoi riattivarli nelle impostazioni.</p> : !ready ? <p role="status">Preparazione del link…</p> : !hasToken ? <p className={styles.error} role="alert">Link non valido o incompleto. Puoi gestire gli avvisi nelle impostazioni.</p> : <button className={styles.submit} type="button" disabled={busy} aria-busy={busy} onClick={() => void unsubscribe()}>{busy ? "Disattivazione…" : "Disattiva gli avvisi sui mentor"}</button>}
    <p className={styles.footerText}><Link href="/settings#mentor-alerts" className={styles.footerLink}>Vai alle impostazioni</Link></p>
  </section></main></div>;
}
