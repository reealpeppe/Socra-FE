"use client";

import { Suspense, useEffect, useId, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { AsyncState, Button } from "@/components/Ui";
import { clientGet, clientPost, ClientApiError } from "@/lib/api";
import { capitalGoalOptions, goalOptionsByLevelTopic, riskOptions, topicOptions, type SelectOption } from "@/lib/options";
import type { Goal, GoalsMe } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";

type OnboardingState = {
  level: string;
  latest_answer_id: string | null;
  competence_v2_completed?: boolean;
};

type GlobalLevel = "L0" | "L1" | "L2" | "L3" | "L4" | "L5";
type CatalogLevel = "L0" | "L1" | "L2";

export default function GoalPage() {
  return (
    <AppShell>
      <OnboardingGate>
        <Suspense fallback={<div className="card" role="status">Caricamento obiettivo…</div>}>
          <GoalForm />
        </Suspense>
      </OnboardingGate>
    </AppShell>
  );
}

function GoalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathId = searchParams.get("pathId");
  const [level, setLevel] = useState<GlobalLevel | null>(null);
  const [competenceV2Completed, setCompetenceV2Completed] = useState(false);
  const [hasCurrentGoal, setHasCurrentGoal] = useState(false);
  const [form, setForm] = useState({ topic: "", goal_tag: "", capital_goal: "", risk: "" });
  const [currentTopicOption, setCurrentTopicOption] = useState<SelectOption | null>(null);
  const [currentGoalOption, setCurrentGoalOption] = useState<SelectOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const catalogLevel = level ? toCatalogLevel(level) : null;

  const availableTopics = useMemo(() => {
    const options = catalogLevel
      ? topicOptions.filter((option) => (
          option.levels?.includes(catalogLevel)
          && (!competenceV2Completed || !["planning", "taxation"].includes(option.value))
        ))
      : [];
    if (
      form.topic
      && currentTopicOption?.value === form.topic
      && !options.some((option) => option.value === form.topic)
    ) {
      return [...options, currentTopicOption];
    }
    return options;
  }, [catalogLevel, competenceV2Completed, currentTopicOption, form.topic]);
  const availableGoals = useMemo(() => {
    const options = catalogLevel ? goalOptionsByLevelTopic[catalogLevel]?.[form.topic] || [] : [];
    if (
      form.goal_tag
      && currentGoalOption?.value === form.goal_tag
      && !options.some((option) => option.value === form.goal_tag)
    ) {
      return [...options, currentGoalOption];
    }
    return options;
  }, [catalogLevel, currentGoalOption, form.goal_tag, form.topic]);
  const availableCapital = useMemo(
    () => catalogLevel ? capitalGoalOptions.filter((option) => option.levels?.includes(catalogLevel)) : [],
    [catalogLevel]
  );
  const editMode = hasCurrentGoal;
  useUnsavedChangesGuard(dirty);

  useEffect(() => {
    Promise.all([
      clientGet<OnboardingState>("/surveys/onboarding/me"),
      clientGet<GoalsMe>("/goals/me")
    ])
      .then(([state, goals]) => {
        if (!["L0", "L1", "L2", "L3", "L4", "L5"].includes(state.level)) {
          throw new Error("Livello non valido: completa di nuovo la survey iniziale.");
        }
        const nextLevel = state.level as GlobalLevel;
        setLevel(nextLevel);
        setCompetenceV2Completed(!!state.competence_v2_completed);
        const current = goals.current || goals.active_goal || null;
        if (current) {
          const currentForm = goalToForm(current, nextLevel);
          setHasCurrentGoal(true);
          setForm(currentForm);
          setCurrentTopicOption(currentForm.topic
            ? { value: currentForm.topic, label: current.topic || "Tema attuale" }
            : null);
          setCurrentGoalOption(currentForm.goal_tag
            ? { value: currentForm.goal_tag, label: current.goal_tag || "Obiettivo attuale" }
            : null);
        }
      })
      .catch((err: { message?: string }) => setLoadError(err.message || "Impossibile caricare il tuo obiettivo"))
      .finally(() => setLoading(false));
  }, [loadAttempt]);

  function retryLoad() {
    setLoadError(null);
    setError(null);
    setLoading(true);
    setHasCurrentGoal(false);
    setCurrentTopicOption(null);
    setCurrentGoalOption(null);
    setLevel(null);
    setCompetenceV2Completed(false);
    setLoadAttempt((value) => value + 1);
  }

  function updateTopic(topic: string) {
    setDirty(true);
    setForm((current) => ({ ...current, topic, goal_tag: "" }));
  }

  function updateField(field: "goal_tag" | "capital_goal" | "risk", value: string) {
    setDirty(true);
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!level || Object.values(form).some((value) => !value)) {
      setError("Completa tutte le scelte prima di continuare.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = pathId ? `/paths/${pathId}/update-goal` : "/surveys/goal/me";
      const goal = await clientPost<Goal>(endpoint, { ...form, amount_range: form.capital_goal });
      setDirty(false);
      router.push(pathId
        ? `/paths/${pathId}?goalReviewed=1`
        : editMode
          ? `/matching?goalId=${goal.id}`
          : `/tour?goalId=${goal.id}`);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Obiettivo non salvato");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ marginInline: "auto", maxWidth: "860px", width: "100%" }}>
        <AsyncState
          status="loading"
          title="Caricamento obiettivo…"
          body="Stiamo recuperando il tuo punto di partenza."
        />
      </div>
    );
  }

  if (loadError || !level) {
    return (
      <div style={{ marginInline: "auto", maxWidth: "860px", width: "100%" }}>
        <AsyncState
          status="error"
          title="Non riusciamo a caricare il tuo obiettivo"
          body={loadError || "Il livello iniziale non è disponibile."}
          action={<Button variant="secondary" onClick={retryLoad}>Riprova</Button>}
        />
      </div>
    );
  }

  return (
    <form
      className="goal-page"
      onSubmit={onSubmit}
      aria-busy={loading || submitting}
      style={{ display: "grid", gap: "24px", marginInline: "auto", maxWidth: "860px", width: "100%" }}
    >
          {/* Header */}
          <div>
            <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
              {pathId ? "Cosa vuoi approfondire adesso?" : editMode ? "Aggiorna cosa vuoi imparare" : "Cosa vuoi imparare?"}
            </h1>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              {pathId
                ? "Conferma il tema o scegline uno nuovo prima del prossimo percorso."
                : editMode
                  ? "Le nuove scelte sostituiranno l’obiettivo attivo e ci aiuteranno a proporti persone più pertinenti."
                  : "Scegli un tema e un risultato concreto: Socra ti metterà in contatto con persone compatibili."}
            </p>
          </div>

          {/* Level indicator */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "14px", padding: "16px 20px" }}>
            <span style={{
              alignItems: "center", background: "var(--navy-950)", borderRadius: "999px",
              color: "var(--gold-500)", display: "inline-flex", height: "40px",
              justifyContent: "center", width: "40px", flexShrink: 0
            }}>
              <Target size={20} aria-hidden />
            </span>
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 2px", textTransform: "uppercase" }}>
                Il tuo livello attuale
              </p>
              <strong style={{ color: "var(--navy-950)", fontSize: "1.25rem" }}>
                {loading ? "Caricamento…" : level || "Non disponibile"}
              </strong>
            </div>
          </div>

          {error ? <p className="error" role="alert">{error}</p> : null}

          {/* Form card */}
          <div className="card">
            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <p style={{ color: "var(--navy-950)", fontWeight: 800, margin: "0 0 4px" }}>Scegli il tema del confronto</p>
                <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0 }}>
                  Nel profilo pubblico compare solo il tema generale. Il mentor che contatti vede l’obiettivo di apprendimento; il contesto resta privato.
                </p>
              </div>

              <div className="goal-fields">
                <SelectField
                  label="Tema"
                  value={form.topic}
                  onChange={updateTopic}
                  options={availableTopics}
                  disabled={loading || submitting || !level}
                />
                <SelectField
                  label="Risultato di apprendimento"
                  value={form.goal_tag}
                  onChange={(value) => updateField("goal_tag", value)}
                  options={availableGoals}
                  disabled={loading || submitting || !form.topic}
                />
                <SelectField
                  label="Contesto di partenza (privato)"
                  value={form.capital_goal}
                  onChange={(value) => updateField("capital_goal", value)}
                  options={availableCapital}
                  disabled={loading || submitting || !level}
                />
                <SelectField
                  label="Stile del confronto (privato)"
                  value={form.risk}
                  onChange={(value) => updateField("risk", value)}
                  options={riskOptions}
                  disabled={loading || submitting || !level}
                />
              </div>
            </div>
          </div>

          {/* Info note */}
          <div style={{
            alignItems: "center", background: "#fff8e8",
            border: "1px solid rgba(245,182,47,0.3)", borderRadius: "var(--radius-sm)",
            color: "var(--muted)", display: "flex", fontSize: "0.85rem", gap: "10px", padding: "12px 16px"
          }}>
            <span aria-hidden style={{ color: "var(--gold-700, #855f00)", flexShrink: 0 }}>i</span>
            Socra facilita il confronto tra persone: non valida decisioni personali né propone portafogli o allocazioni.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="button dark"
              type="submit"
              disabled={loading || submitting || !level}
              style={{ minWidth: "220px" }}
            >
              {submitting ? "Salvataggio…" : pathId ? "Conferma la scelta" : editMode ? "Aggiorna e vedi i mentor" : "Salva e continua"}
            </button>
          </div>
          <style jsx>{`
            .goal-fields {
              display: grid;
              gap: 16px;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            @media (max-width: 640px) {
              .goal-fields {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
    </form>
  );
}

function SelectField({
  label, value, onChange, options, disabled
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled: boolean;
}) {
  const id = useId();
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <label htmlFor={id} style={{ color: "var(--navy-950)", fontSize: "0.85rem", fontWeight: 800 }}>{label}</label>
      <select
        id={id}
        name={id}
        className="input select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required
      >
        <option value="">Seleziona un&apos;opzione</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function goalToForm(goal: Goal, level: GlobalLevel) {
  const topic = goal.topic_code || findOptionValue(goal.topic, topicOptions) || "";
  const goalsForLevel = Object.values(goalOptionsByLevelTopic[toCatalogLevel(level)] || {}).flat();
  const goalTag = goal.goal_tag_code || findOptionValue(goal.goal_tag, goalsForLevel) || "";
  return {
    topic,
    goal_tag: goalTag,
    capital_goal: goal.capital_goal || goal.amount_range || "",
    risk: goal.risk || ""
  };
}

function toCatalogLevel(level: GlobalLevel): CatalogLevel {
  if (level === "L0" || level === "L1") return level;
  return "L2";
}

function findOptionValue(valueOrLabel: string | null | undefined, options: SelectOption[]) {
  if (!valueOrLabel) return null;
  return options.find((option) => option.value === valueOrLabel || option.label === valueOrLabel)?.value || null;
}
