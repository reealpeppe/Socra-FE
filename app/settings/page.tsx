"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { LevelBadge, UserAvatar } from "@/components/Ui";
import { authPost, ClientApiError, clientGet, clientPatch } from "@/lib/api";
import type { UserMe } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<UserMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingMentorStatus, setSavingMentorStatus] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    clientGet<UserMe>("/auth/me")
      .then(setMe)
      .catch((err: { message?: string }) => setError(err.message || "Account non disponibile"));
  }, []);

  async function logout() {
    setLoggingOut(true);
    setError(null);
    try {
      await authPost("logout");
      router.push("/login");
      router.refresh();
    } catch {
      setError("Disconnessione non riuscita. Riprova.");
      setLoggingOut(false);
    }
  }

  async function updateMentorStatus(isCoach: boolean) {
    if (!me || savingMentorStatus) return;
    setSavingMentorStatus(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await clientPatch<UserMe>("/profiles/me/mentor-status", { is_coach: isCoach });
      setMe(updated);
      setMessage(isCoach ? "Disponibilità come mentor attivata." : "Disponibilità come mentor disattivata.");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Preferenza mentor non salvata.");
    } finally {
      setSavingMentorStatus(false);
    }
  }

  const displayName = me?.nickname || me?.username || "Account";

  return (
    <AppShell>
      <div className="settings-page">
        <h1 className="settings-heading">Impostazioni</h1>

        {error && <div className="settings-error" role="alert">{error}</div>}
        {message && <div className="settings-success" role="status">{message}</div>}

        <div className="card settings-card">
          <h2 className="settings-section-title">Il tuo profilo</h2>
          <div className="settings-profile-top">
            <UserAvatar name={displayName} size="lg" />
            <div className="settings-profile-name">
              <strong>{displayName}</strong>
              {me?.nickname && me.username && (
                <span className="settings-username">@{me.username}</span>
              )}
            </div>
          </div>
          <div className="settings-fields">
            <div className="settings-field">
              <span className="settings-field-label">
                <UserRound size={15} aria-hidden /> Username
              </span>
              <span className="settings-field-value">{me?.username || "-"}</span>
            </div>
            <div className="settings-field">
              <span className="settings-field-label">
                <Mail size={15} aria-hidden /> Email
              </span>
              <span className="settings-field-value">{me?.email || "-"}</span>
            </div>
            {me?.nickname !== undefined && (
              <div className="settings-field">
                <span className="settings-field-label">Nome visibile</span>
                <span className="settings-field-value">{me.nickname || "-"}</span>
              </div>
            )}
            <div className="settings-field">
              <span className="settings-field-label">Stato account</span>
              <span className="settings-field-value">{me?.account_status === "active" ? "Attivo" : me?.account_status || "-"}</span>
            </div>
          </div>
        </div>

        <div className="card settings-card">
          <h2 className="settings-section-title">Il tuo livello</h2>
          <div className="settings-level-row">
            {me ? <LevelBadge level={me.level} /> : <span className="settings-field-value">-</span>}
            <p className="settings-level-text">
              Il livello iniziale deriva dalla survey e può evolvere con percorsi completati e segnali qualitativi.
              {me?.is_coach && " Sei attivo come mentor."}
            </p>
          </div>
          <div style={{ marginTop: 16 }}>
            {me ? <Link href={`/profiles/${me.id}`} className="button secondary">Vedi il tuo profilo pubblico</Link> : null}
          </div>
        </div>

        <div className="card settings-card">
          <h2 className="settings-section-title">Disponibilità come mentor</h2>
          <div className="settings-switch-row">
            <div>
              <strong>Ricevi richieste compatibili</strong>
              <p className="settings-account-note">
                {me?.level === "L0"
                  ? "La disponibilità si sblocca dal livello L1."
                  : "Puoi disattivarla in qualsiasi momento. I percorsi già aperti non vengono interrotti."}
              </p>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                role="switch"
                aria-label="Disponibilità come mentor"
                checked={!!me?.is_coach}
                disabled={!me || me.level === "L0" || savingMentorStatus}
                onChange={(event) => updateMentorStatus(event.target.checked)}
              />
              <span aria-hidden />
            </label>
          </div>
          {savingMentorStatus ? <p className="settings-account-note" role="status">Salvataggio preferenza…</p> : null}
        </div>

        <div className="card settings-card">
          <h2 className="settings-section-title">Account</h2>
          <p className="settings-account-note">
            Accedi con username o email e password.
          </p>
          <button className="button danger" type="button" onClick={logout} disabled={loggingOut}>
            <LogOut size={16} aria-hidden />
            {loggingOut ? "Disconnessione…" : "Esci"}
          </button>
        </div>
      </div>

      <style jsx global>{`
        .settings-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 32px 24px;
          display: grid;
          gap: 24px;
        }
        .settings-heading {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--ink);
          margin: 0;
        }
        .settings-error {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: var(--radius-sm);
          color: #dc2626;
          font-size: 0.875rem;
          padding: 10px 14px;
        }
        .settings-success {
          background: var(--mint-100);
          border: 1px solid #b9ecd3;
          border-radius: var(--radius-sm);
          color: var(--mint-600);
          font-size: 0.875rem;
          padding: 10px 14px;
        }
        .settings-card {
          display: grid;
          gap: 16px;
        }
        .settings-section-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--ink);
          margin: 0;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--line);
        }
        .settings-profile-top {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .settings-profile-name {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .settings-profile-name strong {
          font-size: 1.0625rem;
          color: var(--ink);
        }
        .settings-username {
          font-size: 0.85rem;
          color: var(--muted);
        }
        .settings-fields {
          display: grid;
          gap: 0;
        }
        .settings-field {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--line);
          gap: 12px;
        }
        .settings-field:last-child {
          border-bottom: none;
        }
        .settings-field-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--muted);
        }
        .settings-field-value {
          font-size: 0.9375rem;
          color: var(--ink);
          font-weight: 500;
        }
        .settings-level-row {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .settings-level-text {
          font-size: 0.9rem;
          color: var(--muted);
          margin: 0;
          line-height: 1.5;
        }
        .settings-account-note {
          font-size: 0.875rem;
          color: var(--muted);
          margin: 0;
        }
        .settings-switch-row {
          align-items: center;
          display: flex;
          gap: 20px;
          justify-content: space-between;
        }
        .settings-switch-row strong {
          color: var(--ink);
          display: block;
          margin-bottom: 5px;
        }
        .settings-switch {
          flex-shrink: 0;
          position: relative;
        }
        .settings-switch input {
          height: 1px;
          opacity: 0;
          position: absolute;
          width: 1px;
        }
        .settings-switch span {
          background: var(--line);
          border-radius: 999px;
          cursor: pointer;
          display: block;
          height: 30px;
          position: relative;
          transition: background 0.18s ease;
          width: 52px;
        }
        .settings-switch span::after {
          background: white;
          border-radius: 999px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
          content: "";
          height: 24px;
          left: 3px;
          position: absolute;
          top: 3px;
          transition: transform 0.18s ease;
          width: 24px;
        }
        .settings-switch input:checked + span {
          background: var(--mint-600);
        }
        .settings-switch input:checked + span::after {
          transform: translateX(22px);
        }
        .settings-switch input:focus-visible + span {
          outline: 3px solid rgba(29, 78, 216, 0.3);
          outline-offset: 2px;
        }
        .settings-switch input:disabled + span {
          cursor: not-allowed;
          opacity: 0.55;
        }
      `}</style>
    </AppShell>
  );
}
