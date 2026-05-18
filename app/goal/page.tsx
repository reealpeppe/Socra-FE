"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { clientGet, clientPost, ClientApiError } from "@/lib/api";
import { capitalGoalOptions, goalOptionsByLevelTopic, riskOptions, topicOptions, type SelectOption } from "@/lib/options";
import type { Goal } from "@/lib/types";

type OnboardingState = {
  level: "L0" | "L1" | "L2" | string;
  latest_answer_id: string | null;
};

export default function GoalPage() {
  const router = useRouter();
  const [level, setLevel] = useState<"L0" | "L1" | "L2">("L0");
  const [form, setForm] = useState({ topic: "undefined", goal_tag: "understand_basics", capital_goal: "undefined", risk: "undefined" });
  const [error, setError] = useState<string | null>(null);

  const availableTopics = useMemo(() => topicOptions.filter((option) => option.levels?.includes(level)), [level]);
  const availableGoals = goalOptionsByLevelTopic[level]?.[form.topic] || [];
  const availableCapital = useMemo(() => capitalGoalOptions.filter((option) => option.levels?.includes(level)), [level]);

  useEffect(() => {
    clientGet<OnboardingState>("/surveys/onboarding/me")
      .then((state) => {
        const nextLevel = ["L0", "L1", "L2"].includes(state.level) ? state.level as "L0" | "L1" | "L2" : "L0";
        setLevel(nextLevel);
        const firstTopic = topicOptions.find((option) => option.levels?.includes(nextLevel));
        const firstGoal = firstTopic ? goalOptionsByLevelTopic[nextLevel]?.[firstTopic.value]?.[0] : undefined;
        const firstCapital = capitalGoalOptions.find((option) => option.levels?.includes(nextLevel));
        setForm({
          topic: firstTopic?.value || "undefined",
          goal_tag: firstGoal?.value || "",
          capital_goal: firstCapital?.value || "undefined",
          risk: "undefined"
        });
      })
      .catch(() => undefined);
  }, []);

  function updateTopic(topic: string) {
    const firstGoal = goalOptionsByLevelTopic[level]?.[topic]?.[0];
    setForm((current) => ({ ...current, topic, goal_tag: firstGoal?.value || "" }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const goal = await clientPost<Goal>("/surveys/goal/me", { ...form, amount_range: form.capital_goal });
      router.push(`/matching?goalId=${goal.id}`);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Obiettivo non salvato");
    }
  }

  return (
    <AppShell>
      <OnboardingGate>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "24px", maxWidth: "800px" }}>
          {/* Header */}
          <div>
            <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
              Il tuo obiettivo d&apos;investimento
            </h1>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Topic, obiettivo e capitale sono filtrati dal livello assegnato.
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
              <strong style={{ color: "var(--navy-950)", fontSize: "1.25rem" }}>{level}</strong>
            </div>
          </div>

          {error ? <p className="error">{error}</p> : null}

          {/* Form card */}
          <div className="card">
            <div style={{ display: "grid", gap: "20px" }}>
              <div>
                <p style={{ color: "var(--navy-950)", fontWeight: 800, margin: "0 0 4px" }}>Definisci il tuo obiettivo</p>
                <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0 }}>
	                  Il mentor vede livello e obiettivo; il capitale resta privato.
                </p>
              </div>

              <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <SelectField
	                  label="Area di interesse"
                  value={form.topic}
                  onChange={updateTopic}
                  options={availableTopics}
                />
                <SelectField
	                  label="Obiettivo concreto"
                  value={form.goal_tag}
                  onChange={(value) => setForm({ ...form, goal_tag: value })}
                  options={availableGoals}
                />
                <SelectField
	                  label="Capitale indicativo"
                  value={form.capital_goal}
                  onChange={(value) => setForm({ ...form, capital_goal: value })}
                  options={availableCapital}
                />
                <SelectField
	                  label="Profilo di rischio"
                  value={form.risk}
                  onChange={(value) => setForm({ ...form, risk: value })}
                  options={riskOptions}
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
	            Salviamo l'obiettivo e ti proponiamo mentor coerenti solo quando i dati sono completi.
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="button dark"
              type="submit"
              disabled={!form.goal_tag}
              style={{ minWidth: "220px" }}
            >
              Salva e cerca mentor
            </button>
          </div>
        </form>
      </OnboardingGate>
    </AppShell>
  );
}

function SelectField({
  label, value, onChange, options
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
}) {
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <label style={{ color: "var(--navy-950)", fontSize: "0.85rem", fontWeight: 800 }}>{label}</label>
      <select
        className="input select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}
