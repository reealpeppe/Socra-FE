"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { TOPIC_SAFETY_SCENARIOS, isMentorEligible } from "@/components/TopicCompetenceMatrix";
import { LevelBadge, UserAvatar } from "@/components/Ui";
import { authPost, ClientApiError, clientGet, clientPatch, clientPut } from "@/lib/api";
import { instrumentOptions } from "@/lib/options";
import type { TopicCompetenceSnapshot, TopicCompetenceSnapshotItem, UserMe } from "@/lib/types";

const GENERAL_MENTOR_GUARDRAIL_FLAGS = new Set([
  "advanced_topic_claim_with_weak_knowledge_guardrail",
  "advanced_topic_claim_with_weak_situational_guardrail",
  "delegated_autonomy_caps_initial_level_and_mentor_eligibility",
]);

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<UserMe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [savingMentorStatus, setSavingMentorStatus] = useState(false);
  const [competences, setCompetences] = useState<TopicCompetenceSnapshot | null>(null);
  const [savingTopic, setSavingTopic] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryVersion, setRetryVersion] = useState(0);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
    });
    Promise.all([
      clientGet<UserMe>("/auth/me"),
      clientGet<TopicCompetenceSnapshot | null>("/surveys/competences-v2/me"),
    ])
      .then(([user, topicSnapshot]) => {
        if (active) {
          setMe(user);
          setCompetences(topicSnapshot);
        }
      })
      .catch(() => {
        if (active) {
          setMe(null);
          setError("Non riusciamo a caricare le impostazioni. Riprova.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retryVersion]);

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
    const previous = me;
    setSavingMentorStatus(true);
    setError(null);
    setMessage(null);
    setMe({ ...me, is_coach: isCoach });
    try {
      const updated = await clientPatch<UserMe>("/profiles/me/mentor-status", { is_coach: isCoach });
      setMe(updated);
      setMessage(isCoach ? "Disponibilità come mentor attivata." : "Disponibilità come mentor disattivata.");
    } catch (err) {
      setMe(previous);
      setError(err instanceof ClientApiError ? err.message : "Preferenza mentor non salvata.");
    } finally {
      setSavingMentorStatus(false);
    }
  }

  async function saveMentorTopics(nextItems: TopicCompetenceSnapshotItem[], changedTopic: string) {
    if (!competences || savingTopic) return;
    const previous = competences;
    setSavingTopic(changedTopic);
    setError(null);
    setMessage(null);
    setCompetences({ ...competences, instruments: nextItems });
    try {
      const updated = await clientPut<TopicCompetenceSnapshot>("/surveys/competences-v2/me/mentor-topics", {
        topics: instrumentOptions.map((option) => {
          const item = nextItems.find((candidate) => candidate.topic === option.value);
          return {
            topic: option.value,
            wants_to_mentor: item && isMentorEligible(item) ? item.wants_to_mentor : false,
            safety_scenario_answer: item?.safety_scenario_answer || null,
          };
        }),
      });
      setCompetences(updated);
      setMe((current) => current ? { ...current, is_coach: updated.is_coach } : current);
      setMessage("Disponibilità per strumento aggiornata.");
    } catch (err) {
      setCompetences(previous);
      setError(err instanceof ClientApiError ? err.message : "Preferenze per strumento non salvate.");
    } finally {
      setSavingTopic(null);
    }
  }

  function updateTopicPreference(topic: string, wantsToMentor: boolean) {
    if (!competences || savingTopic) return;
    const nextItems = competences.instruments.map((item) => item.topic === topic
      ? {
          ...item,
          wants_to_mentor: wantsToMentor,
          safety_scenario_answer: wantsToMentor ? item.safety_scenario_answer : null,
        }
      : item);
    const nextItem = nextItems.find((item) => item.topic === topic);
    const scenario = topic === "forex" || topic === "derivatives" ? TOPIC_SAFETY_SCENARIOS[topic] : null;
    if (wantsToMentor && scenario && nextItem?.safety_scenario_answer !== scenario.pass) {
      setCompetences({ ...competences, instruments: nextItems });
      setMessage(null);
      return;
    }
    void saveMentorTopics(nextItems, topic);
  }

  function updateTopicSafety(topic: "forex" | "derivatives", answer: string) {
    if (!competences || savingTopic) return;
    const nextItems = competences.instruments.map((item) => item.topic === topic
      ? { ...item, wants_to_mentor: true, safety_scenario_answer: answer }
      : item);
    void saveMentorTopics(nextItems, topic);
  }

  const displayName = me?.nickname || me?.username || "Account";
  const accountStatus = me?.account_status === "active"
    ? "Attivo"
    : me?.account_status === "suspended"
      ? "Sospeso"
      : me?.account_status === "pending"
        ? "In verifica"
        : me?.account_status
          ? "Da verificare"
          : "—";
  const canEnableMentor = competences
    ? competences.instruments.some((item) => item.wants_to_mentor && item.mentor_eligible !== false)
    : me?.level !== "L0";
  const generalMentorGuardrailBlocked = competences?.consistency_flags?.some(
    (flag) => GENERAL_MENTOR_GUARDRAIL_FLAGS.has(flag)
  ) ?? false;
  const hasAvailableMentorTopic = competences?.instruments.some((item) => {
    if (!isMentorEligible(item)) return false;
    const highRisk = item.topic === "forex" || item.topic === "derivatives";
    const safetyCanBeCompleted = highRisk
      && !generalMentorGuardrailBlocked
      && (item.safety_scenario_passed === null || item.safety_scenario_passed === false);
    return item.mentor_eligible !== false || safetyCanBeCompleted;
  }) ?? false;

  return (
    <AppShell>
      <div className="settings-page">
        <h1 className="settings-heading">Impostazioni</h1>

        {error && (
          <div className="settings-error" role="alert">
            <span>{error}</span>
            {!me ? <button className="button secondary" type="button" onClick={() => setRetryVersion((value) => value + 1)}>Riprova</button> : null}
          </div>
        )}
        {message && <div className="settings-success" role="status">{message}</div>}

        {loading ? <div className="card" role="status">Caricamento impostazioni…</div> : null}
        {me ? (
        <>
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
              <span className="settings-field-value">{accountStatus}</span>
            </div>
          </div>
        </div>

        <div className="card settings-card">
          <h2 className="settings-section-title">Il tuo livello</h2>
          <div className="settings-level-row">
            {me ? <LevelBadge level={me.level} /> : <span className="settings-field-value">-</span>}
            <p className="settings-level-text">
              Il livello descrive il punto di partenza con cui Socra organizza l&apos;esperienza.
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
            <label htmlFor="mentor-availability">
              <strong>Ricevi richieste compatibili</strong>
              <p id="mentor-availability-hint" className="settings-account-note">
                {me?.level === "L0"
                  ? "La disponibilità come mentor non è attiva per questo profilo."
                   : !me?.is_coach && !canEnableMentor
                     ? "Seleziona prima almeno uno strumento disponibile."
                    : !me?.is_coach
                      ? "Attivala per ricevere richieste sugli strumenti che hai selezionato."
                    : "Puoi disattivarla in qualsiasi momento. I percorsi già aperti non vengono interrotti."}
              </p>
            </label>
            <label className="settings-switch">
              <input
                id="mentor-availability"
                type="checkbox"
                role="switch"
                aria-label="Disponibilità come mentor"
                aria-describedby="mentor-availability-hint"
                checked={!!me?.is_coach}
                disabled={!me || me.level === "L0" || savingMentorStatus || (!me.is_coach && !canEnableMentor)}
                onChange={(event) => updateMentorStatus(event.target.checked)}
              />
              <span aria-hidden />
            </label>
          </div>
          {savingMentorStatus ? <p className="settings-account-note" role="status">Salvataggio preferenza…</p> : null}
          {competences ? (
            <div className="settings-topic-preferences">
              <div>
                <strong>Strumenti su cui vuoi aiutare</strong>
                <p className="settings-account-note">
                  Scegli dove renderti disponibile. Le risposte private della survey non vengono mostrate agli altri utenti.
                </p>
              </div>
              {instrumentOptions.map((option) => {
                const item = competences.instruments.find((candidate) => candidate.topic === option.value);
                if (!item || !isMentorEligible(item)) return null;
                const highRisk = option.value === "forex" || option.value === "derivatives";
                const scenario = highRisk ? TOPIC_SAFETY_SCENARIOS[option.value as "forex" | "derivatives"] : null;
                const safetyCorrectable = highRisk && item.safety_scenario_passed === false;
                const safetyAnswerMissing = highRisk && item.safety_scenario_passed === null;
                const needsScenario = !!scenario && item.wants_to_mentor;
                const safetyCanBeCompleted = !generalMentorGuardrailBlocked && (safetyCorrectable || safetyAnswerMissing);
                const readOnly = item.mentor_eligible === false && !safetyCanBeCompleted;
                return (
                  <div className={readOnly ? "settings-topic-block unavailable" : "settings-topic-block"} key={option.value}>
                    <div className="settings-switch-row settings-topic-row">
                      <label htmlFor={`mentor-topic-${option.value}`}>
                        <strong>{option.label}</strong>
                        {safetyCorrectable ? <span className="settings-topic-warning">Rivedi lo scenario di sicurezza per renderti disponibile</span> : null}
                        {readOnly ? <span className="settings-topic-warning">Non disponibile per il profilo attuale</span> : null}
                      </label>
                      <label className="settings-switch">
                        <input
                          id={`mentor-topic-${option.value}`}
                          type="checkbox"
                          role="switch"
                          aria-label={`Mentorship su ${option.label}`}
                          checked={item.wants_to_mentor}
                          disabled={savingTopic !== null || readOnly}
                          onChange={(event) => updateTopicPreference(option.value, event.target.checked)}
                        />
                        <span aria-hidden />
                      </label>
                    </div>
                    {needsScenario && scenario ? (
                      <fieldset className="settings-safety-scenario">
                        <legend>{scenario.label}</legend>
                        <p>{scenario.question}</p>
                        {scenario.options.map((answerOption) => (
                          <label key={answerOption.value}>
                            <input
                              type="radio"
                              name={`settings-safety-${option.value}`}
                              value={answerOption.value}
                              checked={item.safety_scenario_answer === answerOption.value}
                              disabled={savingTopic !== null}
                              onChange={() => updateTopicSafety(option.value as "forex" | "derivatives", answerOption.value)}
                            />
                            <span>{answerOption.label}</span>
                          </label>
                        ))}
                      </fieldset>
                    ) : null}
                  </div>
                );
              })}
              {!hasAvailableMentorTopic ? (
                <p className="settings-account-note">Non risultano ancora strumenti disponibili per la mentorship.</p>
              ) : null}
              {savingTopic ? <p className="settings-account-note" role="status">Salvataggio disponibilità…</p> : null}
            </div>
          ) : null}
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
        </>
        ) : null}
      </div>

      <style jsx global>{`
        .settings-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 0;
          display: grid;
          gap: 24px;
          width: 100%;
        }
        .settings-heading {
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--ink);
          margin: 0;
        }
        .settings-error {
          align-items: center;
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: var(--radius-sm);
          color: #dc2626;
          font-size: 0.875rem;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          justify-content: space-between;
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
        .settings-switch-row > label:first-child {
          cursor: pointer;
          flex: 1;
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
        .settings-topic-preferences {
          border-top: 1px solid var(--line);
          display: grid;
          gap: 12px;
          padding-top: 16px;
        }
        .settings-topic-preferences > div:first-child > strong {
          color: var(--ink);
          display: block;
          margin-bottom: 5px;
        }
        .settings-topic-block {
          background: #f8faf9;
          border: 1px solid var(--line);
          border-radius: 12px;
          display: grid;
          gap: 10px;
          padding: 11px 12px;
        }
        .settings-topic-block.unavailable {
          background: #f2f4f3;
          color: var(--muted);
        }
        .settings-topic-row strong {
          font-size: 0.86rem;
          margin: 0;
        }
        .settings-topic-warning {
          color: #9a4d1f;
          display: block;
          font-size: 0.72rem;
          margin-top: 3px;
        }
        .settings-safety-scenario {
          border: 0;
          display: grid;
          gap: 8px;
          margin: 0;
          padding: 4px 0 0;
        }
        .settings-safety-scenario legend {
          color: var(--ink);
          font-size: 0.76rem;
          font-weight: 800;
          padding: 0;
        }
        .settings-safety-scenario > p {
          color: var(--muted);
          font-size: 0.75rem;
          line-height: 1.4;
          margin: 0;
        }
        .settings-safety-scenario label {
          align-items: flex-start;
          background: white;
          border: 1px solid var(--line);
          border-radius: 9px;
          cursor: pointer;
          display: flex;
          font-size: 0.74rem;
          gap: 8px;
          line-height: 1.4;
          min-height: 44px;
          padding: 8px 9px;
        }
        .settings-safety-scenario input {
          accent-color: var(--mint-600);
          flex: 0 0 auto;
          height: 18px;
          margin: 1px 0 0;
          width: 18px;
        }
      `}</style>
    </AppShell>
  );
}
