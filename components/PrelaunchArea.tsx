"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Copy, LockKeyhole, Mail, MessageCircle, UsersRound } from "lucide-react";
import { Brand } from "@/components/Brand";
import { accountPost, authPost, clientGet, clientPost, clientPut } from "@/lib/api";
import { launchDate, preparationHref, type Intent, type LaunchArea, type Preparation } from "@/lib/prelaunch";
import type { UserMe } from "@/lib/types";
import styles from "./Prelaunch.module.css";

const intentOptions: { value: Intent; label: string; description: string }[] = [
  { value: "learn", label: "Voglio imparare", description: "Scegli le attività su cui vuoi migliorare." },
  { value: "teach", label: "Voglio insegnare", description: "Indica le attività su cui puoi aiutare." },
  { value: "both", label: "Entrambi", description: "Prepara sia gli obiettivi sia le attività che puoi offrire." },
];
const stepCopy = {
  details: { label: "Aggiungi i tuoi dati", detail: "Aggiungi nome e cognome nelle impostazioni." },
  intent: { label: "Scegli cosa vuoi fare", detail: "Puoi imparare, insegnare o fare entrambe le cose." },
  experience: { label: "Completa l’esperienza", detail: "Salva ciò che sai fare e indica le attività su cui vuoi aiutare." },
  goal: { label: "Scegli il tuo obiettivo", detail: "Indica cosa vuoi imparare quando aprirà Socra." },
};

export function PrelaunchFrame({ user, children }: { user: UserMe; children: React.ReactNode }) {
  const router = useRouter();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    setError(false);
    try {
      await authPost("logout");
      router.replace("/");
      router.refresh();
    } catch {
      setError(true);
      setBusy(false);
    }
  }

  return <div className={styles.area}>
    <header className={styles.areaBar}>
      <div className={styles.areaBarInner}>
        <Link href="/dashboard" aria-label="Socra, la tua area"><Brand variant="dark" /></Link>
        <nav aria-label="Area di pre-lancio">
          <Link href="/dashboard">La tua area</Link>
          <Link href="/settings">Impostazioni</Link>
          <button className="button ghost" disabled={busy} onClick={() => void logout()}>{busy ? "Uscita…" : "Esci"}</button>
        </nav>
      </div>
      {error && <p className={styles.error} role="alert">Non siamo riusciti a chiudere la sessione di {user.username}. Riprova.</p>}
    </header>
    <main className={styles.areaMain} id="main-content">{children}</main>
  </div>;
}

