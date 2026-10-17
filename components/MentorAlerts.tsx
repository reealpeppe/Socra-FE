"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, CheckCircle2 } from "lucide-react";
import { clientGet, clientPut } from "@/lib/api";
import styles from "./MentorAlerts.module.css";

type Preference = { enabled: boolean; subscribed_at: string | null; updated_at: string | null };
const endpoint = "/mentor-alerts/me";
function sessionMarker() { try { return localStorage.getItem("socra-session-change"); } catch { return null; } }

export function MentorAlerts({ ownerId, settings = false }: { ownerId: string; settings?: boolean }) {
  const [preference, setPreference] = useState<Preference | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const generation = useRef(0);
  const owner = useRef(sessionMarker());
  const [sessionValid, setSessionValid] = useState(true);

  useEffect(() => {
    const version = ++generation.current;
    const valid = () => version === generation.current && owner.current === sessionMarker();
    const refresh = () => {
      if (owner.current !== sessionMarker()) {
        generation.current = version + 1;
        setSessionValid(false); setPreference(null); setMessage(""); setError(null);
      }
    };
    window.addEventListener("socra:session-refresh", refresh);
    clientGet<Preference>(endpoint).then(value => {
      if (!valid()) return;
      if (typeof value?.enabled !== "boolean") throw new Error("Preferenza non disponibile.");
      setPreference(value); setError(null);
    }).catch(() => {
      if (valid()) setError("Non riusciamo a caricare la preferenza per gli avvisi. Riprova.");
    });
    return () => { generation.current = version + 1; window.removeEventListener("socra:session-refresh", refresh); };
  }, [ownerId, attempt]);

  async function save(enabled: boolean) {
    if (busy || !preference) return;
    if (!sessionValid || owner.current !== sessionMarker()) { setSessionValid(false); return; }
    const version = generation.current;
    const valid = () => version === generation.current && owner.current === sessionMarker();
    setBusy(true); setError(null); setMessage("");
    const confirm = (value: Preference) => {
      if (!valid()) return;
      setPreference(value);
      setMessage(enabled ? "Avvisi sui mentor attivati." : "Avvisi sui mentor disattivati.");
    };
    try {
      confirm(await clientPut<Preference>(endpoint, { enabled, source: settings ? "settings" : "matching" }));
    } catch (err) {
      if (!valid()) return;
      // A timeout can follow a committed write: read before reporting failure/retrying.
      const current = await clientGet<Preference>(endpoint).catch(() => null);
      if (!valid()) return;
      if (current?.enabled === enabled) confirm(current);
      else {
        if (current && typeof current.enabled === "boolean") setPreference(current);
        setError(err instanceof Error ? err.message : "Preferenza non salvata. Riprova.");
      }
    } finally {
      if (valid()) setBusy(false);
    }
  }

  if (!sessionValid) return <section className={`card ${styles.panel}`}><p role="status">La sessione è cambiata. Ricarica la pagina per gestire gli avvisi.</p><button className="button secondary" type="button" onClick={() => window.location.reload()}>Ricarica pagina</button></section>;
  return <section className={`card ${styles.panel} ${settings ? styles.settings : ""}`} id={settings ? "mentor-alerts" : undefined} aria-labelledby={settings ? "mentor-alert-settings-title" : "mentor-alert-title"}>
    {settings ? <h2 className="settings-section-title" id="mentor-alert-settings-title">Avvisi via email</h2> : <>
      <span className={styles.icon}><Bell size={24} aria-hidden="true" /></span>
      <h2 id="mentor-alert-title">Nessun mentor giusto per te, per ora</h2>
    </>}
    {settings ? <div className="settings-switch-row">
      <label htmlFor="mentor-alert-email"><strong>Avvisami quando c’è un mentor per i miei obiettivi</strong><p className="settings-account-note" id="mentor-alert-hint">Ricevi un’email quando sarà disponibile una persona che può aiutarti. Puoi disattivare questi avvisi in qualsiasi momento.</p></label>
      <label className="settings-switch"><input id="mentor-alert-email" type="checkbox" role="switch" aria-label="Avvisi sui mentor via email" aria-describedby="mentor-alert-hint" checked={preference?.enabled ?? false} disabled={!preference || busy} onChange={event => void save(event.target.checked)} /><span aria-hidden="true" /></label>
    </div> : <p>{preference?.enabled ? "Ti avviseremo via email quando sarà disponibile un mentor in linea con i tuoi obiettivi." : "Attiva gli avvisi via email: ti scriveremo quando sarà disponibile un mentor in linea con i tuoi obiettivi."}</p>}
    {!preference && !error ? <p role="status">Caricamento preferenza…</p> : null}
    {error ? <div className={styles.error} role="alert"><p>{error}</p>{!preference ? <button className="button secondary" type="button" onClick={() => setAttempt(value => value + 1)}>Riprova preferenza</button> : null}</div> : null}
    {!settings && preference ? preference.enabled ? <>
      <p className={styles.active} role="status"><CheckCircle2 size={19} aria-hidden="true" />Le notifiche sono attive</p>
      <Link className={styles.link} href="/settings#mentor-alerts">Gestisci gli avvisi nelle impostazioni</Link>
    </> : <button className="button primary" type="button" disabled={busy} aria-busy={busy} onClick={() => void save(true)}>{busy ? "Attivazione…" : "Avvisami via email"}</button> : null}
    {settings && (busy || message) ? <p className={styles.active} role="status">{busy ? "Salvataggio preferenza…" : message}</p> : null}
    {!settings ? <Link className={styles.link} href="/goal?edit=1">Modifica obiettivi</Link> : null}
  </section>;
}
