"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Award, CheckCircle2, Shield, ThumbsUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { UserAvatar, LevelBadge, MetricStat } from "@/components/Ui";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { GoalsMe, MatchCandidate, MatchRequestItem, PublicProfile, UserMe } from "@/lib/types";

export default function ProfilePage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="profile-page"><ProfileSkeleton /><ProfileStyles /></div>}>
        <ProfileContent />
      </Suspense>
    </AppShell>
  );
}

function ProfileContent() {
  const { userId } = useParams<{ userId: string }>();
  const [me, setMe] = useState<UserMe | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [activeGoal, setActiveGoal] = useState<{ id: string; goal_tag: string } | null>(null);
  const [candidate, setCandidate] = useState<MatchCandidate | null>(null);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [candidateRetryVersion, setCandidateRetryVersion] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      clientGet<UserMe>("/auth/me"),
      clientGet<PublicProfile>(`/profiles/${userId}`),
      clientGet<GoalsMe>("/goals/me"),
      clientGet<MatchRequestItem[]>("/matching/requests/me?role=mentee")
    ]).then(([meResult, profileResult, goalsResult, requestsResult]) => {
      if (!active) return;

      if (meResult.status === "fulfilled") setMe(meResult.value);
      else setAuthError(true);
      if (profileResult.status === "fulfilled") setProfile(profileResult.value);
      else setError("Profilo non disponibile");

      if (goalsResult.status === "fulfilled") {
        const goal = goalsResult.value?.active_goal || goalsResult.value?.current;
        if (goal && goal.is_active !== false) {
          setActiveGoal({ id: goal.id, goal_tag: goal.goal_tag });
          if (requestsResult.status === "fulfilled") {
            const sent = (Array.isArray(requestsResult.value) ? requestsResult.value : []).some(
              (request) => request.status === "pending"
                && request.goal_id === goal.id
                && request.mentor_id === userId
            );
            setRequestSent(sent);
          }
        }
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [userId]);

  const isOwnProfile = me?.id === userId;
  const displayName = profile?.nickname || (isOwnProfile ? me?.nickname || me?.username : null) || "Utente Socra";
  const badges = profile?.public_badges || [];
  const topTopics = profile?.top_topics || [];
  const competences = profile?.competences || [];
  const completedPaths = profile?.completed_paths ?? 0;
  const goalsReached = percentMetric(profile?.aggregate_metrics?.goals_reached_pct);
  const wouldRepeat = percentMetric(profile?.aggregate_metrics?.would_repeat_pct);
  const publicMetricsReady = goalsReached !== null && wouldRepeat !== null;

  useEffect(() => {
    let active = true;
    if (!activeGoal?.id || !me || isOwnProfile || !profile?.is_coach) {
      setCandidate(null);
      setCandidateError(null);
      setCandidateLoading(false);
      return;
    }
    setCandidateError(null);
    setCandidateLoading(true);
    clientPost<MatchCandidate[]>("/matching/candidates", { goal_id: activeGoal.id })
      .then((items) => {
        if (active) setCandidate(items.find((item) => item.mentor_id === userId) || null);
      })
      .catch((err) => {
        if (!active) return;
        setCandidate(null);
        setCandidateError(err instanceof ClientApiError ? err.message : "Verifica compatibilità non disponibile");
      })
      .finally(() => {
        if (active) setCandidateLoading(false);
      });
    return () => {
      active = false;
    };
  }, [activeGoal?.id, candidateRetryVersion, isOwnProfile, me, profile?.is_coach, userId]);

  async function sendMatchRequest() {
    if (!activeGoal || isOwnProfile || !me || !profile?.is_coach || !candidate) return;
    setRequestLoading(true);
    setRequestError(null);
    try {
      await clientPost("/matching/requests", {
        mentor_id: userId,
        goal_id: activeGoal.id
      });
      setRequestSent(true);
    } catch (err) {
      setRequestError(err instanceof ClientApiError ? err.message : "Richiesta non inviata");
    } finally {
      setRequestLoading(false);
    }
  }

	  return (
	    <>
	      <div className="profile-page">
        <Link href={isOwnProfile ? "/dashboard" : "/matching"} className="profile-back">
          <ArrowLeft size={16} aria-hidden />
          {isOwnProfile ? "Torna alla dashboard" : "Torna alla lista dei mentor"}
        </Link>

        {loading ? (
          <ProfileSkeleton />
        ) : error ? (
          <div className="card profile-empty">
            <p>{error}</p>
            <Link href="/matching" className="button secondary">Torna al matching</Link>
          </div>
        ) : profile ? (
          <>
            <section className="profile-hero card">
              <div className="profile-hero-left">
                <UserAvatar name={displayName} size="xl" />
                <div className="profile-hero-info">
                  <h1 className="profile-name">{displayName}</h1>
                  <div className="profile-badges-row">
                    <LevelBadge level={profile.level} />
                    {profile.is_coach ? <span className="profile-mentor-badge">Mentor attivo</span> : null}
                    {isOwnProfile ? <span className="profile-own-badge">Profilo personale</span> : null}
                  </div>
                  {badges.length ? (
                    <div className="profile-top-badges" aria-label="Badge qualitativi">
                      {badges.map((badge) => <span key={badge}>{badge}</span>)}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="profile-hero-stats">
                <MetricStat value={completedPaths} label="Percorsi completati" />
                <MetricStat value={badges.length} label="Badge pubblici" />
              </div>
            </section>

            <div className="profile-body">
              <div className="profile-left">
                <section className="card">
                  <p className="profile-section-label">Competenze principali</p>
                  {competences.length ? (
                    <div className="profile-topic-list">
                      {competences.map((competence) => (
                        <span key={`${competence.topic}-${competence.depth}`}>{competence.topic} · {competence.depth}</span>
                      ))}
                    </div>
                  ) : topTopics.length ? (
                    <div className="profile-topic-list">
                      {topTopics.map((topic) => <span key={topic}>{topic}</span>)}
                    </div>
                  ) : (
                    <p className="profile-muted-text">
                      Le competenze verranno mostrate quando saranno supportate da percorsi e feedback.
                    </p>
                  )}
                </section>

                {badges.length ? (
                  <section className="card">
                    <p className="profile-section-label">Badge ottenuti</p>
                    <div className="profile-badge-list">
                      {badges.map((badge) => (
                        <span key={badge} className="profile-badge-item">
                          <Award size={14} aria-hidden /> {badge}
                        </span>
                      ))}
                    </div>
                  </section>
                ) : null}

                {!isOwnProfile && candidate ? (
                  <section className="card profile-match-card">
                    <p className="profile-section-label">Compatibilità con il tuo obiettivo</p>
                    <div className="profile-match-score">
                      <span className="profile-match-pct">{Math.round(candidate.match_score)}%</span>
                      <span className="profile-muted-text">{candidate.is_recommended ? "match consigliato" : "profilo da valutare"}</span>
                    </div>
                    <p className="profile-muted-text">{candidate.reason_summary}</p>
                  </section>
                ) : null}

                <section className="card">
                  <p className="profile-section-label">Performance pubblica</p>
                  <div className="profile-metrics-grid">
                    <div className="profile-metric-row">
                      <span>Percorsi completati</span>
                      <strong>{completedPaths}</strong>
                    </div>
                    {publicMetricsReady ? (
                      <>
                    <div className="profile-metric-row">
                      <span>Obiettivi raggiunti o forte miglioramento</span>
                      <strong>{goalsReached}</strong>
                    </div>
                    <div className="profile-metric-row">
                      <span>Disponibili a ripetere il percorso</span>
                      <strong>{wouldRepeat}</strong>
                    </div>
                      </>
                    ) : (
                      <div className="profile-metric-row">
                        <span>Reputazione</span>
                        <strong>Nuovo utente</strong>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <aside className="profile-right">
                <section className="card profile-privacy-card">
                  <div className="profile-privacy-inner">
                    <Shield size={20} aria-hidden />
                    <div>
                      <p className="profile-card-title">Privacy protetta</p>
                      <p className="profile-muted-text">
                        Dati finanziari, capitale e componenti del matching non sono pubblici.
                      </p>
                    </div>
                  </div>
                </section>

                {isOwnProfile ? (
                  <OwnProfileCard isCoach={profile.is_coach} level={profile.level} />
                ) : !profile.is_coach ? (
                  <section className="card profile-request-card">
                    <p className="profile-card-title">Profilo non disponibile come mentor</p>
                    <p className="profile-muted-text">Questa persona non riceve richieste di percorso in questo momento.</p>
                    <Link href="/matching" className="button secondary">Torna ai mentor</Link>
                  </section>
                ) : authError || !me ? (
                  <section className="card profile-request-card">
                    <p className="profile-card-title">Accedi per inviare una richiesta</p>
                    <p className="profile-muted-text">La sessione non è disponibile.</p>
                    <Link href="/login" className="button">Vai all&apos;accesso</Link>
                  </section>
                ) : requestSent ? (
                  <RequestCard
                    activeGoal={activeGoal}
                    pathCost={profile.path_cost}
                    requestSent
                    requestLoading={false}
                    requestError={null}
                    onRequest={sendMatchRequest}
                  />
                ) : candidateLoading ? (
                  <section className="card profile-request-card" role="status">
                    <p className="profile-card-title">Verifica compatibilità…</p>
                  </section>
                ) : candidateError ? (
                  <section className="card profile-request-card" role="alert">
                    <p className="profile-card-title">Verifica compatibilità non disponibile</p>
                    <p className="profile-muted-text">{candidateError}</p>
                    <button className="button secondary" type="button" onClick={() => setCandidateRetryVersion((value) => value + 1)}>
                      Riprova
                    </button>
                  </section>
                ) : activeGoal && !candidate ? (
                  <section className="card profile-request-card">
                    <p className="profile-card-title">Non disponibile per questo obiettivo</p>
                    <p className="profile-muted-text">Il profilo non rientra nelle proposte valide per livello e obiettivo attivi.</p>
                    <Link href={`/matching?goalId=${activeGoal.id}`} className="button secondary">Vedi mentor compatibili</Link>
                  </section>
                ) : (
                  <RequestCard
                    activeGoal={activeGoal}
                    pathCost={profile.path_cost}
                    requestSent={requestSent}
                    requestLoading={requestLoading}
                    requestError={requestError}
                    onRequest={sendMatchRequest}
                  />
                )}
              </aside>
            </div>
          </>
        ) : null}
      </div>

	      <ProfileStyles />
	    </>
	  );
}

function RequestCard({
  activeGoal,
  pathCost,
  requestSent,
  requestLoading,
  requestError,
  onRequest
}: {
  activeGoal: { id: string; goal_tag: string } | null;
  pathCost: number;
  requestSent: boolean;
  requestLoading: boolean;
  requestError: string | null;
  onRequest: () => void;
}) {
  if (!activeGoal) {
    return (
      <section className="card profile-request-card">
        <p className="profile-card-title">Invia richiesta al mentor</p>
        <p className="profile-muted-text">Definisci prima il tuo obiettivo per inviare una richiesta coerente.</p>
        <Link href="/goal" className="button">Crea il tuo obiettivo</Link>
      </section>
    );
  }

  if (requestSent) {
    return (
      <section className="card profile-request-card profile-request-sent">
        <ThumbsUp size={24} aria-hidden />
        <p className="profile-card-title">Richiesta inviata</p>
        <p className="profile-muted-text">Attendi la risposta del mentor.</p>
      </section>
    );
  }

  return (
    <section className="card profile-request-card">
      <p className="profile-card-title">Invia richiesta al mentor</p>
      <p className="profile-muted-text">
        Obiettivo: <strong>{activeGoal.goal_tag}</strong>
      </p>
      <p className="profile-muted-text">
        Costo se accetta: {pathCost} {pathCost === 1 ? "credito" : "crediti"}.
      </p>
      {requestError ? <p className="profile-request-error">{requestError}</p> : null}
      <button className="button" type="button" onClick={onRequest} disabled={requestLoading}>
        {requestLoading ? "Invio in corso…" : "Invia richiesta al mentor"}
      </button>
    </section>
  );
}

function OwnProfileCard({ isCoach, level }: { isCoach: boolean; level: string }) {
  const isEligibleForMentor = level !== "L0";
  return (
    <section className="card profile-own-card">
      <div className="profile-privacy-inner">
        <CheckCircle2 size={20} aria-hidden />
        <div>
          <p className="profile-card-title">Questo è il tuo profilo</p>
          <p className="profile-muted-text">
            {isCoach
              ? "Il tuo profilo mentor è attivo: puoi monitorare richieste e percorsi."
              : isEligibleForMentor
                ? "Hai disattivato la disponibilità come mentor. Puoi riattivarla dalle impostazioni."
                : "Il livello L0 non abilita ancora il ruolo mentor. Continua il percorso per sviluppare le competenze necessarie."}
          </p>
        </div>
      </div>
      <div className="profile-own-actions">
        {isCoach ? <Link href="/settings" className="button secondary">Impostazioni</Link> : null}
        <Link href={isCoach ? "/paths?tab=mentor" : isEligibleForMentor ? "/settings" : "/livelli"} className="button">
          {isCoach ? "Percorsi mentor" : isEligibleForMentor ? "Gestisci ruolo mentor" : "Come crescere di livello"}
        </Link>
      </div>
    </section>
  );
}

function ProfileSkeleton() {
  return (
    <div className="profile-skeleton">
      <div className="profile-skeleton-hero" />
      <div className="profile-skeleton-body" />
    </div>
  );
}

function percentMetric(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value) ? `${value}%` : null;
}

function ProfileStyles() {
  return (
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
        font-weight: 700;
        gap: 6px;
        text-decoration: none;
        width: fit-content;
      }

      .profile-back:hover {
        color: var(--ink);
      }

      .profile-empty {
        display: grid;
        gap: 16px;
        justify-items: center;
        padding: 40px;
        text-align: center;
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
        color: var(--navy-950, #07172d);
        font-size: clamp(1.5rem, 3vw, 2.2rem);
        margin: 0;
      }

      .profile-badges-row,
      .profile-top-badges,
      .profile-badge-list,
      .profile-topic-list {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .profile-mentor-badge,
      .profile-own-badge,
      .profile-top-badges span,
      .profile-topic-list span,
      .profile-badge-item {
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 850;
        padding: 6px 10px;
      }

      .profile-mentor-badge {
        background: var(--mint-100, #d1fae5);
        color: var(--mint-600, #129b68);
      }

      .profile-own-badge,
      .profile-top-badges span {
        background: #fff8e8;
        border: 1px solid #ffe0a0;
        color: var(--navy-950, #07172d);
      }

      .profile-topic-list span {
        background: #eef4ff;
        border: 1px solid #cfdbff;
        color: #1d4ed8;
      }

      .profile-member-since {
        align-items: center;
        color: var(--muted);
        display: flex;
        font-size: 0.86rem;
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
        grid-template-columns: minmax(0, 1fr) 320px;
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
        font-size: 0.9rem;
        margin: 0;
      }

      .profile-match-card {
        background: linear-gradient(145deg, #fff8e8, #ffffff);
      }

      .profile-match-score {
        align-items: baseline;
        display: flex;
        gap: 10px;
        margin-bottom: 8px;
      }

      .profile-match-pct {
        color: var(--mint-600, #129b68);
        font-size: 2rem;
        font-weight: 950;
      }

      .profile-badge-item {
        align-items: center;
        background: var(--mint-100, #d1fae5);
        color: var(--mint-600, #129b68);
        display: inline-flex;
        gap: 6px;
      }

      .profile-metrics-grid {
        display: grid;
        gap: 8px;
      }

      .profile-metric-row {
        align-items: center;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm, 10px);
        display: flex;
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
        background: linear-gradient(145deg, #ecfdf5, #ffffff);
      }

      .profile-request-card,
      .profile-own-card {
        background: linear-gradient(145deg, #fff8e8, #ffffff);
        display: grid;
        gap: 14px;
      }

      .profile-privacy-inner {
        align-items: flex-start;
        display: flex;
        gap: 10px;
      }

      .profile-privacy-inner svg {
        color: var(--mint-600, #129b68);
        flex-shrink: 0;
        margin-top: 2px;
      }

      .profile-card-title {
        color: var(--navy-950, #07172d);
        font-weight: 850;
        margin: 0 0 6px;
      }

      .profile-request-card strong {
        color: var(--ink);
      }

      .profile-request-sent {
        justify-items: center;
        text-align: center;
      }

      .profile-request-error {
        color: #dc2626;
        font-size: 0.875rem;
        margin: 0;
      }

      .profile-own-actions {
        display: grid;
        gap: 10px;
      }

      .profile-skeleton {
        display: grid;
        gap: 16px;
      }

      .profile-skeleton-hero,
      .profile-skeleton-body {
        animation: profilePulse 1.5s ease-in-out infinite;
        background: linear-gradient(90deg, var(--line), var(--paper), var(--line));
        border-radius: var(--radius-lg, 16px);
      }

      .profile-skeleton-hero {
        height: 160px;
      }

      .profile-skeleton-body {
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
  );
}
