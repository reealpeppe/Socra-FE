"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { LevelBadge, UserAvatar } from "@/components/Ui";
import { authPost, clientGet } from "@/lib/api";
import type { UserMe } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<UserMe | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientGet<UserMe>("/auth/me")
      .then(setMe)
      .catch((err: { message?: string }) => setError(err.message || "Account non disponibile"));
  }, []);

  async function logout() {
    await authPost("logout");
    router.push("/login");
    router.refresh();
  }

  const displayName = me?.nickname || me?.username || "Account";

  return (
    <AppShell>
      <div className="settings-page">
        <h1 className="settings-heading">Impostazioni</h1>

        {error && <div className="settings-error">{error}</div>}

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
          </div>
        </div>

        <div className="card settings-card">
          <h2 className="settings-section-title">Il tuo livello</h2>
          <div className="settings-level-row">
            {me ? <LevelBadge level={me.level} /> : <span className="settings-field-value">-</span>}
            <p className="settings-level-text">
              Il tuo livello riflette i percorsi completati e i segnali qualitativi maturati su Socra.
              {me?.is_coach && " Sei attivo come mentor."}
            </p>
          </div>
          <div style={{ marginTop: 16 }}>
            <Link href={me ? `/profiles/${me.id}` : "/profiles"} className="button secondary">
              Vedi il tuo profilo pubblico
            </Link>
          </div>
        </div>

        <div className="card settings-card">
          <h2 className="settings-section-title">Account</h2>
          <p className="settings-account-note">
            Accedi con username o email e password.
          </p>
          <button className="button danger" onClick={logout}>
            <LogOut size={16} aria-hidden />
            Logout
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
      `}</style>
    </AppShell>
  );
}
