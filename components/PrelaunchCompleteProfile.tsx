"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { launchPost } from "@/lib/prelaunch";
import { refreshClientSession } from "@/lib/api";
import { RegistrationForm, type PrelaunchProof } from "./RegistrationForm";
import styles from "./Prelaunch.module.css";

type LinkResult = { email: string; confirm_only?: boolean; confirmed?: boolean } | { mode: "confirm" };

export function PrelaunchCompleteProfile({ browser = false }: { browser?: boolean }) {
  const router = useRouter();
  const [proof, setProof] = useState<PrelaunchProof | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [confirmOnly, setConfirmOnly] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const personalToken = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!browser && personalToken.current === null) {
      personalToken.current = new URLSearchParams(window.location.hash.slice(1)).get("token") || "";
      window.history.replaceState(window.history.state, "", window.location.pathname);
    }
    const token = personalToken.current;
    if (!browser && !token) {
      queueMicrotask(() => { if (active) setError("Riapri il link personale dalla tua email oppure richiedine uno nuovo."); });
      return () => { active = false; };
    }
    launchPost<LinkResult>(browser ? "reservation" : "profile-link", browser ? {} : { token })
      .then(value => {
        if (!active) return;
        if ("mode" in value) setConfirm(true);
        else {
          setProof(browser ? { kind: "browser", email: value.email } : { kind: "email", token: token!, email: value.email });
          setConfirmOnly(value.confirm_only === true);
          setConfirmed(value.confirmed === true);
        }
      })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Link non disponibile."); });
    return () => { active = false; };
  }, [browser]);

  async function confirmEmail() {
    if (busy || !personalToken.current) return;
    setBusy(true);
    setError(null);
    try {
      await launchPost("profile-confirm", { token: personalToken.current });
      refreshClientSession();
      router.replace("/prelancio/profilo-pronto");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Verifica non riuscita.");
    } finally { setBusy(false); }
  }

  if (proof) return <RegistrationForm proof={proof} emailAction={confirmOnly && (
    <div className={styles.confirmOnly}>
      {confirmed ? <p role="status">Indirizzo confermato. Puoi completare il profilo ora o riprendere dal link ricevuto.</p> :
        <button className="button secondary" type="button" disabled={busy} onClick={async () => {
          if (!personalToken.current || busy) return;
          setBusy(true);
          setError(null);
          try {
            await launchPost("reservation-confirm", { token: personalToken.current });
            setConfirmed(true);
          } catch (reason) {
            setError(reason instanceof Error ? reason.message : "Verifica non riuscita.");
          } finally { setBusy(false); }
        }}>{busy ? "Conferma…" : "Conferma solo l’indirizzo"}</button>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  )} />;
  return <main className={styles.page} id="main-content"><div className={styles.content}>
    {confirm ? <>
      <h1>Conferma la tua email</h1>
      <p>Apri questo link mentre sei nell’account con cui hai iniziato a preparare il profilo.</p>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className="button dark" disabled={busy} onClick={() => void confirmEmail()}>{busy ? "Conferma…" : "Conferma email"}</button>
      <p><Link href="/login?accesso=1" target="_blank" rel="noopener noreferrer">Accedi in una nuova scheda</Link> e torna qui. Se hai perso la password, <Link href="/forgot-password">recuperala</Link>.</p>
    </> : error ? <>
      <h1>Riprendiamo da qui.</h1>
      <p role="alert">{error}</p>
      <Link className="button dark" href="/prelancio">Richiedi un nuovo link</Link>
      <p><Link href="/login?accesso=1">Hai già un account? Accedi</Link></p>
      <p><Link href="/register">Crea un account se Socra è già aperta</Link></p>
    </> : <p role="status">Verifica della tua richiesta…</p>}
  </div></main>;
}
