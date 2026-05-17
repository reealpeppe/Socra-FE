"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { UserAvatar, LevelBadge } from "@/components/Ui";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { GoalsMe, MatchCandidate, MatchRequestItem, UserMe } from "@/lib/types";

export default function MatchingPage() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [goals, setGoals] = useState<GoalsMe | null>(null);
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [requestedMentors, setRequestedMentors] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "top">("all");

  useEffect(() => {
    let active = true;

    // Fetch me + goals in parallelo
    Promise.allSettled([
      clientGet<UserMe>("/auth/me"),
      clientGet<GoalsMe>("/goals/me")
    ]).then(([meResult, goalsResult]) => {
      if (!active) return;

      let fetchedMe: UserMe | null = null;
      let fetchedGoals: GoalsMe | null = null;

      if (meResult.status === "fulfilled") {
        fetchedMe = meResult.value;
        setMe(fetchedMe);
      }

      if (goalsResult.status === "fulfilled") {
        fetchedGoals = goalsResult.value;
        setGoals(fetchedGoals);
      } else {
        setError(goalsResult.reason?.message || "Obiettivo non disponibile");
      }

      setLoading(false);

      // Se c'è un goal attivo, lancia il matching
      const activeGoal = fetchedGoals?.active_goal || fetchedGoals?.current;
      if (activeGoal?.id) {
        setLoadingCandidates(true);
        clientPost<MatchCandidate[]>("/matching/candidates", { goal_id: activeGoal.id })
          .then(items => {
            if (!active) return;
            setCandidates(Array.isArray(items) ? items : []);
          })
          .catch(err => {
            if (!active) return;
            setCandidates([]);
            setError(err?.message || "Matching non disponibile");
          })
          .finally(() => {
            if (active) setLoadingCandidates(false);
          });
      }
    });

    return () => { active = false; };
  }, []);

  const activeGoal = goals?.active_goal || goals?.current || null;

  const filteredCandidates = filter === "top"
    ? candidates.filter(c => c.match_score >= 70)
    : candidates;

  async function requestMentor(candidate: MatchCandidate) {
    if (!activeGoal?.id) return;
    setError(null);
    setMessage(null);
    try {
      await clientPost<MatchRequestItem>("/matching/requests", {
        mentor_id: candidate.mentor_id,
        goal_id: activeGoal.id
      });
      setRequestedMentors(prev => new Set(prev).add(candidate.mentor_id));
      setMessage(`Richiesta inviata a ${candidate.nickname || "mentor"}.`);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Richiesta non inviata");
    }
  }

  return (
    <AppShell>
      <div className="matching-page">

        {/* Header */}
        <div className="matching-header">
          <div>
            <h1>I mentor ideali per te</h1>
            <p>
              Sei al{" "}
              <LevelBadge level={me?.level || "L0"} />{" "}
              I mentor compatibili sono selezionati in linea con il tuo livello (max ±1 livello).
            </p>
          </div>
          <Link href="/come-funziona" className="button secondary">
            Scopri come funziona →
          </Link>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="matching-error" role="alert">{error}</div>
        )}
        {message && (
          <div className="matching-success" role="status">{message}</div>
        )}

        <div className="matching-layout">

          {/* ── Colonna principale ── */}
          <div className="matching-main">

            {/* Filtri */}
            <div className="matching-filters">
              <button
                className={`matching-filter-btn${filter === "all" ? " active" : ""}`}
                onClick={() => setFilter("all")}
                type="button"
              >
                Tutti ({candidates.length})
              </button>
              <button
                className={`matching-filter-btn${filter === "top" ? " active" : ""}`}
                onClick={() => setFilter("top")}
                type="button"
              >
                Alta compatibilità
              </button>
            </div>

            {/* Contenuto lista */}
            {loading ? (
              <div className="matching-skeleton">
                <div className="matching-skeleton-card" />
                <div className="matching-skeleton-card" />
                <div className="matching-skeleton-card" />
              </div>
            ) : !activeGoal ? (
              <div className="card matching-empty">
                <p style={{ fontWeight: 700, margin: "0 0 8px", color: "var(--ink)" }}>
                  Definisci prima il tuo obiettivo
                </p>
                <p style={{ color: "var(--muted)", margin: "0 0 16px", fontSize: "0.875rem" }}>
                  Il matching richiede un obiettivo attivo per trovare il mentor più adatto a te.
                </p>
                <Link href="/goal" className="button">Crea il tuo obiettivo</Link>
              </div>
            ) : loadingCandidates ? (
              <div className="matching-skeleton">
                <div className="matching-skeleton-card" />
                <div className="matching-skeleton-card" />
                <div className="matching-skeleton-card" />
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="card matching-empty">
                <p style={{ fontWeight: 700, margin: "0 0 8px", color: "var(--ink)" }}>
                  Nessun mentor disponibile
                </p>
                <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.875rem" }}>
                  Riprova più tardi o modifica il tuo obiettivo.
                </p>
              </div>
            ) : (
              <div className="matching-list">
                {filteredCandidates.map(c => (
                  <MentorCandidateCard
                    key={c.mentor_id}
                    candidate={c}
                    requested={requestedMentors.has(c.mentor_id)}
                    onRequest={() => requestMentor(c)}
                  />
                ))}
              </div>
            )}

            {/* Bottom empty-goal CTA */}
            {!activeGoal && !loading && (
              <div className="matching-bottom-cta">
                <p>Non hai ancora un goal?</p>
                <Link href="/goal" className="button secondary">Crea il tuo obiettivo</Link>
              </div>
            )}
          </div>

          {/* ── Sidebar destra ── */}
          <div className="matching-sidebar">
            <div className="card" style={{ marginBottom: "16px" }}>
              <p style={{ fontWeight: 700, margin: "0 0 10px", color: "var(--ink)" }}>
                Come funziona il matching
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 12px", lineHeight: 1.5 }}>
                I mentor vengono selezionati in base al tuo livello, ai tuoi obiettivi e alle competenze più rilevanti per il tuo percorso.
              </p>
              <Link href="/come-funziona" className="matching-sidebar-link">
                Scopri di più →
              </Link>
            </div>

            {activeGoal && (
              <div className="card">
                <p style={{ fontWeight: 700, margin: "0 0 10px", color: "var(--ink)" }}>
                  Il tuo obiettivo attivo
                </p>
                <p style={{ margin: "0 0 4px", fontWeight: 600, fontSize: "0.9rem", color: "var(--ink)" }}>
                  {activeGoal.goal_tag}
                </p>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 12px" }}>
                  {activeGoal.topic}
                </p>
                <Link href="/goal" className="matching-sidebar-link">
                  Modifica →
                </Link>
              </div>
            )}

            {!loading && !activeGoal && (
              <div className="card">
                <p style={{ fontWeight: 700, margin: "0 0 10px", color: "var(--ink)" }}>
                  Il tuo obiettivo
                </p>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", margin: "0 0 12px" }}>
                  Nessun obiettivo attivo. Definiscine uno per sbloccare il matching.
                </p>
                <Link href="/goal" className="button" style={{ width: "100%", justifyContent: "center", fontSize: "0.85rem" }}>
                  Crea obiettivo
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>

      <style jsx global>{`
        /* ── Matching page ── */
        .matching-page {
          display: grid;
          gap: 24px;
          max-width: 1200px;
        }

        .matching-header {
          align-items: flex-start;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: space-between;
        }

        .matching-header h1 {
          color: var(--ink);
          font-size: clamp(1.5rem, 3vw, 2rem);
          margin: 0 0 10px;
        }

        .matching-header p {
          align-items: center;
          color: var(--muted);
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 0;
        }

        .matching-error {
          background: #fee4e2;
          border: 1px solid #fda29b;
          border-radius: var(--radius-sm, 10px);
          color: #b42318;
          font-size: 0.875rem;
          padding: 12px 16px;
        }

        .matching-success {
          background: #dcfce7;
          border: 1px solid #86efac;
          border-radius: var(--radius-sm, 10px);
          color: #15803d;
          font-size: 0.875rem;
          padding: 12px 16px;
        }

        /* ── Layout ── */
        .matching-layout {
          display: grid;
          gap: 24px;
          grid-template-columns: 1fr 300px;
          align-items: start;
        }

        .matching-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* ── Filters ── */
        .matching-filters {
          display: flex;
          gap: 8px;
        }

        .matching-filter-btn {
          background: var(--card, white);
          border: 1.5px solid var(--line, #e4e8ef);
          border-radius: 999px;
          color: var(--muted);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 8px 18px;
          transition: all 0.15s;
        }

        .matching-filter-btn.active {
          background: var(--navy-950, #0c1f38);
          border-color: var(--navy-950, #0c1f38);
          color: white;
        }

        .matching-filter-btn:not(.active):hover {
          border-color: var(--ink);
          color: var(--ink);
        }

        /* ── Skeleton ── */
        .matching-skeleton {
          display: grid;
          gap: 12px;
        }

        .matching-skeleton-card {
          animation: matchSkeletonPulse 1.4s ease-in-out infinite;
          background: linear-gradient(90deg, #eef2f6, #f8fafc, #eef2f6);
          border-radius: var(--radius-lg, 16px);
          height: 120px;
        }

        .matching-skeleton-card:nth-child(2) { animation-delay: 0.15s; }
        .matching-skeleton-card:nth-child(3) { animation-delay: 0.3s; }

        @keyframes matchSkeletonPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        /* ── Empty state ── */
        .matching-empty {
          padding: 40px !important;
          text-align: center;
        }

        /* ── Mentor candidate list ── */
        .matching-list {
          display: grid;
          gap: 12px;
        }

        /* ── Mentor candidate card ── */
        .mentor-candidate-card {
          background: var(--card, white);
          border: 1px solid var(--line, #e4e8ef);
          border-radius: var(--radius-lg, 16px);
          box-shadow: 0 2px 8px rgba(12, 31, 56, 0.06);
          display: grid;
          gap: 16px;
          grid-template-columns: auto 1fr auto;
          padding: 20px;
          transition: box-shadow 0.2s, transform 0.15s;
        }

        .mentor-candidate-card:hover {
          box-shadow: 0 6px 20px rgba(12, 31, 56, 0.1);
          transform: translateY(-1px);
        }

        /* ── Card meta ── */
        .mcc-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 0;
        }

        .mcc-name {
          color: var(--ink);
          font-size: 1rem;
          font-weight: 700;
          margin: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .mcc-title-row {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .mcc-title {
          color: var(--muted);
          font-size: 0.82rem;
        }

        .mcc-competencies {
          align-items: center;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .mcc-competency-tag {
          background: #eef4ff;
          border-radius: 999px;
          color: #1d4ed8;
          font-size: 0.72rem;
          font-weight: 700;
          padding: 3px 10px;
        }

        .mcc-reason {
          color: var(--muted);
          font-size: 0.8rem;
          line-height: 1.45;
          margin-top: 6px;
          max-width: 600px;
        }

        /* ── Card actions ── */
        .mcc-actions {
          align-items: flex-end;
          display: flex;
          flex-direction: column;
          gap: 10px;
          justify-content: space-between;
        }

        .mcc-score-block {
          text-align: center;
        }

        .mcc-score-pct {
          color: var(--mint-600, #129b68);
          font-size: 1.2rem;
          font-weight: 800;
          line-height: 1;
        }

        .mcc-score-label {
          color: var(--muted);
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }

        .mcc-request-btn {
          background: var(--navy-950, #0c1f38);
          border: none;
          border-radius: 999px;
          color: white;
          cursor: pointer;
          font-size: 0.78rem;
          font-weight: 800;
          padding: 8px 14px;
          transition: opacity 0.15s;
          white-space: nowrap;
        }

        .mcc-request-btn:disabled {
          background: #dcfce7;
          color: #15803d;
          cursor: default;
        }

        .mcc-request-btn:not(:disabled):hover {
          opacity: 0.85;
        }

        .mcc-profile-link {
          align-items: center;
          color: var(--navy-950, #0c1f38);
          display: inline-flex;
          font-size: 0.8rem;
          font-weight: 700;
          gap: 4px;
          text-decoration: none;
          white-space: nowrap;
        }

        .mcc-profile-link:hover {
          text-decoration: underline;
        }

        /* ── Sidebar ── */
        .matching-sidebar-link {
          color: var(--navy-950, #0c1f38);
          font-size: 0.85rem;
          font-weight: 700;
          text-decoration: none;
        }

        .matching-sidebar-link:hover {
          text-decoration: underline;
        }

        /* ── Bottom CTA ── */
        .matching-bottom-cta {
          align-items: center;
          background: var(--paper, #f7f8fa);
          border: 1px solid var(--line, #e4e8ef);
          border-radius: var(--radius-lg, 16px);
          display: flex;
          gap: 16px;
          justify-content: space-between;
          padding: 16px 20px;
        }

        .matching-bottom-cta p {
          color: var(--muted);
          font-size: 0.875rem;
          margin: 0;
        }

        /* ── Responsive ── */
        @media (max-width: 960px) {
          .matching-layout {
            grid-template-columns: 1fr;
          }

          .matching-sidebar {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .mentor-candidate-card {
            grid-template-columns: auto 1fr;
            gap: 12px;
          }

          .mcc-actions {
            display: none;
          }

          .mcc-reason {
            display: none;
          }
        }
      `}</style>
    </AppShell>
  );
}

