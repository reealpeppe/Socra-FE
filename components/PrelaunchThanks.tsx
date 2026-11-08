"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/LoginForm";
import { ClientApiError } from "@/lib/api";
import { launchPost, useLaunchStatus } from "@/lib/prelaunch";
import styles from "./Prelaunch.module.css";

export function PrelaunchThanks() {
  const { state } = useLaunchStatus();
  const [email, setEmail] = useState<string | null>(null);
  const [referral, setReferral] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [later, setLater] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    launchPost<{ email: string; referral?: string }>("reservation", {}).then(value => {
      if (active) { setEmail(value.email); setReferral(value.referral ?? null); }
    })
      .catch(reason => {
        if (active && (!(reason instanceof ClientApiError) || reason.status >= 500)) setUnavailable(true);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  if (loading) return <main className={styles.page} id="main-content"><div className={styles.wide}><p className={styles.center} role="status">Verifica della prenotazione…</p></div></main>;
  if (unavailable) return <main className={styles.page} id="main-content"><div className={styles.content}>
    <h1>Riprendiamo tra un momento.</h1><p role="alert">Non riusciamo a recuperare la tua prenotazione. Riprova tra poco.</p>
    <button className="button dark" onClick={() => window.location.reload()}>Riprova</button>
    <p><Link href="/login">Hai già creato un account? Accedi</Link></p>
  </div></main>;

  if (!email) return <main className={styles.page} id="main-content"><div className={styles.returnContent}>
    <header className={styles.center}>
      <h1>Il tuo posto è già riservato.</h1>
      <p>Se hai già creato il tuo account, accedi per ritrovare il profilo e continuare da dove eri rimasto.</p>
    </header>
    <div className={styles.returnForm}><LoginForm compact /></div>
    <p className={styles.center}>Hai lasciato solo l’email? Riprendi dal link che hai ricevuto oppure <Link href="/prelancio">Richiedi un nuovo link</Link>.</p>
  </div></main>;

  return <main className={styles.page} id="main-content"><div className={styles.wide}>
    <header className={styles.center}>
      <span className={styles.confirmMark}><Check size={30} strokeWidth={2.4} aria-hidden="true" /></span>
      <p className={styles.eyebrow}>Il primo passo è fatto</p>
      <h1>Sei dentro. Il tuo posto è riservato.</h1>
      {state?.email_delivery_enabled === false ? <p role="status">Anteprima locale. La richiesta è registrata e l’invio delle email è disattivato.</p>
        : <p>Cerca l’email per confermare l’indirizzo nella casella <strong>{email}</strong>. Puoi farlo anche più tardi. Controlla anche la posta indesiderata.</p>}
    </header>
    {state?.phase === "open" ? <p><Link className="button dark" href="/register">Socra è aperta. Crea il tuo account</Link></p> :
      <div className={styles.choiceGrid}>
        <section className={styles.choicePanel + " " + styles.choicePrimary}>
          <h2>Completa il profilo ora</h2>
          <p>Dicci se vuoi imparare, insegnare o entrambi, e qual è il tuo obiettivo. Prepara il tuo profilo per l’apertura di Socra.</p>
          <ul className={styles.choiceBenefits}>
            <li><Check size={18} aria-hidden="true" /> Scegli cosa imparare o condividere</li>
            <li><Check size={18} aria-hidden="true" /> Prepara la tua esperienza e i tuoi obiettivi</li>
            <li><Check size={18} aria-hidden="true" /> Ritrova i passaggi salvati nella tua area</li>
          </ul>
          <Link className="button secondary" href="/prelancio/dati">Completa ora <ArrowRight size={17} aria-hidden="true" /></Link>
        </section>
        <section className={styles.choicePanel}>
          <h2>Lo faccio dopo</h2>
          <p>Nessun problema, il tuo posto resta riservato. Quando hai tempo, riprendi dal link nella tua email o accedi se hai già creato l’account.</p>
          {later ? <p className={styles.later} role="status">A presto. Puoi chiudere questa pagina.</p>
            : <button className="button secondary" onClick={() => setLater(true)}>Continuerò più tardi</button>}
        </section>
      </div>}
    <p className={styles.center + " " + styles.fine}>Indirizzo sbagliato? <Link href={"/prelancio?correggi=1" + (referral ? "#invito=" + encodeURIComponent(referral) : "")}>Correggilo</Link> · <Link href="/login?accesso=1">Accedi</Link></p>
  </div></main>;
}
