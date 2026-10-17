"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, Shield, ThumbsUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { UserAvatar, MetricStat } from "@/components/Ui";
import { AlignmentDialog } from "@/components/AlignmentDialog";
import { CoverageSummary, ObjectiveSummary } from "@/components/SkillSummary";
import { SkillPublicProfile } from "@/components/SkillPublicProfile";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { AggregateCandidate, Goal, GoalsMe, MatchCandidate, MatchRequestItem, PublicProfile, UserMe, CandidatePage, GoalMatch } from "@/lib/types";

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
  const searchParams = useSearchParams();
  const fromRequests = searchParams.get("from") === "requests";
  const mentorProposal = searchParams.get("from") === "matching" && searchParams.get("role") === "mentor";
  const requestTab = searchParams.get("tab");
  const requestsHref = requestTab === "sent" || requestTab === "received" ? `/requests?tab=${requestTab}` : "/requests";
  const [me, setMe] = useState<UserMe | null>(null);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestJustSent, setRequestJustSent] = useState(false);
  const [pendingIncoming, setPendingIncoming] = useState(false);
  const [showAlignment, setShowAlignment] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [activeGoal, setActiveGoal] = useState<Goal | null>(null);
  const [candidate, setCandidate] = useState<MatchCandidate | null>(null);
  const [menteeCandidate, setMenteeCandidate] = useState<AggregateCandidate | null>(null);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateCheckComplete, setCandidateCheckComplete] = useState(false);
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [candidateRetryVersion, setCandidateRetryVersion] = useState(0);
  const [profileRetryVersion, setProfileRetryVersion] = useState(0);
  const [requestStateReady, setRequestStateReady] = useState(false);
  const [supportingDataError, setSupportingDataError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
      setSupportingDataError(null);
      setAuthError(false);
      setRequestStateReady(false);
      setRequestSent(false);
      setRequestJustSent(false);
      setPendingIncoming(false);
      setShowAlignment(false);
      setActiveGoal(null);
    });
    Promise.allSettled([
      clientGet<UserMe>("/auth/me"),
      clientGet<PublicProfile>(`/profiles/${userId}`),
      mentorProposal ? Promise.resolve<GoalsMe | null>(null) : clientGet<GoalsMe>("/goals/me"),
      clientGet<MatchRequestItem[]>(`/matching/requests/me?role=${mentorProposal ? "mentor" : "mentee"}`)
    ]).then(([meResult, profileResult, goalsResult, requestsResult]) => {
      if (!active) return;

      if (meResult.status === "fulfilled") setMe(meResult.value);
      else setAuthError(true);
      if (profileResult.status === "fulfilled") setProfile(profileResult.value);
      else setError("Profilo non disponibile");

      if (goalsResult.status === "fulfilled") {
        const goal = goalsResult.value?.active_goal || goalsResult.value?.current;
        if (goal && goal.is_active !== false) {
          setActiveGoal(goal);
        }
      }
      if (requestsResult.status === "fulfilled") {
        const pending = (Array.isArray(requestsResult.value) ? requestsResult.value : []).find(
          (request) => request.status === "pending" && (mentorProposal ? request.mentee_id === userId : request.mentee_id === (meResult.status === "fulfilled" ? meResult.value.id : null))
        );
        setRequestSent(!!pending);
        setPendingIncoming(!!pending && pending.initiator_role === (mentorProposal ? "mentee" : "mentor"));
      }
      if (goalsResult.status === "rejected" || requestsResult.status === "rejected") {
        setSupportingDataError(mentorProposal ? "Non riusciamo a verificare le proposte già inviate. Riprova prima di procedere." : "Non riusciamo a verificare obiettivo e richieste già inviate. Riprova prima di procedere.");
      } else {
        setRequestStateReady(true);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [mentorProposal, profileRetryVersion, userId]);

  const isOwnProfile = me?.id === userId;
  const displayName = profile?.nickname || (isOwnProfile ? me?.nickname : null) || "Utente Socra";
  const badges = profile?.public_badges || [];
  const topTopics = profile?.top_topics || [];
  const competences = profile?.competences || [];
  const completedPaths = profile?.completed_paths ?? 0;
  const goalsReached = percentMetric(profile?.aggregate_metrics?.goals_reached_pct);
  const wouldRepeat = percentMetric(profile?.aggregate_metrics?.would_repeat_pct);
  const hasAnyPublicMetric = goalsReached !== null || wouldRepeat !== null;
  const backHref = isOwnProfile ? "/dashboard" : fromRequests ? requestsHref : mentorProposal ? "/matching/mentees" : "/matching";
  const backLabel = isOwnProfile ? "Torna alla dashboard" : fromRequests ? "Torna alle proposte" : mentorProposal ? "Torna alla lista degli apprendisti" : "Torna alla lista dei mentor";
  const goalMatches = mentorProposal ? menteeCandidate?.goal_matches : candidate?.goal_matches;
  const hasMentorMatches = candidate?.mentor_id === userId && !!candidate.goal_matches?.length;

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setCandidate(null);
      setMenteeCandidate(null);
      setCandidateCheckComplete(false);
      if (!me || isOwnProfile || requestSent || !requestStateReady || (mentorProposal ? !me.is_coach : !activeGoal?.id || !profile?.is_coach)) {
        setCandidate(null);
        setCandidateError(null);
        setCandidateLoading(false);
        return;
      }
      setCandidateError(null);
      setCandidateLoading(true);
      async function loadCandidate() {
        if (mentorProposal) {
          let cursor: string | null = null;
          const visited = new Set<string>();
          do {
            const page: CandidatePage = await clientPost("/matching/mentees/all", cursor ? { cursor } : {});
            if (!active) return;
            const found = page.items.find((item) => item.mentee_id === userId);
            if (found) {
              setMenteeCandidate(found);
              return;
            }
            cursor = page.next_cursor;
            if (cursor && visited.has(cursor)) throw new Error("Verifica compatibilità non disponibile. Riprova.");
            if (cursor) visited.add(cursor);
          } while (cursor);
        } else if (activeGoal) {
          const items = activeGoal.skill_model
            ? (await clientPost<CandidatePage>("/matching/candidates/all", { mentor_id: userId })).items as MatchCandidate[]
            : await clientPost<MatchCandidate[]>("/matching/candidates", { goal_id: activeGoal.id });
          if (active) setCandidate(items.find((item) => item.mentor_id === userId) || null);
        }
      }
      loadCandidate()
        .catch((err) => {
          if (!active) return;
          setCandidate(null);
          setCandidateError(err instanceof ClientApiError ? err.message : "Verifica compatibilità non disponibile");
        })
        .finally(() => {
          if (active) {
            setCandidateCheckComplete(true);
            setCandidateLoading(false);
          }
        });
    });
    return () => {
      active = false;
    };
  }, [activeGoal, candidateRetryVersion, isOwnProfile, me, mentorProposal, profile?.is_coach, requestSent, requestStateReady, userId]);

  async function sendMatchRequest(alignmentMessage: string, agreedObjectives?: string[], selectedGoalId?: string) {
    if (isOwnProfile || !me || !requestStateReady || requestSent) throw new Error("Verifica lo stato della proposta prima di procedere.");
    if (mentorProposal ? !me.is_coach || menteeCandidate?.mentee_id !== userId : !activeGoal || !profile?.is_coach) throw new Error("Questa persona non è disponibile per una proposta.");
    if (!mentorProposal && activeGoal?.skill_model && (!candidateCheckComplete || !hasMentorMatches)) throw new Error("Questa persona non è disponibile per una proposta.");
    const goalId = selectedGoalId || (!mentorProposal ? activeGoal?.id : undefined);
    if (!goalId || (goalMatches && !goalMatches.some((match) => match.goal_id === goalId))) throw new Error("Scegli il tema da proporre.");
    setRequestLoading(true);
    setRequestError(null);
    try {
      await clientPost(mentorProposal ? "/matching/proposals" : "/matching/requests", {
        [mentorProposal ? "mentee_id" : "mentor_id"]: userId,
        goal_id: goalId,
        alignment_message: alignmentMessage,
        ...(mentorProposal || activeGoal?.skill_model || candidate?.skill_model ? { agreed_objective_codes: agreedObjectives } : {}),
        email_sharing_accepted: true
      });
      setRequestSent(true);
      setRequestJustSent(true);
    } catch (err) {
      setRequestError(err instanceof ClientApiError ? err.message : "Richiesta non inviata");
      throw err;
    } finally {
      setRequestLoading(false);
    }
  }

	  return (
	    <>
	      <div className="profile-page">
        {showAlignment ? <AlignmentDialog userId={userId} avatarUrl={profile?.avatar_url} topic={activeGoal?.topic} mode={activeGoal?.discussion_mode_label} name={profile?.nickname || "questa persona"} mentorProposal={mentorProposal} coverage={candidate} matches={goalMatches} onClose={() => setShowAlignment(false)} onSend={sendMatchRequest} /> : null}
        <Link href={backHref} className="profile-back">
          <ArrowLeft size={16} aria-hidden />
          {backLabel}
        </Link>

	        {loading ? (
          <ProfileSkeleton />
	        ) : error ? (
	          <div className="card profile-empty">
	            <p>{error}</p>
              <button className="button secondary" type="button" onClick={() => setProfileRetryVersion((value) => value + 1)}>Riprova</button>
            <Link href={backHref} className="button secondary">{backLabel}</Link>
          </div>
        ) : profile ? (
          <>
            <section className="profile-hero card">
              <div className="profile-hero-left">
                <UserAvatar name={displayName} size="xl" src={profile.avatar_url} />
                <div className="profile-hero-info">
                  <h1 className="profile-name">{displayName}</h1>
                  {profile.bio ? <p className="profile-muted-text" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxWidth: "60ch" }}>{profile.bio}</p> : null}
                  <div className="profile-badges-row">
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
                <MetricStat value={completedPaths} label={completedPaths === 1 ? "Percorso completato come mentor" : "Percorsi completati come mentor"} />
                {!profile?.skill_model ? <MetricStat value={badges.length} label="Badge pubblici" /> : null}
              </div>
            </section>

            <div className="profile-body">
              <div className="profile-left">
                {profile?.skill_model ? <SkillPublicProfile profile={profile} ownProfile={isOwnProfile} /> : <section className="card">
                  <p className="profile-section-label">
                    {topTopics.length && !competences.length
                      ? "Argomenti su cui può aiutare"
                      : "Competenze principali"}
                  </p>
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
                </section>}

                {!isOwnProfile && (candidate || menteeCandidate) ? (
                  <section className="card profile-match-card">
                    {goalMatches?.length ? goalMatches.map(match => <div key={match.goal_id}>
                      <p className="profile-section-label">Compatibilità per {match.topic}</p>
                      <div className="profile-match-score"><span className="profile-match-pct">{Math.round(match.match_score)}%</span><span className="profile-muted-text">Compatibilità</span></div>
                      <CoverageSummary coverage={match} />
                    </div>) : candidate ? <>
                    <p className="profile-section-label">Compatibilità con il tuo obiettivo</p>
                    <div className="profile-match-score">
                      <span className="profile-match-pct">{Math.round(candidate.match_score)}%</span>
                      <span className="profile-muted-text">Compatibilità</span>
                    </div>
                    {candidate.skill_model ? <CoverageSummary coverage={candidate} /> : <p className="profile-muted-text">{candidate.reason_summary}</p>}
                    </> : null}
                  </section>
                ) : null}

                <section className="card">
                  <p className="profile-section-label">Attività nella community</p>
	                  <div className="profile-metrics-grid">
                    {goalsReached !== null ? (
	                    <div className="profile-metric-row">
	                      <span>Obiettivi raggiunti o forte miglioramento</span>
	                      <strong>{goalsReached}</strong>
	                    </div>
                    ) : null}
                    {wouldRepeat !== null ? (
	                    <div className="profile-metric-row">
	                      <span>Disponibili a ripetere il percorso</span>
	                      <strong>{wouldRepeat}</strong>
	                    </div>
                    ) : null}
                    {!hasAnyPublicMetric ? (
	                      <div className="profile-metric-row">
	                        <span>Reputazione</span>
	                        <strong>Nuovo utente</strong>
	                      </div>
                    ) : null}
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
	                        Capitale, profilo di rischio e risposte private non sono pubblici.
                      </p>
                    </div>
                  </div>
                </section>

                {isOwnProfile ? (
                  <OwnProfileCard isCoach={profile.is_coach} />
                ) : mentorProposal ? (
                  <MentorProposalCard
                    isCoach={!!me?.is_coach}
                    authError={authError || !me}
                    matches={goalMatches}
                    requestSent={requestSent}
                    requestJustSent={requestJustSent}
                    pendingIncoming={pendingIncoming}
                    loading={loading || candidateLoading || (!menteeCandidate && !candidateError && !requestStateReady)}
                    error={supportingDataError || candidateError}
                    requestError={requestError}
                    onRequest={() => setShowAlignment(true)}
                    onRetry={() => setProfileRetryVersion((value) => value + 1)}
                  />
                ) : !profile.is_coach ? (
                  <section className="card profile-request-card">
                    <p className="profile-card-title">Profilo pubblico</p>
                    <p className="profile-muted-text">Questa persona non è disponibile come mentor in questo momento.</p>
                    <Link href={fromRequests ? requestsHref : "/matching"} className="button secondary">
                      {fromRequests ? "Torna alle proposte" : "Torna ai mentor"}
                    </Link>
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
                    matches={candidate?.goal_matches}
                    pathCost={profile.path_cost}
                    requestSent
                    requestJustSent={requestJustSent}
                    pendingIncoming={pendingIncoming}
                    requestLoading={false}
                    requestError={null}
                    onRequest={() => setShowAlignment(true)}
                  />
	                ) : supportingDataError || !requestStateReady ? (
                  <section className="card profile-request-card" role="alert">
                    <p className="profile-card-title">Verifica operativa non disponibile</p>
                    <p className="profile-muted-text">{supportingDataError || "Riprova prima di inviare una richiesta."}</p>
                    <button className="button secondary" type="button" onClick={() => setProfileRetryVersion((value) => value + 1)}>Riprova</button>
                  </section>
                ) : candidateLoading || (activeGoal?.skill_model && !candidateCheckComplete) ? (
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
                ) : activeGoal?.skill_model && !hasMentorMatches ? (
                  <section className="card profile-request-card">
                    <p className="profile-card-title">Confronto non disponibile</p>
                    <p className="profile-muted-text">Questa persona non è disponibile per una proposta in questo momento.</p>
                    <Link href="/matching" className="button secondary">Torna ai mentor</Link>
                    <button className="button secondary" type="button" onClick={() => setCandidateRetryVersion((value) => value + 1)}>Riprova</button>
                  </section>
                ) : (
                  <RequestCard
                    activeGoal={activeGoal}
                    matches={candidate?.goal_matches}
                    pathCost={profile.path_cost}
                    requestSent={requestSent}
                    requestJustSent={requestJustSent}
                    pendingIncoming={pendingIncoming}
                    requestLoading={requestLoading}
                    requestError={requestError}
                    onRequest={() => setShowAlignment(true)}
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

function MentorProposalCard({ isCoach, authError, matches, requestSent, requestJustSent, pendingIncoming, loading, error, requestError, onRequest, onRetry }: {
  isCoach: boolean;
  authError: boolean;
  matches?: GoalMatch[];
  requestSent: boolean;
  requestJustSent: boolean;
  pendingIncoming: boolean;
  loading: boolean;
  error: string | null;
  requestError: string | null;
  onRequest: () => void;
  onRetry: () => void;
}) {
  if (authError) return <section className="card profile-request-card"><p className="profile-card-title">Accedi per inviare una proposta</p><Link href="/login" className="button">Vai all&apos;accesso</Link></section>;
  if (!isCoach) return <section className="card profile-request-card"><p className="profile-card-title">Attiva prima la disponibilità mentor</p><p className="profile-muted-text">Gestisci le attività che offri e la tua disponibilità nelle impostazioni.</p><Link href="/settings" className="button">Gestisci disponibilità</Link></section>;
  if (requestSent) return <section className="card profile-request-card profile-request-sent" role="status"><ThumbsUp size={24} aria-hidden /><p className="profile-card-title">{requestJustSent ? "Proposta inviata" : "Proposta in attesa"}</p><p className="profile-muted-text">{pendingIncoming ? "Rispondi alla proposta dell’apprendista." : "Attendi la risposta dell’apprendista."}</p><Link href={`/requests?tab=${pendingIncoming ? "received" : "sent"}`} className="button secondary">Vedi le proposte</Link></section>;
  if (error) return <section className="card profile-request-card" role="alert"><p className="profile-card-title">Verifica operativa non disponibile</p><p className="profile-muted-text">{error}</p><button className="button secondary" type="button" onClick={onRetry}>Riprova</button></section>;
  if (loading) return <section className="card profile-request-card" role="status"><p className="profile-card-title">Verifica compatibilità…</p></section>;
  if (!matches?.length) return <section className="card profile-request-card"><p className="profile-card-title">Profilo pubblico</p><p className="profile-muted-text">Questa persona non è disponibile per una proposta in questo momento.</p><Link href="/matching/mentees" className="button secondary">Torna agli apprendisti</Link></section>;
  return <section className="card profile-request-card"><p className="profile-card-title">Proponi un confronto</p><div className="profile-muted-text">{matches.map(match => <ObjectiveSummary key={match.goal_id} topic={match.topic} title="Su cosa puoi aiutare" labels={match.covered_objective_labels} mode={match.discussion_mode_label} />)}</div><p className="profile-muted-text">L’apprendista sceglierà se accettare. Il costo del percorso sarà addebitato a lui solo all’accettazione.</p>{requestError ? <p className="profile-request-error">{requestError}</p> : null}<button className="button" type="button" onClick={onRequest}>Proponi un confronto</button></section>;
}

function RequestCard({
  activeGoal,
  matches,
  pathCost,
  requestSent,
  requestJustSent,
  pendingIncoming,
  requestLoading,
  requestError,
  onRequest
}: {
  activeGoal: Goal | null;
  matches?: GoalMatch[];
  pathCost: number;
  requestSent: boolean;
  requestJustSent: boolean;
  pendingIncoming: boolean;
  requestLoading: boolean;
  requestError: string | null;
  onRequest: () => void;
}) {
  if (requestSent) {
    return (
      <section className="card profile-request-card profile-request-sent" role="status">
        <ThumbsUp size={24} aria-hidden />
        <p className="profile-card-title">{pendingIncoming ? "Proposta ricevuta" : requestJustSent ? "Richiesta inviata" : "Proposta in attesa"}</p>
        <p className="profile-muted-text">{pendingIncoming
          ? "Hai una proposta ricevuta in attesa. Rispondi prima di inviarne un’altra."
          : "Hai una proposta in attesa. Attendi la risposta dell’altra persona prima di inviarne un’altra."}</p>
        <Link href={`/requests?tab=${pendingIncoming ? "received" : "sent"}`} className="button secondary">Vedi le proposte</Link>
      </section>
    );
  }

  if (!activeGoal) {
    return (
      <section className="card profile-request-card">
        <p className="profile-card-title">Invia richiesta al mentor</p>
        <p className="profile-muted-text">Definisci prima il tuo obiettivo per inviare una richiesta coerente.</p>
        <Link href="/goal" className="button">Crea il tuo obiettivo</Link>
      </section>
    );
  }

  return (
    <section className="card profile-request-card">
      <p className="profile-card-title">Invia richiesta al mentor</p>
      <div className="profile-muted-text">
        {matches?.length ? matches.map(match=><ObjectiveSummary key={match.goal_id} topic={match.topic} title="Su cosa può aiutarti" labels={match.covered_objective_labels} mode={match.discussion_mode_label} />) : activeGoal.skill_model ? <ObjectiveSummary topic={activeGoal.topic} title="Cosa vuoi imparare" labels={activeGoal.objective_labels} mode={activeGoal.discussion_mode_label} /> : <>Obiettivo: <strong>{activeGoal.goal_tag}</strong></>}
      </div>
      <p className="profile-muted-text">
        Costo del percorso per te: {pathCost} {pathCost === 1 ? "credito" : "crediti"}.
      </p>
      {requestError ? <p className="profile-request-error">{requestError}</p> : null}
      <button className="button" type="button" onClick={onRequest} disabled={requestLoading}>
        {requestLoading ? "Invio in corso…" : "Invia richiesta al mentor"}
      </button>
    </section>
  );
}

function OwnProfileCard({ isCoach }: { isCoach: boolean }) {
  return (
    <section className="card profile-own-card">
      <div className="profile-privacy-inner">
        <CheckCircle2 size={20} aria-hidden />
        <div>
          <p className="profile-card-title">Questo è il tuo profilo</p>
          <p className="profile-muted-text">
            {isCoach
              ? "Il tuo profilo mentor è attivo: puoi monitorare richieste e percorsi."
              : "Verifica gli argomenti e la disponibilità come mentor dalle impostazioni."}
          </p>
        </div>
      </div>
      <div className="profile-own-actions">
        {isCoach ? <Link href="/settings" className="button secondary">Impostazioni</Link> : null}
        <Link href={isCoach ? "/paths?tab=mentor" : "/settings"} className="button">
          {isCoach ? "Percorsi mentor" : "Gestisci ruolo mentor"}
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
        grid-template-columns: minmax(0, 1fr);
        overflow-wrap: anywhere;
        gap: 20px;
        margin: 0 auto;
        max-width: 1100px;
        width: 100%;
      }

      .profile-back {
        align-items: center;
        color: var(--muted);
        display: inline-flex;
        font-size: 0.875rem;
        font-weight: 600;
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
        min-width: 0;
        grid-template-columns: minmax(0, 1fr);
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
        font-weight: 650;
        padding: 6px 10px;
      }

      .profile-mentor-badge {
        background: var(--brand-blue-soft, #edf2f6);
        color: var(--brand-blue, #20313e);
      }

      .profile-own-badge,
      .profile-top-badges span {
        background: #fff8e8;
        border: 1px solid #ffe0a0;
        color: var(--navy-950, #07172d);
      }

      .profile-topic-list span {
        background: var(--brand-blue-soft);
        border: 1px solid var(--brand-blue-line);
        color: var(--brand-blue);
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
        font-weight: 650;
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
        color: var(--brand-blue, #20313e);
        font-size: 2rem;
        font-weight: 950;
      }

      .profile-badge-item {
        align-items: center;
        background: var(--brand-blue-soft, #edf2f6);
        color: var(--brand-blue, #20313e);
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
        background: var(--brand-blue-soft);
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
        color: var(--brand-blue, #20313e);
        flex-shrink: 0;
        margin-top: 2px;
      }

      .profile-card-title {
        color: var(--navy-950, #07172d);
        font-weight: 650;
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
          min-width: 0;
          width: 100%;
        }

        .profile-hero-stats {
          gap: 16px;
        }
      }
    `}</style>
  );
}