export function PrelaunchArea({ user, roleEditor, completion }: { user: UserMe; roleEditor: boolean; completion: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<LaunchArea | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => clientGet<LaunchArea>("/prelaunch/me"), []);
  useEffect(() => {
    let active = true;
    let generation = 0;
    function reload() {
      const current = ++generation;
      load().then(value => {
        if (active && current === generation) {
          if (value.phase === "open") { router.replace("/dashboard"); router.refresh(); return; }
          setState(value);
          setError(null);
        }
      }).catch(() => {
        if (active && current === generation) setError("Non riusciamo a caricare la tua area. Riprova tra poco.");
      });
    }
    reload();
    window.addEventListener("focus", reload);
    window.addEventListener("socra:session-refresh", reload);
    return () => {
      active = false;
      window.removeEventListener("focus", reload);
      window.removeEventListener("socra:session-refresh", reload);
    };
  }, [load, router, roleEditor, completion]);

  if (error) return <div className={styles.panel}><p role="alert">{error}</p><button className="button secondary" onClick={() => window.location.reload()}>Riprova</button></div>;
  if (!state) return <p role="status">Caricamento della tua area…</p>;

  const { preparation, referrals } = state;
  const ready = preparation.next_step === "ready";
  const verified = preparation.email_verified;
  const date = launchDate(state.expected_launch_at);

  if (roleEditor) return <RoleForm key={preparation.intent} intent={preparation.intent} load={load} />;

  return <>
    <header className={completion && ready ? styles.completionIntro : styles.areaIntro}>
      {completion && ready ? <>
        <CheckCircle2 size={32} aria-hidden="true" />
        <h1>Profilo pronto.</h1>
        <p>{verified ? "Hai completato la preparazione e confermato il tuo indirizzo." : "Come ultimo passo, conferma la tua email."}</p>
      </> : <>
        <div>
          <h1>Ciao {preparation.first_name}, ci sei.</h1>
          <p>Qui puoi preparare il profilo e invitare le persone con cui vuoi condividere l’apertura di Socra.</p>
        </div>
        <div className={styles.launchInfo}><strong>{date || "Apertura in preparazione"}</strong><span>{date ? "Data prevista" : "Fase di pre-lancio"}</span></div>
      </>}
    </header>

    {ready && !verified ? <VerificationPanel
      key={user.email + ":" + (preparation.verification_delivery ?? "")}
      email={user.email}
      delivery={preparation.verification_delivery}
      emailEnabled={state.email_delivery_enabled}
      load={load}
      onVerified={setState}
    /> : null}

    {!completion || !ready ? <section className={styles.panel} aria-labelledby="preparation-heading">
      <h2 id="preparation-heading">Il tuo profilo</h2>
      {ready ? <p>{verified ? "La preparazione è completa e la tua email è confermata." : "La preparazione è completa. Manca la conferma dell’indirizzo."}</p>
        : <><p>{stepCopy[preparation.next_step as keyof typeof stepCopy].detail}</p>
          <Link className="button dark" href={preparationHref(preparation)}>
            {stepCopy[preparation.next_step as keyof typeof stepCopy].label} <ArrowRight size={17} aria-hidden="true" />
          </Link></>}
      {preparation.goal && <p><strong>Obiettivo:</strong> {preparation.goal}</p>}
      <div className={styles.textLinks}>
        <Link href="/prelancio/prepara">Modifica ruolo</Link>
        <Link href="/settings">Modifica dati</Link>
        {preparation.experience_saved && <Link href="/competenze">Esperienza</Link>}
        {preparation.experience_saved && preparation.intent !== "teach" && <Link href="/goal">Obiettivi</Link>}
      </div>
    </section> : null}

    {referrals.code ? <SharePanel code={referrals.code} accepted={referrals.accepted} ready={referrals.ready} />
      : !completion && <section className={styles.panel}><h2>I tuoi inviti</h2>
        <p>Il link personale sarà disponibile quando avrai completato il profilo e confermato l’email.</p>
      </section>}

    {completion && ready ? <p><Link className="button secondary" href="/dashboard">Vai alla tua area</Link></p>
      : <section className={styles.panel} aria-labelledby="opening-heading">
        <h2 id="opening-heading">All’apertura di Socra</h2>
        <p>Saldo attuale: <strong>{state.credits} crediti</strong>.
          {state.reserved_bonus > 0 && <> Bonus previsto all’apertura: <strong>+{state.reserved_bonus}</strong>.</>}</p>
        <ul className={styles.locked}>
          <li><LockKeyhole size={17} aria-hidden="true" /> Abbinamenti con mentor e apprendisti</li>
          <li><LockKeyhole size={17} aria-hidden="true" /> Richieste e percorsi di apprendimento</li>
          <li><LockKeyhole size={17} aria-hidden="true" /> Utilizzo dei crediti</li>
        </ul>
        <Link href="/prelancio/condizioni">Condizioni del pre-lancio</Link>
      </section>}
  </>;
}

function RoleForm({ intent, load }: { intent: Intent | null; load: () => Promise<LaunchArea> }) {
  const router = useRouter();
  const [selected, setSelected] = useState(intent);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !selected) return;
    setBusy(true);
    setError(null);
    try {
      await clientPut("/prelaunch/intent", { intent: selected });
      const state = await load();
      router.push(state.phase === "prelaunch" ? preparationHref(state.preparation) : "/dashboard");
    } catch {
      setError("Non siamo riusciti a salvare la scelta. Riprova.");
    } finally { setBusy(false); }
  }

  return <section className={styles.panel}>
    <h1>Cosa vuoi fare su Socra?</h1>
    <p>La scelta ci aiuta a mostrarti i passaggi per preparare il profilo. Potrai modificarla in seguito.</p>
    <form onSubmit={save}>
      <fieldset className={styles.roleOptions} disabled={busy}>
        <legend>Il tuo ruolo</legend>
        {intentOptions.map(option => <label className={styles.roleOption} key={option.value}>
          <input type="radio" name="intent" value={option.value} checked={selected === option.value} onChange={() => setSelected(option.value)} required />
          <span><strong>{option.label}</strong><span>{option.description}</span></span>
        </label>)}
      </fieldset>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.actions}>
        <button type="submit" className="button dark" disabled={busy || !selected}>{busy ? "Salvataggio…" : "Salva e continua"}</button>
        <Link href="/dashboard">Riprendi più tardi</Link>
      </div>
    </form>
  </section>;
}

