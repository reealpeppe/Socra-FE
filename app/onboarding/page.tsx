"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ButtonLink, Card, ProgressSteps } from "@/components/Ui";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import {
  autonomyOptions,
  durationOptions,
  instrumentDepthOptions,
  instrumentOptions,
  investedCapitalOptions,
  knowledgeConcepts,
  knowledgeOptions,
  practiceOptions,
  sectionDQuestions,
  situationalQuestions,
  type SelectOption,
} from "@/lib/options";

const legacyDraftKey = "socra_onboarding_draft";
const draftKeyFor = (userId: string) => `${legacyDraftKey}:${userId}`;

type Answers = Record<string, unknown> & {
  D1?: string;
  D2?: string;
  D3?: Record<string, number>;
  D4?: Record<string, number>;
  D5?: string;
  D6?: string;
  D7?: string;
  D8?: string;
  D9?: string;
  section_d?: Record<string, string>;
};

type OnboardingState = {
  user_id?: string;
  level: string;
  is_coach: boolean;
  latest_answer_id: string | null;
};

type SurveyDraft = {
  step: number;
  scores: { A: number; B: number; C: number };
  answers: Answers;
  dNeverInvested: boolean;
};

type SurveyDraftResponse = {
  current_step: number;
  scores: { A?: number; B?: number; C?: number };
  answers: Answers;
  include_section_d: boolean;
  d_never_invested: boolean;
};

type StepKind = "experience" | "instruments" | "knowledge" | "situations" | "context" | "review";

