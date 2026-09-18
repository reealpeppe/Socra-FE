"use client";

import { Suspense, useEffect, useId, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Target } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { AsyncState, Button } from "@/components/Ui";
import { clientGet, clientPost, ClientApiError } from "@/lib/api";
import { capitalGoalOptions, type SelectOption } from "@/lib/options";
import type { Goal, GoalsMe } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";

type GoalCatalog = {
  topics: Array<{ code: string; label: string; goals: Array<{ code: string; label: string }> }>;
  discussion_types: Array<{ code: string; label: string; description: string }>;
  max_discussion_types: number;
};

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
  const [catalog, setCatalog] = useState<GoalCatalog | null>(null);
  const [hasCurrentGoal, setHasCurrentGoal] = useState(false);
  const [form, setForm] = useState({ topic: "", goal_tag: "", capital_goal: "", risk: "", discussion_types: [] as string[] });
  const [currentTopicOption, setCurrentTopicOption] = useState<SelectOption | null>(null);
  const [currentGoalOption, setCurrentGoalOption] = useState<SelectOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const availableTopics = useMemo(() => {
    const options = catalog?.topics.map((topic) => ({ value: topic.code, label: topic.label })) || [];
    if (
      form.topic
      && currentTopicOption?.value === form.topic
      && !options.some((option) => option.value === form.topic)
    ) {
      return [...options, currentTopicOption];
    }
    return options;
  }, [catalog, currentTopicOption, form.topic]);
  const availableGoals = useMemo(() => {
    const options = catalog?.topics.find((topic) => topic.code === form.topic)?.goals.map((goal) => ({ value: goal.code, label: goal.label })) || [];
    if (
      form.goal_tag
      && currentGoalOption?.value === form.goal_tag
      && !options.some((option) => option.value === form.goal_tag)
    ) {
      return [...options, currentGoalOption];
    }
    return options;
  }, [catalog, currentGoalOption, form.goal_tag, form.topic]);
  const availableCapital = capitalGoalOptions;
  const editMode = hasCurrentGoal;
  useUnsavedChangesGuard(dirty);

  useEffect(() => {
    Promise.all([
      clientGet<GoalCatalog>("/surveys/goal/catalog"),
      clientGet<GoalsMe>("/goals/me")
    ])
      .then(([nextCatalog, goals]) => {
        setCatalog(nextCatalog);
        const current = goals.current || goals.active_goal || null;
        if (current) {
          const currentForm = goalToForm(current, nextCatalog);
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
    setCatalog(null);
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

  function toggleDiscussion(code: string) {
    setDirty(true);
    setForm((current) => ({ ...current, discussion_types: current.discussion_types.includes(code)
      ? current.discussion_types.filter((item) => item !== code)
      : current.discussion_types.length < (catalog?.max_discussion_types || 3)
        ? [...current.discussion_types, code] : current.discussion_types }));
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!catalog || !form.topic || !form.goal_tag || !form.capital_goal || !form.discussion_types.length) {
      setError("Completa tutte le scelte prima di continuare.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const endpoint = pathId ? `/paths/${pathId}/update-goal` : "/surveys/goal/me";
      const goal = await clientPost<Goal>(endpoint, { ...form, risk: form.risk || null, amount_range: form.capital_goal });
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

  if (loadError || !catalog || !catalog.discussion_types?.length) {
    return (
      <div style={{ marginInline: "auto", maxWidth: "860px", width: "100%" }}>
        <AsyncState
          status="error"
          title="Non riusciamo a caricare il tuo obiettivo"
          body={loadError || "Il catalogo degli obiettivi non è disponibile."}
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
                  : "Dalle basi a un confronto avanzato: scegli cosa vuoi approfondire e come vorresti lavorarci."}
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
                Il prossimo passo
              </p>
              <strong style={{ color: "var(--navy-950)", fontSize: "1.25rem" }}>
                Un obiettivo, un confronto concreto
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
                  Chi valuta un percorso con te vede il tema, il risultato di apprendimento e i tipi di confronto. Il contesto di partenza resta privato.
                </p>
              </div>

              <div className="goal-fields">
                <SelectField
                  label="Tema"
                  value={form.topic}
                  onChange={updateTopic}
                  options={availableTopics}
                  disabled={loading || submitting || !catalog}
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
                  disabled={loading || submitting || !catalog}
                />
              </div>

              <fieldset className="discussion-fieldset" aria-describedby="discussion-help discussion-count" disabled={submitting}>
                <legend>Che tipo di confronto cerchi?</legend>
                <p id="discussion-help" className="muted">
                  Scegli da uno a tre modi in cui vorresti affrontare l’argomento. Aiutano il mentor a capire cosa cerchi;
                  il risultato di apprendimento scelto sopra definisce cosa approfondirete.
                </p>
                <div className="discussion-options">
                  {catalog.discussion_types.map((option) => {
                    const checked = form.discussion_types.includes(option.code);
                    const disabled = !checked && form.discussion_types.length >= catalog.max_discussion_types;
                    return (
                      <label className="discussion-option" key={option.code} data-selected={checked} data-disabled={disabled}>
                        <input type="checkbox" name="discussion_types" value={option.code} checked={checked}
                          disabled={disabled} onChange={() => toggleDiscussion(option.code)} aria-label={option.label} />
                        <span><strong>{option.label}</strong><span>{option.description}</span></span>
                      </label>
                    );
                  })}
                </div>
                <p id="discussion-count" role="status" className="muted">
                  {form.discussion_types.length} di {catalog.max_discussion_types} selezionati.
                  {form.discussion_types.length >= catalog.max_discussion_types ? " Deseleziona una voce per cambiarla." : " Almeno una scelta richiesta."}
                </p>
              </fieldset>
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
              disabled={loading || submitting || !catalog}
              style={{ minWidth: "220px" }}
            >
              {submitting ? "Salvataggio…" : pathId ? "Conferma la scelta" : editMode ? "Aggiorna e vedi i mentor" : "Salva e continua"}
            </button>
          </div>
          <style jsx>{`
            .discussion-fieldset { border: 0; padding: 0; margin: 12px 0 0; min-width: 0; }
            .discussion-fieldset legend { font-size: 1.15rem; font-weight: 800; color: var(--navy-950); }
            .discussion-fieldset p { font-size: .88rem; line-height: 1.6; }
            .discussion-options { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .discussion-option { display: flex; gap: 12px; padding: 16px; border: 1px solid var(--line); border-radius: 12px; cursor: pointer; }
            .discussion-option[data-selected="true"] { border-color: var(--navy-950); background: var(--paper); box-shadow: inset 0 0 0 1px var(--navy-950); }
            .discussion-option[data-disabled="true"] { opacity: .65; cursor: not-allowed; }
            .discussion-option:focus-within { outline: 3px solid var(--gold-500); outline-offset: 3px; }
            .discussion-option input { width: 18px; height: 18px; flex-shrink: 0; margin-top: 3px; accent-color: var(--navy-950); }
            .discussion-option strong { display: block; margin-bottom: 5px; font-size: .91rem; }
            .discussion-option span span { display: block; font-size: .82rem; line-height: 1.55; color: var(--muted); }
            .goal-fields {
              display: grid;
              gap: 16px;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            @media (max-width: 640px) {
              .goal-fields, .discussion-options {
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
  const selectedLabel = options.find(option => option.value === value)?.label;
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
      {selectedLabel && selectedLabel.length > 55 ? <small className="muted" style={{ lineHeight: 1.5 }}>{selectedLabel}</small> : null}
    </div>
  );
}

function goalToForm(goal: Goal, catalog: GoalCatalog) {
  const topic = goal.topic_code || catalog.topics.find((item) => item.label === goal.topic)?.code || "";
  const goalTag = goal.goal_tag_code || catalog.topics.flatMap((item) => item.goals).find((item) => item.label === goal.goal_tag)?.code || "";
  return {
    topic,
    goal_tag: goalTag,
    capital_goal: goal.capital_goal || goal.amount_range || "",
    risk: goal.risk || "",
    discussion_types: goal.discussion_types || []
  };
}
