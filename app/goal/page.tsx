"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { clientGet, clientPost, ClientApiError } from "@/lib/api";
import { capitalGoalOptions, goalOptionsByLevelTopic, riskOptions, topicOptions, type SelectOption } from "@/lib/options";
import type { Goal, GoalsMe } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";

type OnboardingState = {
  level: "L0" | "L1" | "L2" | string;
  latest_answer_id: string | null;
};

export default function GoalPage() {
  const router = useRouter();
  const [level, setLevel] = useState<"L0" | "L1" | "L2" | null>(null);
  const [pathId, setPathId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ topic: "", goal_tag: "", capital_goal: "", risk: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const availableTopics = useMemo(() => level ? topicOptions.filter((option) => option.levels?.includes(level)) : [], [level]);
  const availableGoals = level ? goalOptionsByLevelTopic[level]?.[form.topic] || [] : [];
  const availableCapital = useMemo(() => level ? capitalGoalOptions.filter((option) => option.levels?.includes(level)) : [], [level]);
  useUnsavedChangesGuard(dirty);

  useEffect(() => {
    const queryPathId = new URLSearchParams(window.location.search).get("pathId");
    const queryEditMode = new URLSearchParams(window.location.search).get("edit") === "1";
    setPathId(queryPathId);
    setEditMode(queryEditMode);
    Promise.all([
      clientGet<OnboardingState>("/surveys/onboarding/me"),
      clientGet<GoalsMe>("/goals/me")
    ])
      .then(([state, goals]) => {
        if (!["L0", "L1", "L2"].includes(state.level)) {
          throw new Error("Livello non valido: completa di nuovo la survey iniziale.");
        }
        const nextLevel = state.level as "L0" | "L1" | "L2";
        setLevel(nextLevel);
        const current = goals.current || goals.active_goal || null;
        if (current && (queryPathId || queryEditMode)) setForm(goalToForm(current, nextLevel));
      })
      .catch((err: { message?: string }) => setError(err.message || "Impossibile caricare il tuo livello"))
      .finally(() => setLoading(false));
  }, []);

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

  return (
    <AppShell>
      <OnboardingGate>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "24px", maxWidth: "800px" }}>
          {/* Header */}
          <div>
            <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
              {pathId ? "Rivedi il tuo obiettivo" : editMode ? "Aggiorna il tuo obiettivo" : "Il tuo obiettivo d’investimento"}
            </h1>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              {pathId
                ? "Conferma o aggiorna tutte le scelte prima di iniziare un nuovo percorso."
                : editMode
                  ? "Le nuove scelte sostituiranno l’obiettivo attivo e verranno usate per il matching."
                : "Area, obiettivo e capitale sono filtrati dal livello assegnato."}
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
                Livello assegnato
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
                <p style={{ color: "var(--navy-950)", fontWeight: 800, margin: "0 0 4px" }}>Definisci il tuo obiettivo</p>
                <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0 }}>
	                  Il mentor vede livello e obiettivo; il capitale resta privato.
                </p>
              </div>

              <div className="goal-fields">
                <SelectField
	                  label="Area di interesse"
                  value={form.topic}
                  onChange={updateTopic}
                  options={availableTopics}
                  disabled={loading || submitting || !level}
                />
                <SelectField
	                  label="Obiettivo concreto"
                  value={form.goal_tag}
                  onChange={(value) => updateField("goal_tag", value)}
                  options={availableGoals}
                  disabled={loading || submitting || !form.topic}
                />
                <SelectField
	                  label="Capitale indicativo"
                  value={form.capital_goal}
                  onChange={(value) => updateField("capital_goal", value)}
                  options={availableCapital}
                  disabled={loading || submitting || !level}
                />
                <SelectField
	                  label="Profilo di rischio"
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
	            <span style={{ color: "var(--gold-500)", flexShrink: 0 }}>i</span>
	            Salviamo l&apos;obiettivo e ti proponiamo mentor coerenti solo quando i dati sono completi.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="button dark"
              type="submit"
              disabled={loading || submitting || !level || Object.values(form).some((value) => !value)}
              style={{ minWidth: "220px" }}
            >
              {submitting ? "Salvataggio…" : pathId ? "Conferma obiettivo" : editMode ? "Aggiorna e cerca mentor" : "Salva e cerca mentor"}
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
      </OnboardingGate>
    </AppShell>
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

function goalToForm(goal: Goal, level: "L0" | "L1" | "L2") {
  const topic = goal.topic_code || findOptionValue(goal.topic, topicOptions) || "";
  const goalsForLevel = Object.values(goalOptionsByLevelTopic[level] || {}).flat();
  const goalTag = goal.goal_tag_code || findOptionValue(goal.goal_tag, goalsForLevel) || "";
  return {
    topic,
    goal_tag: goalTag,
    capital_goal: goal.capital_goal || goal.amount_range || "",
    risk: goal.risk || ""
  };
}

function findOptionValue(valueOrLabel: string | null | undefined, options: SelectOption[]) {
  if (!valueOrLabel) return null;
  return options.find((option) => option.value === valueOrLabel || option.label === valueOrLabel)?.value || null;
}