function VerificationPanel({ email, delivery, emailEnabled, load, onVerified }: {
  email: string; delivery: string | null; emailEnabled: boolean; load: () => Promise<LaunchArea>;
  onVerified: (value: LaunchArea) => void;
}) {
  const [status, setStatus] = useState(delivery);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (delivery) return;
    clientPost<Preparation>("/prelaunch/finish").then(value => {
      if (active) setStatus(value.verification_delivery);
    }).catch(() => {
      if (active) setError("La richiesta di conferma non è riuscita. Riprova.");
    });
    return () => { active = false; };
  }, [delivery, email]);

  useEffect(() => {
    if (!status || !["pending", "retry", "sending"].includes(status)) return;
    let active = true;
    const interval = window.setInterval(() => {
      load().then(value => {
        if (!active || !value.preparation) return;
        if (value.preparation.email_verified) onVerified(value);
        else setStatus(value.preparation.verification_delivery);
      }).catch(() => {});
    }, 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [status, load, onVerified]);

  async function resend() {
    setBusy(true);
    setError(null);
    try {
      await accountPost("email-verification/request");
      const value = await load();
      if (value.preparation.email_verified) onVerified(value);
      else setStatus(value.preparation.verification_delivery);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Richiesta non riuscita.");
    } finally { setBusy(false); }
  }

  return <section className={styles.verification} aria-labelledby="verification-heading">
    <Mail size={25} aria-hidden="true" />
    <div>
      <h2 id="verification-heading">Conferma la tua email</h2>
      {status === "sent" ? <p role="status">Ti abbiamo inviato un’email a <strong>{email}</strong>. Apri il link mentre sei nel tuo account. Controlla anche lo spam.</p>
        : !emailEnabled || status === "suppressed" ? <p role="status">Indirizzo da confermare: <strong>{email}</strong>. L’invio è disattivato in questa anteprima.</p>
        : status === "expired" || status === "failed" || status === "cancelled" ? <p role="status">Richiedi un nuovo link per confermare <strong>{email}</strong>.</p>
        : <p role="status">Stiamo preparando l’email di conferma per <strong>{email}</strong>.</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.textLinks}>
        {emailEnabled && <button type="button" className="button secondary" disabled={busy} onClick={() => void resend()}>
          {busy ? "Richiesta in corso…" : "Invia di nuovo"}
        </button>}
        <Link href="/settings">Correggi l’indirizzo</Link>
      </div>
    </div>
  </section>;
}

function SharePanel({ code, accepted, ready }: { code: string; accepted: number; ready: number }) {
  const [url, setUrl] = useState("");
  const [copy, setCopy] = useState<"idle" | "ok" | "manual">("idle");
  useEffect(() => {
    queueMicrotask(() => setUrl(window.location.origin + "/prelancio#invito=" + encodeURIComponent(code)));
  }, [code]);
  return <section className={styles.panel} aria-labelledby="invites-heading">
    <h2 id="invites-heading">Invita chi vuoi su Socra</h2>
    <p>Condividi il tuo link. Chi lo apre vedrà il tuo username e potrà accettare l’invito riservando un posto.</p>
    <dl className={styles.inviteStats}>
      <div><dt>Inviti accettati e verificati</dt><dd>{accepted}</dd></div>
      <div><dt>Profili pronti</dt><dd>{ready}</dd></div>
    </dl>
    <label className={styles.field} htmlFor="share-link">Il tuo link di invito</label>
    <div className={styles.shareRow}>
      <input id="share-link" className="input" type="text" readOnly value={url} onFocus={e => e.currentTarget.select()} />
      <button type="button" className="button dark" disabled={!url} onClick={async () => {
        try { await navigator.clipboard.writeText(url); setCopy("ok"); }
        catch { setCopy("manual"); }
      }}><Copy size={16} aria-hidden="true" /> Copia link</button>
    </div>
    {copy !== "idle" && <p role="status">{copy === "ok" ? "Link copiato." : "Seleziona e copia il link dal campo."}</p>}
    {url && <div className={styles.textLinks}>
      <a href={"https://wa.me/?text=" + encodeURIComponent(url)} target="_blank" rel="noopener noreferrer"><MessageCircle size={16} aria-hidden="true" /> WhatsApp</a>
      <a href={"mailto:?subject=" + encodeURIComponent("Ti invito su Socra") + "&body=" + encodeURIComponent(url)}><Mail size={16} aria-hidden="true" /> Email</a>
      <a href={"https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(url)} target="_blank" rel="noopener noreferrer"><UsersRound size={16} aria-hidden="true" /> LinkedIn</a>
    </div>}
  </section>;
}
