"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { UserAvatar, LevelBadge } from "@/components/Ui";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { Goal, GoalsMe, MatchCandidate, MatchRequestItem, UserMe } from "@/lib/types";

export default function MatchingPage() {
  return (
    <AppShell>
      <OnboardingGate>
        <Suspense fallback={<div className="card"><p className="muted">Caricamento matching...</p></div>}>
          <MatchingContent />
        </Suspense>
      </OnboardingGate>
    </AppShell>
  );
}

function MatchingContent() {
  const searchParams = useSearchParams();
  const goalIdFromQuery = searchParams.get("goalId");
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

    async function load() {
      setLoading(true);
      setError(null);
      const [meResult, goalsResult] = await Promise.allSettled([
        clientGet<UserMe>("/auth/me"),
        clientGet<GoalsMe>("/goals/me")
      ]);

      if (!active) return;

      const fetchedMe = meResult.status === "fulfilled" ? meResult.value : null;
      const fetchedGoals = goalsResult.status === "fulfilled" ? goalsResult.value : null;
      setMe(fetchedMe);
      setGoals(fetchedGoals);
      setLoading(false);

      if (goalsResult.status === "rejected") {
        setError(goalsResult.reason?.message || "Obiettivo non disponibile");
        return;
      }

      const selectedGoal = pickGoal(fetchedGoals, goalIdFromQuery);
      if (!selectedGoal?.id) {
        setCandidates([]);
        return;
      }

      setLoadingCandidates(true);
      clientPost<MatchCandidate[]>("/matching/candidates", { goal_id: selectedGoal.id })
        .then((items) => {
          if (!active) return;
          const safeItems = Array.isArray(items)
            ? items.filter((item) => item.mentor_id !== fetchedMe?.id)
            : [];
          setCandidates(safeItems);
        })
        .catch((err) => {
          if (!active) return;
          setCandidates([]);
          setError(err?.message || "Matching non disponibile");
        })
        .finally(() => {
          if (active) setLoadingCandidates(false);
        });
    }

    load();
    return () => {
      active = false;
    };
  }, [goalIdFromQuery]);

  const activeGoal = useMemo(() => pickGoal(goals, goalIdFromQuery), [goals, goalIdFromQuery]);
  const filteredCandidates = filter === "top"
    ? candidates.filter((candidate) => candidate.match_score >= 70)
    : candidates;

  async function requestMentor(candidate: MatchCandidate) {
    if (!activeGoal?.id || candidate.mentor_id === me?.id) return;
    setError(null);
    setMessage(null);
    try {
      await clientPost<MatchRequestItem>("/matching/requests", {
        mentor_id: candidate.mentor_id,
        goal_id: activeGoal.id
      });
      setRequestedMentors((prev) => new Set(prev).add(candidate.mentor_id));
      setMessage("Richiesta inviata, attendi la risposta del mentor.");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Richiesta non inviata");
    }
  }

  return (
    <div className="matching-page">
      <div className="matching-header">
        <div>
          <p className="eyebrow">Matching mentor</p>
          <h1>I mentor piu adatti al tuo obiettivo</h1>
          <p>
            <span>Sei al</span>
            <LevelBadge level={me?.level || "L0"} />
            <span>Mostriamo solo compatibilita finale e motivazioni leggibili.</span>
          </p>
        </div>
        <Link href="/come-funziona" className="button secondary">
          Scopri come funziona
        </Link>
      </div>

      {error ? <div className="matching-error" role="alert">{error}</div> : null}
      {message ? <div className="matching-success" role="status">{message}</div> : null}

      <div className="matching-layout">
        <main className="matching-main">
          <div className="matching-filters" aria-label="Filtra mentor">
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
              Alta compatibilita
            </button>
          </div>

          {loading || loadingCandidates ? (
            <MatchingSkeleton />
          ) : !activeGoal ? (
            <EmptyGoal />
          ) : filteredCandidates.length === 0 ? (
            <div className="card matching-empty">
              <Sparkles size={30} aria-hidden />
              <strong>Nessun mentor disponibile ora</strong>
              <p className="muted">Riprova piu tardi o aggiorna il tuo obiettivo per ampliare le possibilita.</p>
              <Link href="/goal" className="button secondary">Modifica obiettivo</Link>
            </div>
          ) : (
            <div className="matching-list">
              {filteredCandidates.map((candidate) => (
                <MentorCandidateCard
                  key={candidate.mentor_id}
                  candidate={candidate}
                  requested={requestedMentors.has(candidate.mentor_id)}
                  onRequest={() => requestMentor(candidate)}
                />
              ))}
            </div>
          )}
        </main>

        <aside className="matching-sidebar">
          <div className="card stack">
            <p className="eyebrow">Criteri visibili</p>
            <h3>Come leggere il match</h3>
            <p className="muted">
              La percentuale sintetizza la compatibilita con obiettivo, livello e disponibilita del mentor. I dettagli interni restano privati.
            </p>
            <Link href="/come-funziona" className="matching-sidebar-link">
              Approfondisci <ArrowRight size={14} aria-hidden />
            </Link>
          </div>

          {activeGoal ? (
            <div className="card stack">
              <p className="eyebrow">Obiettivo attivo</p>
              <h3>{activeGoal.goal_tag}</h3>
              <p className="muted">{activeGoal.topic}</p>
              <Link href="/goal" className="matching-sidebar-link">
                Modifica <ArrowRight size={14} aria-hidden />
              </Link>
            </div>
          ) : null}
        </aside>
      </div>

      <MatchingStyles />
    </div>
  );
}

