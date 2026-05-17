"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Award, Calendar, Globe, Shield, ThumbsUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { UserAvatar, LevelBadge, StarRating, MetricStat } from "@/components/Ui";
import { clientGet, clientPost } from "@/lib/api";
import type { PublicProfile, GoalsMe } from "@/lib/types";

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const searchParams = useSearchParams();
  const matchScore = searchParams.get("score");
  const matchReason = searchParams.get("reason");

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [activeGoal, setActiveGoal] = useState<{ id: string; goal_tag: string } | null>(null);

  useEffect(() => {
    Promise.allSettled([
      clientGet<PublicProfile>(`/profiles/${params.userId}`),
      clientGet<GoalsMe>("/goals/me"),
    ]).then(([profileResult, goalsResult]) => {
      if (profileResult.status === "fulfilled") setProfile(profileResult.value);
      else setError("Profilo non disponibile");

      if (goalsResult.status === "fulfilled") {
        const g = goalsResult.value;
        const goal = g?.active_goal || g?.current;
        if (goal) setActiveGoal({ id: goal.id, goal_tag: goal.goal_tag });
      }
      setLoading(false);
    });
  }, [params.userId]);

  async function sendMatchRequest() {
    if (!activeGoal) return;
    setRequestLoading(true);
    setRequestError(null);
    try {
      await clientPost("/matching/requests", {
        mentor_id: params.userId,
        goal_id: activeGoal.id,
      });
      setRequestSent(true);
    } catch (err: unknown) {
      setRequestError((err as Error).message || "Errore durante la richiesta");
    } finally {
      setRequestLoading(false);
    }
  }

  const displayName = profile?.nickname || "Socra user";
  const badges = profile?.public_badges || [];
  const metrics = profile?.aggregate_metrics || {};
  const positiveReviews = metrics.positive_feedback_pct as number | undefined;
  const completedPaths = profile?.completed_paths ?? 0;
  const hasMetrics = Object.keys(metrics).length > 0;

  return (
    <AppShell>
      <div className="profile-page">
        {/* Back link */}
        <Link href="/matching" className="profile-back">
          <ArrowLeft size={16} /> Torna alla lista dei mentor
        </Link>

        {loading ? (
          <div className="profile-skeleton">
            <div className="profile-skeleton-hero" />
            <div className="profile-skeleton-body" />
          </div>
        ) : error ? (
          <div className="card" style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>
            <p>{error}</p>
            <Link href="/matching" className="button secondary" style={{ marginTop: "16px" }}>
              Torna al matching
            </Link>
          </div>
        ) : profile ? (
          <>
            {/* Hero header */}
            <div className="profile-hero card">
              <div className="profile-hero-left">
                <UserAvatar name={displayName} size="xl" />
                <div className="profile-hero-info">
                  <h1 className="profile-name">{displayName}</h1>
                  <div className="profile-badges-row">
                    <LevelBadge level={profile.level} />
                    {profile.is_coach && (
                      <span className="profile-mentor-badge">Mentor affidabile</span>
                    )}
                  </div>
                  {completedPaths > 0 && (
                    <div className="profile-rating-row">
                      <StarRating value={Math.min(5, (completedPaths / 10) * 5)} />
                      <span className="profile-rating-label">
                        {completedPaths} percorsi completati
                      </span>
                    </div>
                  )}
                  <p className="profile-member-since">
                    <Calendar size={14} /> Membro della community Socra
                  </p>
                </div>
              </div>

              {/* Stats destra nell'hero */}
              <div className="profile-hero-stats">
                {positiveReviews !== undefined && (
                  <MetricStat
                    value={`${Math.round(positiveReviews)}%`}
                    label="Recensioni positive"
                  />
                )}
                <MetricStat value={completedPaths} label="Percorsi completati" />
                {badges.length > 0 && (
                  <MetricStat value={badges.length} label="Badge ottenuti" />
                )}
              </div>
            </div>

            {/* Body a due colonne */}
            <div className="profile-body">
              {/* Colonna sinistra */}
              <div className="profile-left">
                {/* Competenze */}
                <div className="card">
                  <p className="profile-section-label">Competenze principali</p>
                  <p className="profile-muted-text">
                    Le competenze specifiche vengono condivise durante il percorso.
                  </p>
                </div>

                {/* Perché è il tuo match */}
                {matchScore && (
                  <div className="card">
                    <p className="profile-section-label">Perché è il tuo match</p>
                    <div className="profile-match-score">
                      <span className="profile-match-pct">
                        {Math.round(Number(matchScore))}%
                      </span>
                      <span className="profile-muted-text">compatibilità</span>
                    </div>
                    {matchReason && (
                      <p className="profile-muted-text" style={{ marginTop: "8px", lineHeight: 1.5 }}>
                        {decodeURIComponent(matchReason)}
                      </p>
                    )}
                  </div>
                )}

                {/* Badge */}
                {badges.length > 0 && (
                  <div className="card">
                    <p className="profile-section-label">Badge ottenuti</p>
                    <div className="profile-badge-list">
                      {badges.map((badge) => (
                        <span key={badge} className="profile-badge-item">
                          <Award size={14} /> {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Metriche aggregate */}
                {hasMetrics && (
                  <div className="card">
                    <p className="profile-section-label">Performance</p>
                    <div className="profile-metrics-grid">
                      {Object.entries(metrics)
                        .slice(0, 6)
                        .map(([key, value]) => (
                          <div key={key} className="profile-metric-row">
                            <span>{key.replace(/_/g, " ")}</span>
                            <strong>{formatMetric(value)}</strong>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Colonna destra */}
              <div className="profile-right">
                {/* Card privacy */}
                <div className="card profile-privacy-card">
                  <div className="profile-privacy-inner">
                    <Shield
                      size={20}
                      style={{ color: "var(--mint-600)", flexShrink: 0, marginTop: "2px" }}
                    />
                    <div>
                      <p className="profile-card-title">Profilo verificato</p>
                      <p className="profile-muted-text">
                        I dati finanziari non sono mai visibili pubblicamente.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Lingue */}
                <div className="card">
                  <p className="profile-section-label">Lingue parlate</p>
                  <div className="profile-lang-row">
                    <Globe size={16} style={{ color: "var(--muted)" }} />
                    <span>Italiano</span>
                  </div>
                </div>

                {/* CTA richiesta */}
                <div className="card profile-request-card">
                  <p className="profile-card-title">Invitalo al percorso</p>
                  {!activeGoal ? (
                    <div>
                      <p className="profile-muted-text" style={{ marginBottom: "12px" }}>
                        Definisci prima il tuo obiettivo per inviare una richiesta.
                      </p>
                      <Link
                        href="/goal"
                        className="button"
                        style={{ width: "100%", justifyContent: "center" }}
                      >
                        Crea il tuo obiettivo
                      </Link>
                    </div>
                  ) : requestSent ? (
                    <div className="profile-request-sent">
                      <ThumbsUp
                        size={24}
                        style={{ color: "var(--mint-600)", marginBottom: "8px" }}
                      />
                      <p className="profile-card-title" style={{ margin: "0 0 4px" }}>
                        Richiesta inviata!
                      </p>
                      <p className="profile-muted-text">Attendi la risposta del mentor.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="profile-muted-text" style={{ marginBottom: "12px" }}>
                        Obiettivo:{" "}
                        <strong style={{ color: "var(--ink)" }}>{activeGoal.goal_tag}</strong>
                      </p>
                      {requestError && (
                        <p className="profile-request-error">{requestError}</p>
                      )}
                      <button
                        className="button"
                        style={{ width: "100%", justifyContent: "center" }}
                        onClick={sendMatchRequest}
                        disabled={requestLoading}
                      >
                        {requestLoading ? "Invio in corso..." : "Richiedi percorso →"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* CTA bottom */}
            <div className="profile-cta-bottom">
              <div>
                <p className="profile-cta-title">
                  Pensi che {displayName} sia il mentor giusto per te?
                </p>
                <p className="profile-cta-sub">
                  Richiedilo con una chiamata compatibile e inizia il tuo percorso.
                </p>
              </div>
              {!requestSent && activeGoal && (
                <button
                  className="button"
                  onClick={sendMatchRequest}
                  disabled={requestLoading || requestSent}
                >
                  {requestLoading ? "Invio..." : "Inizia il percorso →"}
                </button>
              )}
              {!activeGoal && (
                <Link href="/goal" className="button">
                  Crea il tuo obiettivo prima
                </Link>
              )}
            </div>
          </>
        ) : null}
      </div>

      <style jsx global>{`
        .profile-page {
          display: grid;
          gap: 20px;
          max-width: 1100px;
        }

        .profile-back {
          align-items: center;
          color: var(--muted);
          display: inline-flex;
          font-size: 0.875rem;
          font-weight: 600;
          gap: 6px;
          text-decoration: none;
          transition: color 0.15s;
          width: fit-content;
        }
        .profile-back:hover {
          color: var(--ink);
        }

        .profile-hero {
          align-items: flex-start;
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          justify-content: space-between;
        }

        .profile-hero-left {
          align-items: flex-start;
          display: flex;
          flex: 1;
          gap: 20px;
          min-width: 280px;
        }

        .profile-hero-info {
          display: grid;
          gap: 8px;
        }

        .profile-name {
          color: var(--ink);
          font-size: clamp(1.4rem, 3vw, 1.8rem);
          margin: 0;
        }

        .profile-badges-row {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .profile-mentor-badge {
          background: var(--mint-100, #d1fae5);
          border-radius: 6px;
          color: var(--mint-600);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 10px;
        }

        .profile-rating-row {
          align-items: center;
          display: flex;
          gap: 8px;
        }

        .profile-rating-label {
          color: var(--muted);
          font-size: 0.875rem;
        }

        .profile-member-since {
          align-items: center;
          color: var(--muted);
          display: flex;
          font-size: 0.82rem;
          gap: 6px;
          margin: 0;
        }

        .profile-hero-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 32px;
          padding: 0 8px;
        }

        .profile-body {
          display: grid;
          gap: 16px;
          grid-template-columns: 1fr 320px;
        }

        .profile-left,
        .profile-right {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .profile-section-label {
          color: var(--muted);
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          margin: 0 0 12px;
          text-transform: uppercase;
        }

        .profile-muted-text {
          color: var(--muted);
          font-size: 0.875rem;
          margin: 0;
        }

        .profile-match-score {
          align-items: baseline;
          display: flex;
          gap: 10px;
        }

        .profile-match-pct {
          color: var(--mint-600);
          font-size: 1.8rem;
          font-weight: 800;
        }

        .profile-badge-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .profile-badge-item {
          align-items: center;
          background: var(--mint-100, #d1fae5);
          border-radius: 999px;
          color: var(--mint-600);
          display: inline-flex;
          font-size: 0.8rem;
          font-weight: 700;
          gap: 6px;
          padding: 6px 12px;
        }

        .profile-metrics-grid {
          display: grid;
          gap: 8px;
        }

        .profile-metric-row {
          align-items: center;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 8px;
          display: flex;
          font-size: 0.875rem;
          justify-content: space-between;
          padding: 10px 12px;
        }

        .profile-metric-row span {
          color: var(--muted);
        }

        .profile-metric-row strong {
          color: var(--ink);
        }

        .profile-privacy-card {
          background: linear-gradient(135deg, #ecfdf5, white);
        }

        .profile-privacy-inner {
          align-items: flex-start;
          display: flex;
          gap: 10px;
        }

        .profile-card-title {
          font-weight: 700;
          margin: 0 0 6px;
        }

        .profile-lang-row {
          align-items: center;
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }

        .profile-request-card {
          background: linear-gradient(135deg, #fff7ed, white);
        }

        .profile-request-sent {
          text-align: center;
        }

        .profile-request-error {
          color: #dc2626;
          font-size: 0.875rem;
          margin: 0 0 8px;
        }

        .profile-cta-bottom {
          align-items: center;
          background: linear-gradient(135deg, var(--navy-950), #1e3a5f);
          border-radius: var(--radius-lg, 16px);
          color: white;
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          justify-content: space-between;
          padding: 24px;
        }

        .profile-cta-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 8px;
        }

        .profile-cta-sub {
          color: rgba(255, 255, 255, 0.7);
          font-size: 0.875rem;
          margin: 0;
        }

        .profile-skeleton {
          display: grid;
          gap: 16px;
        }

        .profile-skeleton-hero {
          animation: profilePulse 1.5s ease-in-out infinite;
          background: linear-gradient(90deg, var(--line), var(--paper), var(--line));
          border-radius: var(--radius-lg, 16px);
          height: 160px;
        }

        .profile-skeleton-body {
          animation: profilePulse 1.5s ease-in-out 0.2s infinite;
          background: linear-gradient(90deg, var(--line), var(--paper), var(--line));
          border-radius: var(--radius-lg, 16px);
          height: 300px;
        }

        @keyframes profilePulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @media (max-width: 900px) {
          .profile-body {
            grid-template-columns: 1fr;
          }
          .profile-hero {
            flex-direction: column;
          }
        }

        @media (max-width: 600px) {
          .profile-hero-left {
            flex-direction: column;
          }
          .profile-hero-stats {
            gap: 16px;
          }
        }
      `}</style>
    </AppShell>
  );
}

function formatMetric(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "number")
    return Number.isInteger(value) ? String(value) : `${value.toFixed(1)}%`;
  if (typeof value === "boolean") return value ? "Sì" : "No";
  return String(value);
}
