"use client";

import Link from "next/link";
import { ArrowRight, Clock3, ListChecks } from "lucide-react";
import { useEffect, useState } from "react";
import { launchPost, useLaunchStatus } from "@/lib/prelaunch";
import styles from "./Prelaunch.module.css";

export function PrelaunchThanks() {
  const { state } = useLaunchStatus();
  const [email, setEmail] = useState<string | null>(null);
  const [referral, setReferral] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [later, setLater] = useState(false);
  useEffect(() => {
    let active = true;
    launchPost<{ email: string; referral?: string }>("reservation", {}).then(value => {
      if (active) { setEmail(value.email); setReferral(value.referral ?? null); }
    })
      .catch(() => { /* The email link is the continuation on other browsers. */ })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <main className={styles.page} id="main-content"><div className={styles.wide}>
    <header className={styles.center}>
      <h1>Sei dentro. Il tuo posto è riservato.</h1>
      {state?.email_delivery_enabled === false ? <p role="status">Anteprima locale. La richiesta è registrata e l’invio delle email è disattivato.</p>
        : <p>Cerca l’email di conferma {email ? <>nella casella <strong>{email}</strong></> : "nella tua casella"}. Controlla anche la posta indesiderata.</p>}
    </header>
    {state?.phase === "open" ? <p><Link className="button dark" href="/register">Socra è aperta. Crea il tuo account</Link></p> :
      <div className={styles.choiceGrid}>
        <section className={styles.choicePanel}>
          <ListChecks size={24} aria-hidden="true" />
          <h2>Completa il profilo ora</h2>
          <p>Dicci cosa vuoi imparare o condividere. Potrai ritrovare i tuoi dati, l’esperienza e gli obiettivi nella tua area.</p>
          {loading ? <p role="status">Verifica della prenotazione…</p> : email
            ? <Link className="button dark" href="/prelancio/dati">Completa ora <ArrowRight size={17} aria-hidden="true" /></Link>
            : <p><strong>Apri il link nella tua email per continuare.</strong></p>}
        </section>
        <section className={styles.choicePanel}>
          <Clock3 size={24} aria-hidden="true" />
          <h2>Lo faccio dopo</h2>
          <p>Il posto resta riservato. Quando hai tempo, riprendi dal link nella tua email o accedi se hai già creato l’account.</p>
          {later ? <p className={styles.later} role="status">A presto. Puoi chiudere questa pagina.</p>
            : <button className="button secondary" onClick={() => setLater(true)}>Continuerò più tardi</button>}
        </section>
      </div>}
    <p className={styles.center}><Link href={"/prelancio?correggi=1" + (referral ? "#invito=" + encodeURIComponent(referral) : "")}>Correggi l’indirizzo o richiedi un nuovo link</Link> · <Link href="/login?accesso=1">Accedi</Link></p>
  </div></main>;
}