function pickGoal(goals: GoalsMe | null, requestedId: string | null): Goal | null {
  if (!goals) return null;
  if (requestedId) {
    const fromList = goals.goals.find((goal) => goal.id === requestedId);
    if (fromList) return fromList;
  }
  return goals.active_goal || goals.current || null;
}

function MatchingSkeleton() {
  return (
    <div className="matching-skeleton" aria-label="Caricamento mentor">
      <div className="matching-skeleton-card" />
      <div className="matching-skeleton-card" />
      <div className="matching-skeleton-card" />
    </div>
  );
}

function EmptyGoal() {
  return (
    <div className="card matching-empty">
      <Sparkles size={30} aria-hidden />
      <strong>Definisci prima il tuo obiettivo</strong>
      <p className="muted">Il matching parte da un obiettivo attivo: cosi possiamo proporti mentor davvero coerenti.</p>
      <Link href="/goal" className="button">Crea il tuo obiettivo</Link>
    </div>
  );
}

function titleFromScore(score: number): string {
  if (score >= 90) return "Match molto forte";
  if (score >= 75) return "Match consigliato";
  if (score >= 60) return "Buona compatibilita";
  return "Profilo da valutare";
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
  const displayName = candidate.nickname || "Mentor Socra";
  const score = Math.max(0, Math.min(100, Math.round(candidate.match_score)));
  const reason = candidate.reason_summary || "In linea con il tuo obiettivo e il tuo livello.";

  return (
    <article className="mentor-candidate-card">
      <UserAvatar name={displayName} size="lg" />

      <div className="mcc-meta">
        <div className="mcc-head">
          <div>
            <h2>{displayName}</h2>
            <div className="mcc-title-row">
              <span>{titleFromScore(candidate.match_score)}</span>
              <LevelBadge level={candidate.level} />
              {candidate.is_recommended ? <span className="pill green">Consigliato</span> : null}
            </div>
          </div>
          <div className="mcc-score-block">
            <strong>{score}%</strong>
            <span>compatibilita</span>
          </div>
        </div>

        <p className="mcc-reason">{reason}</p>

        {candidate.public_badges?.length ? (
          <div className="mcc-badge-row" aria-label="Badge mentor">
            {candidate.public_badges.slice(0, 3).map((badge) => (
              <span key={badge} className="mcc-quality-badge">{badge}</span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mcc-actions">
        <button className="mcc-request-btn" type="button" disabled={requested} onClick={onRequest}>
          {requested ? "Richiesta inviata" : "Invia richiesta al mentor"}
        </button>
        <Link
          href={`/profiles/${candidate.mentor_id}?score=${score}&reason=${encodeURIComponent(reason)}`}
          className="mcc-profile-link"
        >
          Vedi profilo <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
    </article>
  );
}

function MatchingStyles() {
  return (
    <style jsx global>{`
      .matching-page {
        display: grid;
        gap: 22px;
        max-width: 1180px;
      }

      .matching-header {
        align-items: flex-end;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: space-between;
      }

      .matching-header h1 {
        color: var(--navy-950, #07172d);
        font-size: clamp(1.8rem, 3.4vw, 3rem);
        margin: 0 0 10px;
      }

      .matching-header p:not(.eyebrow) {
        align-items: center;
        color: var(--muted);
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        max-width: 760px;
      }

      .matching-error,
      .matching-success {
        border-radius: var(--radius-sm, 10px);
        font-size: 0.875rem;
        font-weight: 750;
        padding: 12px 16px;
      }

      .matching-error {
        background: #fff1ee;
        border: 1px solid #ffc9c1;
        color: #b42318;
      }

      .matching-success {
        background: var(--mint-100, #dcfce7);
        border: 1px solid #b9ecd3;
        color: var(--mint-600, #15803d);
      }

      .matching-layout {
        align-items: start;
        display: grid;
        gap: 24px;
        grid-template-columns: minmax(0, 1fr) 310px;
      }

      .matching-main,
      .matching-list,
      .matching-sidebar,
      .matching-skeleton {
        display: grid;
        gap: 14px;
      }

      .matching-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .matching-filter-btn {
        background: var(--card, white);
        border: 1.5px solid var(--line, #e4e8ef);
        border-radius: 999px;
        color: var(--muted);
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: 750;
        padding: 8px 18px;
      }

      .matching-filter-btn.active {
        background: var(--navy-950, #07172d);
        border-color: var(--navy-950, #07172d);
        color: white;
      }

      .matching-skeleton-card {
        animation: matchSkeletonPulse 1.4s ease-in-out infinite;
        background: linear-gradient(90deg, #eef2f6, #f8fafc, #eef2f6);
        border-radius: var(--radius-lg, 16px);
        height: 142px;
      }

      .matching-skeleton-card:nth-child(2) { animation-delay: 0.15s; }
      .matching-skeleton-card:nth-child(3) { animation-delay: 0.3s; }

      @keyframes matchSkeletonPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }

      .matching-empty {
        align-items: center;
        display: grid;
        gap: 12px;
        justify-items: center;
        min-height: 240px;
        text-align: center;
      }

      .matching-empty svg {
        color: var(--gold-500, #f5b62f);
      }

      .matching-empty strong {
        color: var(--navy-950, #07172d);
        font-size: 1.1rem;
      }

      .mentor-candidate-card {
        align-items: start;
        background: var(--card, white);
        border: 1px solid var(--line, #e4e8ef);
        border-radius: var(--radius-lg, 16px);
        box-shadow: var(--shadow-tight, 0 10px 26px rgba(18, 35, 61, 0.06));
        display: grid;
        gap: 16px;
        grid-template-columns: auto minmax(0, 1fr) auto;
        padding: 20px;
      }

      .mcc-meta {
        display: grid;
        gap: 10px;
        min-width: 0;
      }

      .mcc-head {
        align-items: flex-start;
        display: flex;
        gap: 14px;
        justify-content: space-between;
      }

      .mcc-head h2 {
        color: var(--navy-950, #07172d);
        font-size: 1.1rem;
        margin: 0 0 6px;
      }

      .mcc-title-row,
      .mcc-badge-row {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .mcc-title-row > span:first-child {
        color: var(--muted);
        font-size: 0.84rem;
        font-weight: 750;
      }

      .mcc-score-block {
        display: grid;
        gap: 2px;
        justify-items: end;
        text-align: right;
      }

      .mcc-score-block strong {
        color: var(--mint-600, #129b68);
        font-size: 1.7rem;
        line-height: 1;
      }

      .mcc-score-block span {
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 800;
      }

      .mcc-reason {
        color: var(--muted);
        font-size: 0.9rem;
        line-height: 1.5;
      }

      .mcc-quality-badge {
        background: #fff8e8;
        border: 1px solid #ffe0a0;
        border-radius: 999px;
        color: var(--navy-950, #07172d);
        font-size: 0.74rem;
        font-weight: 850;
        padding: 5px 9px;
      }

      .mcc-actions {
        align-items: flex-end;
        display: grid;
        gap: 10px;
        justify-items: end;
      }

      .mcc-request-btn {
        background: var(--gold-500, #f5b62f);
        border: none;
        border-radius: 999px;
        color: var(--navy-950, #07172d);
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 900;
        min-height: 42px;
        padding: 9px 16px;
        white-space: nowrap;
      }

      .mcc-request-btn:disabled {
        background: var(--mint-100, #dcfce7);
        color: var(--mint-600, #15803d);
        cursor: default;
      }

      .mcc-profile-link,
      .matching-sidebar-link {
        align-items: center;
        color: var(--navy-950, #07172d);
        display: inline-flex;
        font-size: 0.84rem;
        font-weight: 800;
        gap: 4px;
        text-decoration: none;
      }

      .mcc-profile-link:hover,
      .matching-sidebar-link:hover {
        text-decoration: underline;
      }

      @media (max-width: 960px) {
        .matching-layout {
          grid-template-columns: 1fr;
        }

        .matching-sidebar {
          display: none;
        }
      }

      @media (max-width: 680px) {
        .mentor-candidate-card {
          grid-template-columns: auto minmax(0, 1fr);
        }

        .mcc-actions {
          grid-column: 1 / -1;
          justify-items: stretch;
          width: 100%;
        }

        .mcc-profile-link {
          justify-content: center;
        }

        .mcc-head {
          display: grid;
        }

        .mcc-score-block {
          justify-items: start;
          text-align: left;
        }
      }
    `}</style>
  );
}