/* ── MentorCandidateCard helper ── */
function titleFromScore(score: number): string {
  if (score >= 90) return "Mentor eccellente";
  if (score >= 75) return "Mentor affidabile";
  if (score >= 60) return "Buona compatibilità";
  return "Mentor disponibile";
}

function MentorCandidateCard({
  candidate,
  requested,
  onRequest
}: {
  candidate: MatchCandidate;
  requested: boolean;
  onRequest: () => void;
}) {
  const displayName = candidate.nickname || "Socra Mentor";
  const score = Math.max(0, Math.min(100, Math.round(candidate.match_score)));

  return (
    <div className="mentor-candidate-card">
      <UserAvatar name={displayName} size="lg" />

      <div className="mcc-meta">
        <p className="mcc-name">{displayName}</p>
        <div className="mcc-title-row">
          <span className="mcc-title">{titleFromScore(candidate.match_score)}</span>
          <LevelBadge level={candidate.level} />
        </div>
        {candidate.reason && (
          <p className="mcc-reason">{candidate.reason}</p>
        )}
      </div>

      <div className="mcc-actions">
        <div className="mcc-score-block">
          <div className="mcc-score-pct">{score}%</div>
          <div className="mcc-score-label">compatibilità</div>
        </div>
        <button
          className="mcc-request-btn"
          type="button"
          disabled={requested}
          onClick={onRequest}
        >
          {requested ? "Richiesta inviata" : "Invia richiesta"}
        </button>
        <Link
          href={`/profiles/${candidate.mentor_id}?score=${score}&reason=${encodeURIComponent(candidate.reason || "")}`}
          className="mcc-profile-link"
        >
          Vedi profilo <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}
