"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Award } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { UserAvatar, LevelBadge, MetricStat } from "@/components/Ui";
import { clientGet } from "@/lib/api";
import type { GoalsMe, MatchRequestItem, PathItem, PublicProfile, UserMe, Wallet } from "@/lib/types";

type DashboardErrorKey = "user" | "wallet" | "goals" | "requests" | "paths";

export default function DashboardPage() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [goals, setGoals] = useState<GoalsMe | null>(null);
  const [requests, setRequests] = useState<MatchRequestItem[]>([]);
  const [paths, setPaths] = useState<PathItem[]>([]);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [errors, setErrors] = useState<Partial<Record<DashboardErrorKey, string>>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      clientGet<UserMe>("/auth/me"),
      clientGet<Wallet>("/wallet/me"),
      clientGet<GoalsMe>("/goals/me"),
      clientGet<MatchRequestItem[]>("/matching/requests/me?role=all"),
      clientGet<PathItem[]>("/paths/me")
    ]).then(([userResult, walletResult, goalResult, requestResult, pathResult]) => {
      if (!active) return;

      const nextErrors: Partial<Record<DashboardErrorKey, string>> = {};

      if (userResult.status === "fulfilled") setMe(userResult.value);
      else nextErrors.user = userResult.reason?.message || "Profilo non disponibile";

      if (walletResult.status === "fulfilled") setWallet(walletResult.value);
      else nextErrors.wallet = walletResult.reason?.message || "Wallet non disponibile";

      if (goalResult.status === "fulfilled") setGoals(goalResult.value);
      else nextErrors.goals = goalResult.reason?.message || "Obiettivi non disponibili";

      if (requestResult.status === "fulfilled")
        setRequests(Array.isArray(requestResult.value) ? requestResult.value : []);
      else nextErrors.requests = requestResult.reason?.message || "Richieste non disponibili";

      if (pathResult.status === "fulfilled")
        setPaths(Array.isArray(pathResult.value) ? pathResult.value : []);
      else nextErrors.paths = pathResult.reason?.message || "Percorsi non disponibili";

      setErrors(nextErrors);
      setLoading(false);
    });

    return () => { active = false; };
	  }, []);

  useEffect(() => {
    if (!me?.id) return;
    clientGet<PublicProfile>(`/profiles/${me.id}`)
      .then(setProfile)
      .catch(() => setProfile(null));
  }, [me?.id]);

  const activeGoal = goals?.active_goal || goals?.current || null;
  const displayName = me?.nickname || me?.username || "Socra user";

  const menteePaths = useMemo(
    () => paths.filter(p => p.mentee_id === me?.id),
    [paths, me?.id]
  );
  const completedPaths = useMemo(
    () => paths.filter(p => p.status === "completed").length,
    [paths]
  );
  const pendingRequests = useMemo(
    () => requests.filter(r => r.status === "pending" && r.mentor_id === me?.id),
    [requests, me?.id]
  );
  const mentorBadges = profile?.public_badges || [];

  return (
    <AppShell>
      <div className="dash-page" aria-busy={loading}>
        {/* Greeting */}
        <div className="dash-greeting">
          <h1>Ciao {displayName}</h1>
          <p>Benvenuto nella tua dashboard. Qui trovi tutto quello che ti serve per il tuo percorso Socra.</p>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="dash-alert" role="status">
            Alcuni dati non sono disponibili al momento. Mostriamo solo le informazioni già verificate.
          </div>
        )}

        <div className="dash-layout">
          {/* ── Colonna sinistra ── */}
          <div className="dash-left">

            {/* Card MENTOR */}
            <div className="card dash-identity-card">
              <div className="dash-identity-header">
                <span className="dash-identity-label">La tua identità di mentor</span>
                {me?.is_coach && (
                  <span className="dash-active-badge">Mentor attivo</span>
                )}
              </div>

              <div className="dash-identity-user">
                <UserAvatar name={displayName} size="lg" />
                <div>
                  <p className="dash-identity-name">{displayName}</p>
                  <div className="dash-identity-meta">
                    <LevelBadge level={me?.level || "L0"} />
                    <span className="dash-identity-role">
                      {me?.is_coach ? "Mentor" : "Percorso verso mentor"}
                    </span>
                  </div>
                </div>
                <div className="dash-identity-aside">
                  <p className="dash-aside-label">Cosa ti aspetta?</p>
                  <ul className="dash-aside-list">
                    <li>Il tuo livello influisce sulla portata delle sessioni</li>
                    <li>Puoi ricevere richieste dai mentee adatti al tuo profilo</li>
                    <li>Ogni percorso completato rafforza il tuo profilo</li>
                  </ul>
                  {!me?.is_coach && (
                    <Link href="/settings" className="dash-aside-cta">
                      Prepara profilo mentor
                    </Link>
                  )}
                </div>
              </div>

              {/* Le tue competenze */}
              <div className="dash-section-divider">
                <span className="dash-section-label">Le tue competenze</span>
              </div>
              <p className="dash-muted-hint">
                Le competenze sono derivate dai tuoi percorsi completati e dai badge ottenuti.
                Completa percorsi come mentor per aggiornare questo pannello.
              </p>

              {mentorBadges.length > 0 && (
                <div className="dash-badge-row" aria-label="Badge qualitativi piu ricevuti">
                  {mentorBadges.map((badge) => (
                    <span className="dash-quality-badge" key={badge}>
                      <Award size={13} aria-hidden /> {badge}
                    </span>
                  ))}
                </div>
              )}

              {/* Performance mentor */}
              <div className="dash-section-divider" style={{ marginTop: "16px" }}>
                <span className="dash-section-label">La tua performance come mentor</span>
              </div>
              <div className="dash-mentor-stats">
                <MetricStat
                  value={`${completedPaths}`}
                  label="Percorsi completati"
                />
                <MetricStat
                  value={pendingRequests.length}
                  label="Richieste in attesa"
                />
                <MetricStat
                  value={wallet?.balance ?? "-"}
                  label="Crediti"
                />
              </div>

              <div className="dash-mentor-footer">
                <span className="dash-muted-hint">I tuoi percorsi da mentor</span>
                <Link href="/paths?tab=mentor" className="dash-link-small">Vedi tutti</Link>
              </div>
            </div>

            {/* Card MENTEE */}
            <div className="card dash-identity-card" style={{ marginTop: "16px" }}>
              <div className="dash-identity-header">
                <span className="dash-identity-label">La tua identità di mentee</span>
              </div>
              <div style={{ marginTop: "12px" }}>
                {activeGoal ? (
                  <div>
                    <p className="dash-muted-hint" style={{ marginBottom: "4px" }}>Il tuo obiettivo attivo</p>
                    <p style={{ fontWeight: 700, margin: "0 0 6px", color: "var(--ink)" }}>{activeGoal.goal_tag}</p>
                    <p className="dash-muted-hint" style={{ margin: "0 0 16px" }}>{activeGoal.topic || "Topic non definito"}</p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Link href="/goal" className="button secondary" style={{ fontSize: "0.8rem" }}>
                        Modifica obiettivo
                      </Link>
                      <Link href={`/matching?goalId=${activeGoal.id}`} className="button" style={{ fontSize: "0.8rem" }}>
                        Trova un mentor
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="dash-muted-hint" style={{ margin: "0 0 12px" }}>
                      Nessun obiettivo attivo. Definiscine uno per iniziare il matching.
                    </p>
                    <Link href="/goal" className="button">Definisci obiettivo</Link>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── Colonna destra ── */}
          <div className="dash-right">

            {/* Il tuo obiettivo */}
            <div className="card">
              <div className="dash-identity-header">
                <span className="dash-identity-label">Il tuo obiettivo</span>
                {activeGoal && (
                  <Link href="/goal" className="dash-link-small">Modifica</Link>
                )}
              </div>
              {activeGoal ? (
                <div>
                  <p style={{ fontWeight: 700, margin: "0 0 6px", color: "var(--ink)" }}>
                    {activeGoal.goal_tag}
                  </p>
                  <p className="dash-muted-hint" style={{ margin: "0 0 16px" }}>
                    {activeGoal.topic}
                  </p>
                  <Link href={`/matching?goalId=${activeGoal.id}`} className="button" style={{ width: "100%", justifyContent: "center" }}>
                    Trova mentor
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="dash-muted-hint" style={{ marginBottom: "12px" }}>
                    Nessun obiettivo definito
                  </p>
                  <Link href="/goal" className="button" style={{ width: "100%", justifyContent: "center" }}>
                    Crea obiettivo
                  </Link>
                </div>
              )}
            </div>

            {/* I tuoi percorsi da mentee */}
            <div className="card" style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <span className="dash-identity-label">I tuoi percorsi da mentee</span>
                <Link href="/paths?tab=mentee" className="dash-link-small">Vedi tutti</Link>
              </div>
              {loading ? (
                <p className="dash-muted-hint">Caricamento...</p>
              ) : menteePaths.length === 0 ? (
                <p className="dash-muted-hint">Nessun percorso attivo.</p>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  {menteePaths.slice(0, 5).map(path => (
                    <PathRow key={path.id} path={path} meId={me?.id} />
                  ))}
                </div>
              )}
            </div>

            {/* Azioni rapide */}
            <div className="card dash-quick-actions" style={{ marginTop: "16px" }}>
              <span className="dash-identity-label" style={{ marginBottom: "12px", display: "block" }}>Azioni rapide</span>
              <div className="dash-quick-list">
                <Link href="/goal" className="dash-quick-item">
	                  <span className="dash-quick-icon" aria-hidden>O</span>
                  <span>Modifica i tuoi obiettivi</span>
                </Link>
	                <Link href="/livelli" className="dash-quick-item">
	                  <span className="dash-quick-icon" aria-hidden>L</span>
	                  <span>Scopri i livelli</span>
                </Link>
                <Link href="/matching" className="dash-quick-item">
	                  <span className="dash-quick-icon" aria-hidden>M</span>
                  <span>Trova un mentor</span>
                </Link>
              </div>
            </div>

          </div>
        </div>

        {/* Banner bottom */}
        <div className="dash-banner">
          <div className="dash-banner-content">
	            <p className="dash-banner-icon">Socra</p>
            <div>
              <p style={{ fontWeight: 700, margin: "0 0 2px", color: "white" }}>
                Ogni passo si avvicina ai tuoi obiettivi!
              </p>
              <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.875rem", margin: 0 }}>
                Impara, sperimenta, confrontati e continua a crescere.
              </p>
            </div>
          </div>
          <Link href="/matching" className="button" style={{ whiteSpace: "nowrap", background: "white", color: "var(--navy-950)" }}>
            Esplora opportunità <ArrowRight size={16} style={{ display: "inline" }} />
          </Link>
        </div>
      </div>

      <style jsx global>{`
        /* ── Dashboard layout ── */
        .dash-page {
          display: grid;
          gap: 20px;
          max-width: 1200px;
        }

        .dash-greeting h1 {
          color: var(--ink);
          font-size: clamp(1.5rem, 3vw, 2rem);
          margin: 0 0 6px;
        }

        .dash-greeting p {
          color: var(--muted);
          margin: 0;
        }

        .dash-alert {
          background: #fff9ea;
          border: 1px solid #f4d17b;
          border-radius: var(--radius-sm, 10px);
          color: #8a5c00;
          font-size: 0.875rem;
          padding: 12px 16px;
        }

        .dash-layout {
          display: grid;
          gap: 20px;
          grid-template-columns: minmax(0, 1fr) 360px;
        }

        .dash-left,
        .dash-right {
          display: flex;
          flex-direction: column;
        }

        /* ── Identity card ── */
        .dash-identity-card {
          /* uses .card from globals */
        }

        .dash-identity-header {
          align-items: center;
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .dash-identity-label {
          color: var(--muted);
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .dash-active-badge {
          background: var(--navy-950, #0c1f38);
          border-radius: 999px;
          color: white;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 5px 14px;
        }

        .dash-identity-user {
          display: grid;
          gap: 14px;
          grid-template-columns: auto auto 1fr;
          align-items: start;
        }

        .dash-identity-name {
          color: var(--ink);
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 6px;
        }

        .dash-identity-meta {
          align-items: center;
          display: flex;
          gap: 8px;
        }

        .dash-identity-role {
          color: var(--muted);
          font-size: 0.8rem;
        }

        .dash-identity-aside {
          background: var(--paper, #f7f8fa);
          border: 1px solid var(--line, #e4e8ef);
          border-radius: var(--radius-sm, 10px);
          font-size: 0.82rem;
          padding: 12px 14px;
        }

        .dash-aside-label {
          color: var(--ink);
          font-weight: 700;
          margin: 0 0 8px;
        }

        .dash-aside-list {
          color: var(--muted);
          display: grid;
          gap: 4px;
          line-height: 1.4;
          list-style: disc;
          margin: 0 0 10px;
          padding-left: 16px;
        }

        .dash-aside-cta {
          color: var(--navy-950, #0c1f38);
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
        }

        .dash-aside-cta:hover {
          text-decoration: underline;
        }

        /* ── Section dividers ── */
        .dash-section-divider {
          border-top: 1px solid var(--line, #e4e8ef);
          margin-top: 20px;
          padding-top: 16px;
        }

        .dash-section-label {
          color: var(--muted);
          font-size: 0.7rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          margin: 0;
          text-transform: uppercase;
        }

	        .dash-muted-hint {
          color: var(--muted);
          font-size: 0.85rem;
          line-height: 1.5;
          margin: 8px 0 0;
	        }

	        .dash-badge-row {
	          display: flex;
	          flex-wrap: wrap;
	          gap: 8px;
	          margin-top: 12px;
	        }

	        .dash-quality-badge {
	          align-items: center;
	          background: #eef4ff;
	          border: 1px solid #cfdbff;
	          border-radius: 999px;
	          color: #1d4ed8;
	          display: inline-flex;
	          font-size: 0.76rem;
	          font-weight: 800;
	          gap: 5px;
	          padding: 5px 10px;
	        }

        /* ── Mentor stats ── */
        .dash-mentor-stats {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, 1fr);
          margin-top: 16px;
        }

        .dash-mentor-footer {
          align-items: center;
          display: flex;
          justify-content: space-between;
          margin-top: 12px;
        }

        /* ── Right column cards ── */
        .dash-link-small {
          color: var(--muted);
          font-size: 0.8rem;
          font-weight: 600;
          text-decoration: none;
        }

        .dash-link-small:hover {
          color: var(--ink);
        }

        /* ── Path row ── */
        .dash-path-row {
          align-items: center;
          background: var(--paper, #f7f8fa);
          border: 1px solid var(--line, #e4e8ef);
          border-radius: var(--radius-sm, 10px);
          color: inherit;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          padding: 10px 14px;
          text-decoration: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .dash-path-row:hover {
          border-color: var(--navy-950, #0c1f38);
          box-shadow: 0 2px 8px rgba(12, 31, 56, 0.08);
        }

        .dash-path-name {
          color: var(--ink);
          font-size: 0.9rem;
          font-weight: 700;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dash-path-goal {
          color: var(--muted);
          font-size: 0.75rem;
          margin: 0;
        }

        .dash-path-status {
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 800;
          padding: 4px 10px;
          white-space: nowrap;
        }

        .dash-path-status.open {
          background: #dbeafe;
          color: #1d4ed8;
        }

        .dash-path-status.pending {
          background: #ffedd5;
          color: #b45309;
        }

        .dash-path-status.feedback_pending {
          background: #ffedd5;
          color: #b45309;
        }

        .dash-path-status.completed {
          background: #dcfce7;
          color: #15803d;
        }

        /* ── Quick actions ── */
        .dash-quick-list {
          display: grid;
          gap: 8px;
        }

        .dash-quick-item {
          align-items: center;
          background: var(--paper, #f7f8fa);
          border: 1px solid var(--line, #e4e8ef);
          border-radius: var(--radius-sm, 10px);
          color: var(--ink);
          display: flex;
          font-size: 0.875rem;
          font-weight: 600;
          gap: 10px;
          padding: 10px 14px;
          text-decoration: none;
          transition: border-color 0.15s;
        }

        .dash-quick-item:hover {
          border-color: var(--navy-950, #0c1f38);
        }

        .dash-quick-icon {
          font-size: 1rem;
        }

        /* ── Bottom banner ── */
        .dash-banner {
          align-items: center;
          background: linear-gradient(135deg, var(--navy-950, #0c1f38) 0%, #163d6e 100%);
          border-radius: var(--radius-lg, 16px);
          display: flex;
          gap: 16px;
          justify-content: space-between;
          padding: 20px 24px;
        }

        .dash-banner-content {
          align-items: center;
          display: flex;
          gap: 16px;
        }

        .dash-banner-icon {
          color: var(--gold-500);
          font-size: 1.5rem;
          font-weight: 900;
          margin: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 1060px) {
          .dash-layout {
            grid-template-columns: 1fr;
          }

          .dash-mentor-stats {
            grid-template-columns: repeat(3, 1fr);
          }

          .dash-identity-user {
            grid-template-columns: auto auto;
          }

          .dash-identity-aside {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 680px) {
          .dash-banner {
            flex-direction: column;
            align-items: flex-start;
          }

          .dash-mentor-stats {
            grid-template-columns: 1fr 1fr;
          }

          .dash-identity-user {
            grid-template-columns: auto 1fr;
          }

          .dash-identity-aside {
            display: none;
          }
        }
      `}</style>
    </AppShell>
  );
}

/* ── PathRow helper ── */
function PathRow({ path, meId }: { path: PathItem; meId?: string }) {
  const counterparty = path.mentor_id === meId ? path.mentee : path.mentor;
  const name = counterparty?.nickname || counterparty?.username || "Partner";

  const statusLabel: Record<string, string> = {
    open: "Aperto",
    pending: "In attesa",
    feedback_pending: "Feedback",
    completed: "Completato"
  };

  const statusClass = ["open", "pending", "feedback_pending", "completed"].includes(path.status)
    ? path.status
    : "open";

  return (
    <Link href={`/paths/${path.id}`} className="dash-path-row">
      <div style={{ minWidth: 0 }}>
        <p className="dash-path-name">{name}</p>
        <p className="dash-path-goal">{path.goal?.goal_tag || "Obiettivo"}</p>
      </div>
      <span className={`dash-path-status ${statusClass}`}>
        {statusLabel[path.status] || path.status}
      </span>
    </Link>
  );
}
