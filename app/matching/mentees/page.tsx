"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, Target, UsersRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { LevelBadge, UserAvatar } from "@/components/Ui";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { MatchRequestItem, MenteeCandidate, PathItem, UserMe } from "@/lib/types";

export default function MenteeMatchingPage() {
  return (
    <AppShell>
      <OnboardingGate>
        <MenteeMatchingContent />
      </OnboardingGate>
    </AppShell>
  );
}

function MenteeMatchingContent() {
  const [me, setMe] = useState<UserMe | null>(null);
  const [candidates, setCandidates] = useState<MenteeCandidate[]>([]);
  const [requests, setRequests] = useState<MatchRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState<Set<string>>(new Set());
  const [retryVersion, setRetryVersion] = useState(0);
  const [requestsReady, setRequestsReady] = useState(false);
  const [activeMentorPaths, setActiveMentorPaths] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      setRequestsReady(false);
      try {
        const user = await clientGet<UserMe>("/auth/me");
        if (!active) return;
        setMe(user);
        if (!user.is_coach) {
          setCandidates([]);
          setRequests([]);
          return;
        }
        const [candidateResult, requestResult, pathsResult] = await Promise.allSettled([
          clientGet<MenteeCandidate[]>("/matching/mentee-candidates"),
          clientGet<MatchRequestItem[]>("/matching/requests/me?role=mentor"),
          clientGet<PathItem[]>("/paths/me")
        ]);
        if (!active) return;
        setCandidates(candidateResult.status === "fulfilled" && Array.isArray(candidateResult.value) ? candidateResult.value : []);
        setRequests(requestResult.status === "fulfilled" && Array.isArray(requestResult.value) ? requestResult.value : []);
        setRequestsReady(requestResult.status === "fulfilled");
        setActiveMentorPaths(
          pathsResult.status === "fulfilled" && Array.isArray(pathsResult.value)
            ? pathsResult.value.filter((path) => path.mentor_id === user.id && path.status !== "completed").length
            : null
        );
        if (candidateResult.status === "rejected") {
          setError("Non riusciamo ad aggiornare i mentee compatibili. Riprova.");
        } else if (requestResult.status === "rejected" || pathsResult.status === "rejected") {
          setError("Alcuni dati operativi non sono disponibili. Riprova prima di inviare una proposta.");
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof ClientApiError ? err.message : "Ricerca mentee non disponibile");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [retryVersion]);

  const proposedGoalIds = useMemo(
    () => new Set(
      requests
        .filter((request) => request.initiator_role === "mentor" && request.status === "pending")
        .map((request) => request.goal_id)
    ),
    [requests]
  );

  async function propose(candidate: MenteeCandidate) {
    if (!requestsReady || activeMentorPaths === null || activeMentorPaths >= 3 || sending.has(candidate.goal_id) || proposedGoalIds.has(candidate.goal_id)) return;
    setError(null);
    setMessage(null);
    setSending((current) => new Set(current).add(candidate.goal_id));
    try {
      const request = await clientPost<MatchRequestItem>("/matching/proposals", {
        mentee_id: candidate.mentee_id,
        goal_id: candidate.goal_id
      });
      setRequests((current) => [request, ...current]);
      setMessage(`Proposta inviata a ${candidate.nickname || "questo utente"}. Avrà 48 ore per rispondere.`);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Proposta non inviata");
    } finally {
      setSending((current) => {
        const next = new Set(current);
        next.delete(candidate.goal_id);
        return next;
      });
    }
  }

  return (
    <div className="mentee-search-page">
      <Link href="/matching" className="mentee-search-back">
        <ArrowLeft size={16} aria-hidden /> Torna alla ricerca mentor
      </Link>

      <header className="mentee-search-hero">
        <div>
          <p className="eyebrow">Modalità mentor</p>
          <h1>Trova un obiettivo<br />a cui dare slancio.</h1>
          <p className="mentee-search-intro">
            Scopri persone che stanno cercando un confronto sul tuo ambito. Vedi
            soltanto il loro obiettivo generalizzato; saranno loro a scegliere se
            aprire il percorso.
          </p>
        </div>
        <div className="mentee-search-capacity">
          <UsersRound size={22} aria-hidden />
          <span>La tua disponibilità</span>
          <strong>{activeMentorPaths === null ? "Capacità in verifica" : `${activeMentorPaths} di 3 percorsi attivi`}</strong>
          <small>Il costo è addebitato al mentee solo quando accetta.</small>
        </div>
      </header>

      {error ? (
        <div className="matching-error" role="alert">
          <span>{error}</span>
          <button className="button secondary" type="button" onClick={() => setRetryVersion((value) => value + 1)}>Riprova</button>
        </div>
      ) : null}
      {message ? <div className="matching-success" role="status">{message}</div> : null}

      {loading ? (
        <div className="mentee-search-grid" role="status" aria-label="Caricamento mentee">
          <div className="mentee-search-skeleton" />
          <div className="mentee-search-skeleton" />
          <div className="mentee-search-skeleton" />
        </div>
      ) : !me?.is_coach ? (
        <section className="card mentee-search-empty">
          <Target size={30} aria-hidden />
          <h2>Attiva prima la disponibilità mentor</h2>
          <p>La ricerca dei mentee è riservata ai profili che possono ricevere e svolgere mentorship.</p>
          <Link href="/settings" className="button">Gestisci disponibilità</Link>
        </section>
      ) : error && candidates.length === 0 ? null : candidates.length === 0 ? (
        <section className="card mentee-search-empty">
          <Target size={30} aria-hidden />
          <h2>Nessun obiettivo disponibile ora</h2>
          <p>Non ci sono mentee pronti per un nuovo percorso compatibile con il tuo profilo e la tua capacità.</p>
          <button className="button secondary" type="button" onClick={() => setRetryVersion((value) => value + 1)}>
            Aggiorna la ricerca
          </button>
        </section>
      ) : (
        <div className="mentee-search-grid">
          {candidates.map((candidate) => {
            const proposed = proposedGoalIds.has(candidate.goal_id);
            const pending = sending.has(candidate.goal_id);
            const displayName = candidate.nickname || "Utente Socra";
            return (
              <article className="mentee-goal-card" key={`${candidate.mentee_id}-${candidate.goal_id}`}>
                <div className="mentee-goal-topline">
                  <div className="mentee-goal-person">
                    <UserAvatar name={displayName} size="md" />
                    <div>
                      <h2>{displayName}</h2>
                      <LevelBadge level={candidate.level} />
                    </div>
                  </div>
                  <div className="mentee-goal-score">
                    <strong>{Math.round(candidate.match_score)}%</strong>
                    <span>compatibilità</span>
                  </div>
                </div>

                <div className="mentee-goal-focus">
                  <span>Obiettivo</span>
                  <h3>{candidate.goal_tag}</h3>
                  <p>{candidate.goal_topic}</p>
                </div>

                <p className="mentee-goal-reason">{candidate.reason_summary || "Obiettivo coerente con le competenze che puoi condividere."}</p>

                <div className="mentee-goal-tags">
                  {candidate.availability_fallback ? (
                    <span className="pill amber">Disponibilità limitata</span>
                  ) : null}
                  {candidate.is_recommended ? <span className="pill green">Buona affinità</span> : null}
                </div>

                <button
                  className={`mentee-proposal-button ${proposed ? "sent" : pending ? "pending" : !requestsReady || activeMentorPaths === null || activeMentorPaths >= 3 ? "unavailable" : ""}`.trim()}
                  type="button"
                  disabled={proposed || pending || !requestsReady || activeMentorPaths === null || activeMentorPaths >= 3}
                  onClick={() => propose(candidate)}
                >
                  <Send size={16} aria-hidden />
                  {proposed
                    ? "Proposta inviata"
                    : pending
                      ? "Invio in corso…"
                      : activeMentorPaths !== null && activeMentorPaths >= 3
                        ? "Capacità mentor raggiunta"
                        : !requestsReady || activeMentorPaths === null
                          ? "Verifica operativa non disponibile"
                          : "Proponi un percorso"}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <style jsx global>{`
      .mentee-search-page {
        display: grid;
        gap: 24px;
        margin: 0 auto;
        max-width: 1160px;
        width: 100%;
      }

      .mentee-search-page .matching-error,
      .mentee-search-page .matching-success {
        align-items: center;
        border-radius: var(--radius-sm, 10px);
        display: flex;
        flex-wrap: wrap;
        font-size: 0.875rem;
        font-weight: 750;
        gap: 12px;
        justify-content: space-between;
        padding: 12px 16px;
      }

      .mentee-search-page .matching-error {
        background: #fff1ee;
        border: 1px solid #ffc9c1;
        color: #b42318;
      }

      .mentee-search-page .matching-success {
        background: var(--mint-100, #dcfce7);
        border: 1px solid #b9ecd3;
        color: var(--mint-600, #15803d);
      }

        .mentee-search-back {
          align-items: center;
          color: var(--navy-950, #07172d);
          display: inline-flex;
          font-size: 0.84rem;
          font-weight: 850;
          gap: 6px;
          justify-self: start;
          text-decoration: none;
        }

        .mentee-search-hero {
          align-items: end;
          background:
            radial-gradient(circle at 90% 10%, rgba(245, 182, 47, 0.2), transparent 34%),
            linear-gradient(135deg, #07172d 0%, #102b4d 68%, #174061 100%);
          border-radius: 24px;
          color: white;
          display: grid;
          gap: 32px;
          grid-template-columns: minmax(0, 1fr) minmax(220px, 310px);
          overflow: hidden;
          padding: clamp(28px, 5vw, 52px);
          position: relative;
        }

        .mentee-search-hero .eyebrow {
          color: #f5c45a;
        }

        .mentee-search-hero h1 {
          font-size: clamp(2.15rem, 5vw, 4.5rem);
          letter-spacing: -0.055em;
          line-height: 0.96;
          margin: 0 0 18px;
          max-width: 760px;
        }

        .mentee-search-intro {
          color: rgba(255, 255, 255, 0.74);
          line-height: 1.65;
          margin: 0;
          max-width: 660px;
        }

        .mentee-search-capacity {
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 18px;
          display: grid;
          gap: 6px;
          padding: 20px;
        }

        .mentee-search-capacity svg {
          color: #f5c45a;
          margin-bottom: 6px;
        }

        .mentee-search-capacity span,
        .mentee-search-capacity small {
          color: rgba(255, 255, 255, 0.66);
        }

        .mentee-search-capacity strong {
          font-size: 1.05rem;
        }

        .mentee-search-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .mentee-goal-card {
          background: var(--card, #fff);
          border: 1px solid var(--line, #e4e8ef);
          border-radius: 20px;
          box-shadow: var(--shadow-tight, 0 10px 26px rgba(18, 35, 61, 0.06));
          display: grid;
          gap: 16px;
          padding: 22px;
        }

        .mentee-goal-topline,
        .mentee-goal-person,
        .mentee-goal-tags {
          align-items: center;
          display: flex;
        }

        .mentee-goal-topline {
          gap: 16px;
          justify-content: space-between;
        }

        .mentee-goal-person {
          gap: 12px;
          min-width: 0;
        }

        .mentee-goal-person h2 {
          color: var(--navy-950, #07172d);
          font-size: 1rem;
          margin: 0 0 5px;
        }

        .mentee-goal-score {
          display: grid;
          flex: 0 0 auto;
          text-align: right;
        }

        .mentee-goal-score strong {
          color: var(--mint-600, #129b68);
          font-size: 1.55rem;
          line-height: 1;
        }

        .mentee-goal-score span {
          color: var(--muted);
          font-size: 0.68rem;
          font-weight: 800;
        }

        .mentee-goal-focus {
          background: #f8faf7;
          border-left: 3px solid var(--gold-500, #f5b62f);
          border-radius: 0 12px 12px 0;
          padding: 14px 16px;
        }

        .mentee-goal-focus span {
          color: var(--muted);
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.09em;
          text-transform: uppercase;
        }

        .mentee-goal-focus h3 {
          color: var(--navy-950, #07172d);
          font-size: 1.05rem;
          margin: 4px 0 2px;
        }

        .mentee-goal-focus p,
        .mentee-goal-reason {
          color: var(--muted);
          font-size: 0.86rem;
          line-height: 1.55;
          margin: 0;
        }

        .mentee-goal-tags {
          flex-wrap: wrap;
          gap: 6px;
        }

        .mentee-proposal-button {
          align-items: center;
          background: var(--navy-950, #07172d);
          border: 0;
          border-radius: 999px;
          color: white;
          cursor: pointer;
          display: inline-flex;
          font-weight: 850;
          gap: 7px;
          justify-content: center;
          min-height: 44px;
          padding: 10px 17px;
          transition: transform 160ms ease, background 160ms ease;
        }

        .mentee-proposal-button:hover:not(:disabled) {
          background: #13375c;
          transform: translateY(-1px);
        }

      .mentee-proposal-button.sent {
        background: var(--mint-100, #dcfce7);
        color: var(--mint-600, #15803d);
        cursor: default;
      }

      .mentee-proposal-button.pending:disabled {
        background: #fff1cd;
        color: #8a6111;
      }

      .mentee-proposal-button.unavailable:disabled {
        background: #eef1f4;
        color: var(--muted);
      }

        .mentee-search-empty {
          align-items: center;
          display: grid;
          gap: 12px;
          justify-items: center;
          min-height: 280px;
          padding: 36px;
          text-align: center;
        }

        .mentee-search-empty svg {
          color: var(--gold-500, #f5b62f);
        }

        .mentee-search-empty h2,
        .mentee-search-empty p {
          margin: 0;
        }

        .mentee-search-empty p {
          color: var(--muted);
          max-width: 580px;
        }

        .mentee-search-skeleton {
          animation: menteePulse 1.35s ease-in-out infinite;
          background: linear-gradient(90deg, #edf1f5, #fafbfc, #edf1f5);
          border-radius: 20px;
          min-height: 320px;
        }

        .mentee-search-skeleton:nth-child(2) { animation-delay: 120ms; }
        .mentee-search-skeleton:nth-child(3) { animation-delay: 240ms; }

        @keyframes menteePulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }

        @media (max-width: 820px) {
          .mentee-search-hero,
          .mentee-search-grid {
            grid-template-columns: 1fr;
          }

          .mentee-search-capacity {
            max-width: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mentee-search-skeleton {
            animation: none;
          }

          .mentee-proposal-button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