const STEP_META: Record<StepKind, { title: string; section: string }> = {
  experience: { title: "La tua esperienza", section: "A" },
  instruments: { title: "Strumenti utilizzati", section: "A" },
  knowledge: { title: "Conoscenze di base", section: "B" },
  situations: { title: "Scelte in situazioni concrete", section: "C" },
  context: { title: "Contesto personale", section: "D" },
  review: { title: "Rivedi e conferma", section: "Fine" },
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState<OnboardingState | null>(null);
  const [result, setResult] = useState<{ total_score: number; derived_level: string; is_coach: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftWarning, setDraftWarning] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [loadedDraft, setLoadedDraft] = useState(false);
  const [draftStorageKey, setDraftStorageKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const scores = useMemo(() => estimateScores(answers), [answers]);
  const steps = useMemo(() => buildSteps(answers), [answers]);
  const safeStep = Math.min(step, steps.length - 1);
  const current = steps[safeStep];

  useEffect(() => {
    let active = true;

    async function load() {
      let resolvedDraftStorageKey: string | null = null;
      try {
        const state = await clientGet<OnboardingState>("/surveys/onboarding/me");
        if (!active) return;
        const userDraftKey = state.user_id ? draftKeyFor(state.user_id) : null;
        resolvedDraftStorageKey = userDraftKey;
        setDraftStorageKey(userDraftKey);
        window.sessionStorage.removeItem(legacyDraftKey);
        if (state.latest_answer_id) {
          setCompleted(state);
          if (userDraftKey) window.sessionStorage.removeItem(userDraftKey);
          setLoadedDraft(true);
          return;
        }
      } catch (err) {
        if (err instanceof ClientApiError && err.status === 401) {
          if (active) {
            setError("Sessione scaduta. Accedi di nuovo per compilare la survey.");
            setLoadedDraft(true);
          }
          return;
        }
      }

      try {
        const dbDraft = await clientGet<SurveyDraftResponse | null>("/surveys/onboarding/me/draft");
        if (!active) return;
        if (dbDraft) {
          const restoredAnswers = dbDraft.answers || {};
          setAnswers(restoredAnswers);
          setStep(dbDraft.current_step);
          setLoadedDraft(true);
          return;
        }
      } catch {
        if (active) setDraftWarning("Bozza online non disponibile: continuiamo a salvare su questo dispositivo.");
      }

      const rawDraft = resolvedDraftStorageKey
        ? window.sessionStorage.getItem(resolvedDraftStorageKey)
        : null;
      if (rawDraft) {
        try {
          const draft = JSON.parse(rawDraft) as SurveyDraft;
          setStep(draft.step);
          setAnswers(draft.answers || {});
        } catch {
          if (resolvedDraftStorageKey) {
            window.sessionStorage.removeItem(resolvedDraftStorageKey);
          }
        }
      }
      if (active) setLoadedDraft(true);
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!loadedDraft || result || completed) return;
    const draft: SurveyDraft = {
      step: safeStep,
      scores,
      answers,
      dNeverInvested: answers.D1 === "none",
    };
    if (draftStorageKey) {
      window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
    }
    const timer = window.setTimeout(() => {
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(() => clientPost("/surveys/onboarding/me/draft", {
          current_step: draft.step,
          scores: draft.scores,
          answers: draft.answers,
          include_section_d: true,
          d_never_invested: draft.dNeverInvested,
        }))
        .then(() => {
          setDraftWarning(null);
          setLastSavedAt(new Date());
        })
        .catch(() => setDraftWarning("Salvataggio online temporaneamente non disponibile; la bozza resta su questo dispositivo."));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [answers, completed, draftStorageKey, loadedDraft, result, safeStep, scores]);

  useEffect(() => {
    if (!loadedDraft || result || completed) return;
    const frame = window.requestAnimationFrame(() => stepHeadingRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [completed, loadedDraft, result, safeStep]);

  function showValidationError(message: string) {
    setError(message);
    window.requestAnimationFrame(() => errorRef.current?.focus());
  }

  function setExperience(key: "D1" | "D2" | "D5" | "D6", value: string) {
    setError(null);
    setAnswers((currentAnswers) => {
      const next = { ...currentAnswers, [key]: value };
      if (key === "D1") {
        delete next.D2;
        delete next.D3;
        delete next.D5;
        delete next.D6;
        delete next.D7;
        delete next.D8;
        delete next.D9;
      }
      return next;
    });
  }

  function setInstrument(topic: string, value: string) {
    setError(null);
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      D3: { ...(currentAnswers.D3 || {}), [topic]: Number(value) },
    }));
  }

  function setKnowledge(concept: string, value: string) {
    setError(null);
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      D4: { ...(currentAnswers.D4 || {}), [concept]: Number(value) },
    }));
  }

  function setSituation(key: string, value: string) {
    setError(null);
    setAnswers((currentAnswers) => ({ ...currentAnswers, [key]: value }));
  }

  function setContextAnswer(key: string, value: string) {
    setError(null);
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      section_d: { ...(currentAnswers.section_d || {}), [key]: value },
    }));
  }

  function next() {
    if (!isStepComplete(current, answers)) {
      showValidationError("Completa ogni domanda della sezione. Quando preferisci non condividere un dato, scegli l’opzione dedicata.");
      return;
    }
    setError(null);
    setStep((value) => Math.min(value + 1, steps.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError(null);
    setStep((value) => Math.max(value - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit() {
    if (!isStepComplete("review", answers)) {
      showValidationError("La survey non è completa: rivedi le sezioni indicate.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await clientPost<{ total_score: number; derived_level: string; is_coach: boolean }>(
        "/surveys/onboarding/me/answers",
        {
          section: "onboarding",
          answers: buildSubmittedAnswers(answers),
        }
      );
      if (draftStorageKey) window.sessionStorage.removeItem(draftStorageKey);
      window.sessionStorage.removeItem(legacyDraftKey);
      setResult(response);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Survey non salvata");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="survey-page">
        {!completed && !result ? (
          <ProgressSteps
            steps={steps.map((kind) => STEP_META[kind].title)}
            current={safeStep}
          />
        ) : null}

        {error ? <p ref={errorRef} className="error" role="alert" tabIndex={-1}>{error}</p> : null}
        {!completed && !result && loadedDraft ? (
          <p className="survey-save-status" role="status">
            {draftWarning
              ? draftWarning
              : lastSavedAt
                ? `Bozza salvata alle ${lastSavedAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`
                : "Salvataggio automatico attivo"}
          </p>
        ) : null}

        {!loadedDraft ? (
          <Card><p className="muted" role="status">Caricamento della survey…</p></Card>
        ) : completed ? (
          <ResultCard level={completed.level} isCoach={completed.is_coach} alreadyCompleted />
        ) : result ? (
          <ResultCard level={result.derived_level} isCoach={result.is_coach} />
        ) : (
          <div className="survey-layout">
            <div className="survey-main">
              <Card className="workflow-panel workflow-question">
                <div className="stack">
                  <div>
                    <h1 className="survey-heading">Conosciamoci meglio</h1>
                    <p className="muted survey-subheading">
                      Le risposte servono ad assegnare il livello iniziale e a rendere coerenti i percorsi.
                    </p>
                  </div>

                  <div className="workflow-panel-head">
                    <div>
                      <p className="eyebrow">Sezione {safeStep + 1} di {steps.length}</p>
                      <h2 ref={stepHeadingRef} tabIndex={-1}>{STEP_META[current].title}</h2>
                    </div>
                    <span className="pill">{STEP_META[current].section}</span>
                  </div>

                  {current === "experience" ? (
                    <ExperienceStep answers={answers} onChange={setExperience} />
                  ) : current === "instruments" ? (
                    <MatrixStep
                      title="Per ciascuno strumento indica la tua esperienza."
                      items={instrumentOptions}
                      options={instrumentDepthOptions}
                      values={answers.D3 || {}}
                      onChange={setInstrument}
                    />
                  ) : current === "knowledge" ? (
                    <MatrixStep
                      title="Per ciascun concetto indica quanto ti senti sicuro."
                      items={knowledgeConcepts}
                      options={knowledgeOptions}
                      values={answers.D4 || {}}
                      onChange={setKnowledge}
                    />
                  ) : current === "situations" ? (
                    <SituationsStep answers={answers} onChange={setSituation} />
                  ) : current === "context" ? (
                    <ContextStep
                      answers={answers.section_d || {}}
                      onChange={setContextAnswer}
                    />
                  ) : (
                    <ReviewStep
                      answers={answers}
                      steps={steps}
                      onEdit={(kind) => setStep(steps.indexOf(kind))}
                    />
                  )}

                  <div className="survey-navigation">
                    <button className="button secondary" type="button" onClick={back} disabled={safeStep === 0 || submitting}>
                      <ChevronLeft size={16} aria-hidden /> Indietro
                    </button>
                    {current === "review" ? (
                      <button className="button primary" type="button" onClick={submit} disabled={submitting}>
                        {submitting ? "Salvataggio…" : "Scopri il tuo livello"}
                      </button>
                    ) : (
                      <button
                        className="button primary"
                        type="button"
                        onClick={next}
                      >
                        Continua
                      </button>
                    )}
                  </div>
                </div>
              </Card>

              <div className="survey-privacy-note">
                <ShieldCheck size={15} aria-hidden />
                <span>Capitale e contesto personale restano privati e non vengono mostrati ai mentor.</span>
              </div>
            </div>

            <aside className="survey-sidebar">
              <Card className="workflow-panel">
                <p className="survey-sidebar-label">Perché questa survey?</p>
                <p className="muted">
                  Serve a proporti confronti coerenti con ciò che conosci già. La scelta finale della persona resta sempre tua.
                </p>
              </Card>
              <Card className="workflow-panel workflow-note">
                <LockKeyhole size={18} aria-hidden />
                <p>Nessuna risposta è preselezionata. Puoi tornare indietro prima dell&apos;invio.</p>
              </Card>
            </aside>
          </div>
        )}
        <SurveyStyles />
      </div>
    </AppShell>
  );
}

function ExperienceStep({
  answers,
  onChange,
}: {
  answers: Answers;
  onChange: (key: "D1" | "D2" | "D5" | "D6", value: string) => void;
}) {
  const hasInvested = !!answers.D1 && answers.D1 !== "none";
  return (
    <div className="stack">
      <fieldset className="survey-fieldset">
        <legend>Hai mai investito denaro in strumenti finanziari?</legend>
        <div className="workflow-choice-grid">
          {practiceOptions.map((option) => (
            <button
              key={option.value}
              className={answers.D1 === option.value ? "button dark" : "button secondary"}
              type="button"
              aria-pressed={answers.D1 === option.value}
              onClick={() => onChange("D1", option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      {hasInvested ? (
        <div className="survey-form-grid">
          <QuestionSelect id="experience-duration" label="Da quanto tempo investi?" options={durationOptions} value={answers.D2} onChange={(value) => onChange("D2", value)} />
          <QuestionSelect id="experience-autonomy" label="Come prendi le decisioni di investimento?" options={autonomyOptions} value={answers.D5} onChange={(value) => onChange("D5", value)} />
          <QuestionSelect id="experience-capital" label="Ordine di grandezza del capitale investito?" options={investedCapitalOptions} value={answers.D6} onChange={(value) => onChange("D6", value)} />
        </div>
      ) : answers.D1 === "none" ? (
        <p className="muted">Le domande sull&apos;esperienza pratica vengono saltate. Continuerai con le conoscenze di base.</p>
      ) : null}
    </div>
  );
}

function MatrixStep({
  title,
  items,
  options,
  values,
  onChange,
}: {
  title: string;
  items: ReadonlyArray<{ value: string; label: string }>;
  options: SelectOption[];
  values: Record<string, number>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="stack">
      <p className="muted">{title}</p>
      <div className="survey-matrix">
        {items.map((item) => (
          <QuestionSelect
            key={item.value}
            id={`matrix-${item.value}`}
            label={item.label}
            options={options}
            value={values[item.value] === undefined ? undefined : String(values[item.value])}
            onChange={(value) => onChange(item.value, value)}
          />
        ))}
      </div>
    </div>
  );
}

function SituationsStep({ answers, onChange }: { answers: Answers; onChange: (key: string, value: string) => void }) {
  return (
    <div className="stack survey-situations">
      <p className="muted">Non cerchiamo la risposta perfetta: scegli quella che descrive meglio come ragioneresti.</p>
      {situationalQuestions.map((question) => (
        <QuestionSelect
          key={question.key}
          id={`situation-${question.key}`}
          label={question.prompt}
          options={question.options}
          value={answers[question.key] as string | undefined}
          onChange={(value) => onChange(question.key, value)}
        />
      ))}
    </div>
  );
}

function ContextStep({
  answers,
  onChange,
}: {
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="stack">
      <p className="muted">
        Questa sezione fa parte della survey ma non cambia livello o matching.
        Per ogni domanda puoi scegliere “Preferisco non rispondere”. Le risposte
        condivise restano private; scegliendo un&apos;altra risposta autorizzi il
        solo uso aggregato per capire e migliorare la community.
      </p>
      <div className="survey-form-grid">
        {sectionDQuestions.map((question) => (
          <QuestionSelect
            key={question.key}
            id={`context-${question.key}`}
            label={question.label}
            options={question.options}
            value={answers[question.key]}
            onChange={(value) => onChange(question.key, value)}
            hint="Scegli una risposta oppure “Preferisco non rispondere”."
          />
        ))}
      </div>
    </div>
  );
}

function ReviewStep({
  answers,
  steps,
  onEdit,
}: {
  answers: Answers;
  steps: StepKind[];
  onEdit: (kind: StepKind) => void;
}) {
  const sections = [
    {
      kind: "experience" as const,
      label: "Esperienza",
      items: [
        { label: "Esperienza precedente", value: optionLabel(practiceOptions, answers.D1) },
        ...(answers.D1 && answers.D1 !== "none"
          ? [
              { label: "Da quanto tempo", value: optionLabel(durationOptions, answers.D2) },
              { label: "Come decidi", value: optionLabel(autonomyOptions, answers.D5) },
              { label: "Contesto indicativo", value: optionLabel(investedCapitalOptions, answers.D6) },
            ]
          : []),
      ],
    },
    ...(steps.includes("instruments")
      ? [{
          kind: "instruments" as const,
          label: "Strumenti",
          items: instrumentOptions.map((item) => ({
            label: item.label,
            value: optionLabel(instrumentDepthOptions, String(answers.D3?.[item.value] ?? "")),
          })),
        }]
      : []),
    {
      kind: "knowledge" as const,
      label: "Conoscenze",
      items: knowledgeConcepts.map((concept) => ({
        label: concept.label,
        value: optionLabel(knowledgeOptions, String(answers.D4?.[concept.value] ?? "")),
      })),
    },
    ...(steps.includes("situations")
      ? [{
          kind: "situations" as const,
          label: "Scenari",
          items: situationalQuestions.map((question) => ({
            label: question.prompt,
            value: optionLabel(question.options, answers[question.key] as string | undefined),
          })),
        }]
      : []),
    {
      kind: "context" as const,
      label: "Contesto personale",
      items: sectionDQuestions.map((question) => ({
        label: question.label,
        value: optionLabel(question.options, answers.section_d?.[question.key]),
      })),
    },
  ];
  return (
    <div className="stack">
      <p className="muted">
        Controlla le risposte prima di confermare. Le informazioni personali restano private.
      </p>
      <div className="review-list">
        {sections.map((section) => (
          <section className="review-row" key={section.kind} aria-labelledby={`review-${section.kind}`}>
            <div className="review-row-head">
              <h3 id={`review-${section.kind}`}>{section.label}</h3>
              {section.kind === "context" ? <span className="pill">Privato</span> : null}
            </div>
            <dl className="review-values">
              {section.items.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
            <button className="button secondary" type="button" onClick={() => onEdit(section.kind)}>
              Modifica {section.label.toLocaleLowerCase("it-IT")}
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}

function optionLabel(options: SelectOption[], value?: string): string {
  if (!value) return "Da completare";
  return options.find((option) => option.value === value)?.label || value;
}

function QuestionSelect({
  id,
  label,
  options,
  value,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <div className="survey-question">
      <label htmlFor={id}>{label}</label>
      {hint ? <span className="survey-question-hint">{hint}</span> : null}
      <select id={id} name={id} className="input" value={value || ""} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Seleziona una risposta</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

function ResultCard({
  level,
  isCoach,
  alreadyCompleted = false,
}: {
  level: string;
  isCoach: boolean;
  alreadyCompleted?: boolean;
}) {
  const copy: Record<string, { title: string; description: string }> = {
    L0: { title: "Primi passi", description: "Partirai da obiettivi introduttivi con un mentor compatibile." },
    L1: { title: "Basi operative", description: "Puoi affrontare obiettivi guidati e, se vuoi, renderti disponibile come mentor." },
    L2: { title: "Esperienza avanzata", description: "Puoi affrontare obiettivi più articolati e, se vuoi, renderti disponibile come mentor." },
  };
  const levelCopy = copy[level] || { title: "Livello Socra", description: "Il profilo è pronto per il prossimo passo." };
  return (
    <div className="survey-layout single">
      <div className="survey-main">
        <Card className="workflow-result">
          <div className="stack">
            <span className="workflow-symbol"><CheckCircle2 size={26} aria-hidden /></span>
            <p className="eyebrow">{alreadyCompleted ? "Survey già completata" : "Livello iniziale"}</p>
            <div className="level-reveal">
              <div className="level-reveal-badge" aria-label={`Livello ${level}`}>{level}</div>
              <div>
                <h2>{levelCopy.title}</h2>
                <p className="muted">{levelCopy.description}</p>
                {isCoach ? <span className="pill green">Disponibilità mentor attiva, modificabile nelle impostazioni</span> : null}
              </div>
            </div>
            <p className="muted">
              {alreadyCompleted
                ? "Puoi aggiornare ciò che vuoi imparare. Il tuo contesto di partenza resta privato."
                : "Ora scegli cosa vuoi imparare con l’aiuto della community. Il tuo contesto di partenza resterà privato."}
            </p>
            <div className="cluster">
              <ButtonLink href="/goal">
                {alreadyCompleted ? "Gestisci obiettivo" : "Scegli cosa imparare"}
              </ButtonLink>
              {alreadyCompleted ? <ButtonLink href="/dashboard" variant="secondary">Dashboard</ButtonLink> : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function buildSteps(answers: Answers): StepKind[] {
  const steps: StepKind[] = ["experience"];
  if (answers.D1 && answers.D1 !== "none") steps.push("instruments");
  steps.push("knowledge");
  if (allKnowledgeAnswered(answers) && estimateScores(answers).A + estimateScores(answers).B > 10) {
    steps.push("situations");
  }
  steps.push("context", "review");
  return steps;
}

function isStepComplete(step: StepKind, answers: Answers): boolean {
  const invested = !!answers.D1 && answers.D1 !== "none";
  const experienceComplete = !!answers.D1 && (!invested || !!answers.D2 && !!answers.D5 && !!answers.D6);
  const instrumentsComplete = !invested || instrumentOptions.every((item) => answers.D3?.[item.value] !== undefined);
  const knowledgeComplete = allKnowledgeAnswered(answers);
  const situationsRequired = knowledgeComplete && estimateScores(answers).A + estimateScores(answers).B > 10;
  const situationsComplete = !situationsRequired || situationalQuestions.every((question) => !!answers[question.key]);
  const contextComplete = sectionDQuestions.every((question) => !!answers.section_d?.[question.key]);

  if (step === "experience") return experienceComplete;
  if (step === "instruments") return instrumentsComplete;
  if (step === "knowledge") return knowledgeComplete;
  if (step === "situations") return situationsComplete;
  if (step === "context") return contextComplete;
  return experienceComplete && instrumentsComplete && knowledgeComplete && situationsComplete && contextComplete;
}

function optionScore(options: SelectOption[], value?: string): number {
  return Number(options.find((option) => option.value === value)?.score || 0);
}

function allKnowledgeAnswered(answers: Answers): boolean {
  return knowledgeConcepts.every((concept) => answers.D4?.[concept.value] !== undefined);
}

function estimateScores(answers: Answers): { A: number; B: number; C: number } {
  let A = optionScore(practiceOptions, answers.D1);
  let B = 0;
  let C = 0;
  if (answers.D1 && answers.D1 !== "none") {
    A += optionScore(durationOptions, answers.D2);
    A += Object.values(answers.D3 || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    B += optionScore(autonomyOptions, answers.D5);
    B += optionScore(investedCapitalOptions, answers.D6);
  }
  B += Object.values(answers.D4 || {}).reduce((sum, value) => sum + Number(value || 0), 0);
  if (A + B > 10) {
    for (const question of situationalQuestions) {
      C += optionScore(question.options, answers[question.key] as string | undefined);
    }
  }
  return { A, B, C };
}

function buildSubmittedAnswers(answers: Answers): Answers {
  const next: Answers = { ...answers };
  if (next.D1 === "none") {
    delete next.D2;
    delete next.D3;
    delete next.D5;
    delete next.D6;
  }
  const scores = estimateScores(next);
  if (scores.A + scores.B <= 10) {
    delete next.D7;
    delete next.D8;
    delete next.D9;
  }
  return next;
}

function SurveyStyles() {
  return (
    <style jsx global>{`
      .survey-page {
        display: grid;
        gap: 20px;
        margin-inline: auto;
        max-width: 1100px;
        min-width: 0;
        width: 100%;
      }
      .survey-save-status {
        color: var(--muted);
        font-size: 0.78rem;
        margin: -10px 0 0;
        text-align: right;
      }
      .survey-layout {
        align-items: start;
        display: grid;
        gap: 20px;
        grid-template-columns: minmax(0, 1fr) 290px;
      }
      .survey-layout.single {
        grid-template-columns: minmax(0, 760px);
      }
      .survey-main,
      .survey-sidebar,
      .survey-question,
      .survey-form-grid,
      .survey-matrix {
        display: grid;
        gap: 16px;
        min-width: 0;
      }
      .survey-sidebar {
        gap: 14px;
      }
      .survey-heading {
        font-size: clamp(1.45rem, 3vw, 2rem);
        margin: 0 0 6px;
      }
      .survey-subheading {
        line-height: 1.55;
        margin: 0;
      }
      .workflow-question {
        min-height: 520px;
        padding: clamp(18px, 3vw, 30px);
      }
      .workflow-panel-head,
      .survey-navigation {
        align-items: center;
        display: flex;
        gap: 14px;
        justify-content: space-between;
      }
      .survey-navigation {
        border-top: 1px solid var(--line);
        margin-top: 8px;
        padding-top: 18px;
      }
      .workflow-choice-grid,
      .survey-form-grid,
      .survey-matrix {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .workflow-choice-grid .button {
        justify-content: flex-start;
        line-height: 1.25;
        min-height: 54px;
        text-align: left;
        white-space: normal;
        width: 100%;
      }
      .survey-fieldset {
        border: 0;
        display: grid;
        gap: 12px;
        margin: 0;
        padding: 0;
      }
      .survey-fieldset legend,
      .survey-question label {
        color: var(--navy-950);
        font-size: 0.88rem;
        font-weight: 800;
        margin-bottom: 2px;
      }
      .survey-question-hint {
        color: var(--muted);
        font-size: 0.76rem;
        line-height: 1.4;
      }
      .survey-situations {
        gap: 22px;
      }
      .review-list {
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        overflow: hidden;
      }
      .review-row {
        display: grid;
        gap: 14px;
        padding: 14px 16px;
      }
      .review-row-head {
        align-items: center;
        display: flex;
        gap: 10px;
        justify-content: space-between;
      }
      .review-row-head h3 {
        font-size: 0.95rem;
        margin: 0;
      }
      .review-row + .review-row {
        border-top: 1px solid var(--line);
      }
      .review-row .button {
        justify-self: start;
      }
      .review-values {
        display: grid;
        gap: 0;
        margin: 0;
      }
      .review-values > div {
        display: grid;
        gap: 4px;
        grid-template-columns: minmax(150px, 0.65fr) minmax(0, 1fr);
        padding: 9px 0;
      }
      .review-values > div + div {
        border-top: 1px solid var(--line);
      }
      .review-values dt {
        color: var(--muted);
        font-size: 0.78rem;
        line-height: 1.45;
      }
      .review-values dd {
        color: var(--navy-950);
        font-size: 0.82rem;
        font-weight: 750;
        line-height: 1.45;
        margin: 0;
      }
      .survey-sidebar-label {
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        margin: 0 0 8px;
        text-transform: uppercase;
      }
      .survey-sidebar .muted {
        font-size: 0.86rem;
        line-height: 1.55;
        margin: 0;
      }
      .workflow-note,
      .survey-privacy-note {
        align-items: center;
        color: var(--muted);
        display: flex;
        font-size: 0.8rem;
        gap: 9px;
      }
      .workflow-symbol {
        align-items: center;
        background: var(--mint-100);
        border-radius: 999px;
        color: var(--mint-600);
        display: inline-flex;
        height: 52px;
        justify-content: center;
        width: 52px;
      }
      .workflow-result {
        min-width: 0;
        padding: clamp(22px, 4vw, 34px);
      }
      .workflow-result .pill {
        line-height: 1.35;
        max-width: 100%;
        white-space: normal;
      }
      .level-reveal {
        align-items: center;
        background: linear-gradient(145deg, #fff8e8, #ffffff);
        border: 1px solid #ffe0a0;
        border-radius: var(--radius);
        display: grid;
        gap: 18px;
        grid-template-columns: auto 1fr;
        padding: 18px;
      }
      .level-reveal-badge {
        align-items: center;
        background: var(--navy-950);
        border: 4px solid var(--gold-500);
        border-radius: 999px;
        color: white;
        display: inline-flex;
        font-size: 1.35rem;
        font-weight: 950;
        height: 84px;
        justify-content: center;
        width: 84px;
      }
      .level-reveal > div {
        min-width: 0;
      }
      @media (max-width: 900px) {
        .survey-layout {
          grid-template-columns: 1fr;
        }
        .survey-sidebar {
          display: none;
        }
      }
      @media (max-width: 640px) {
        .workflow-choice-grid,
        .survey-form-grid,
        .survey-matrix,
        .level-reveal {
          grid-template-columns: 1fr;
        }
        .workflow-panel-head,
        .review-row-head {
          align-items: stretch;
          display: grid;
        }
        .review-values > div {
          grid-template-columns: 1fr;
        }
        .survey-navigation {
          align-items: stretch;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 420px) {
        .survey-navigation {
          grid-template-columns: 1fr;
        }
        .survey-navigation .button {
          min-width: 0;
          white-space: normal;
          width: 100%;
        }
      }
    `}</style>
  );
}
