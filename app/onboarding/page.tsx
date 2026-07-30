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

const draftKey = "socra_onboarding_draft";

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
  const [loadedDraft, setLoadedDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());

  const scores = useMemo(() => estimateScores(answers), [answers]);
  const steps = useMemo(() => buildSteps(answers), [answers]);
  const safeStep = Math.min(step, steps.length - 1);
  const current = steps[safeStep];
  const progressPct = Math.round(((safeStep + 1) / steps.length) * 100);
  const progressStep = Math.min(4, Math.floor((safeStep / Math.max(steps.length - 1, 1)) * 5));

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const state = await clientGet<OnboardingState>("/surveys/onboarding/me");
        if (!active) return;
        if (state.latest_answer_id) {
          setCompleted(state);
          window.sessionStorage.removeItem(draftKey);
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

      const rawDraft = window.sessionStorage.getItem(draftKey);
      if (rawDraft) {
        try {
          const draft = JSON.parse(rawDraft) as SurveyDraft;
          setStep(draft.step);
          setAnswers(draft.answers || {});
        } catch {
          window.sessionStorage.removeItem(draftKey);
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
    if (step >= steps.length) setStep(Math.max(steps.length - 1, 0));
  }, [step, steps.length]);

  useEffect(() => {
    if (!loadedDraft || result || completed) return;
    const draft: SurveyDraft = {
      step: safeStep,
      scores,
      answers,
      dNeverInvested: answers.D1 === "none",
    };
    window.sessionStorage.setItem(draftKey, JSON.stringify(draft));
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
        .then(() => setDraftWarning(null))
        .catch(() => setDraftWarning("Salvataggio online temporaneamente non disponibile; la bozza resta su questo dispositivo."));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [answers, completed, loadedDraft, result, safeStep, scores]);

  function setExperience(key: "D1" | "D2" | "D5" | "D6", value: string) {
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
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      D3: { ...(currentAnswers.D3 || {}), [topic]: Number(value) },
    }));
  }

  function setKnowledge(concept: string, value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      D4: { ...(currentAnswers.D4 || {}), [concept]: Number(value) },
    }));
  }

  function setSituation(key: string, value: string) {
    setAnswers((currentAnswers) => ({ ...currentAnswers, [key]: value }));
  }

  function setContextAnswer(key: string, value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      section_d: { ...(currentAnswers.section_d || {}), [key]: value },
    }));
  }

  function next() {
    if (!isStepComplete(current, answers)) {
      setError("Completa le risposte richieste in questa sezione.");
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
      setError("La survey non è completa: rivedi le sezioni indicate.");
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
      window.sessionStorage.removeItem(draftKey);
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
            steps={["Esperienza", "Conoscenze", "Scenari", "Contesto", "Conferma"]}
            current={progressStep}
          />
        ) : null}

        {error ? <p className="error" role="alert">{error}</p> : null}
        {draftWarning ? <p className="muted" role="status">{draftWarning}</p> : null}

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
                      <h2>{STEP_META[current].title}</h2>
                    </div>
                    <span className="pill">{STEP_META[current].section}</span>
                  </div>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={progressPct}
                    aria-label="Avanzamento survey"
                  >
                    <span style={{ width: `${progressPct}%` }} />
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
                        disabled={!isStepComplete(current, answers)}
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
                  Il matching parte da livello, obiettivo e competenze. Non usiamo classifiche pubbliche né profili “guru”.
                </p>
              </Card>
              <Card className="workflow-panel">
                <p className="survey-sidebar-label">Avanzamento</p>
                <div className="survey-progress-bar" aria-hidden>
                  <div className="survey-progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <p style={{ color: "var(--mint-600)", fontWeight: 800, margin: "8px 0 0" }}>{progressPct}%</p>
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
  const rows = [
    { kind: "experience" as const, label: "Esperienza", value: answers.D1 === "none" ? "Nessun investimento precedente" : "Esperienza pratica compilata" },
    ...(steps.includes("instruments") ? [{ kind: "instruments" as const, label: "Strumenti", value: `${Object.keys(answers.D3 || {}).length} su ${instrumentOptions.length} valutati` }] : []),
    { kind: "knowledge" as const, label: "Conoscenze", value: `${Object.keys(answers.D4 || {}).length} su ${knowledgeConcepts.length} valutate` },
    ...(steps.includes("situations") ? [{ kind: "situations" as const, label: "Scenari", value: "3 situazioni completate" }] : []),
    {
      kind: "context" as const,
      label: "Contesto personale",
      value: `${Object.keys(answers.section_d || {}).length} su ${sectionDQuestions.length} risposte completate`,
    },
  ];
  return (
    <div className="stack">
      <p className="muted">
        Controlla le sezioni prima di confermare. Le risposte dettagliate resteranno private.
      </p>
      <div className="review-list">
        {rows.map((row) => (
          <div className="review-row" key={row.kind}>
            <div>
              <strong>{row.label}</strong>
              <p className="muted">{row.value}</p>
            </div>
            <button className="button secondary" type="button" onClick={() => onEdit(row.kind)}>Modifica</button>
          </div>
        ))}
      </div>
    </div>
  );
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
                ? "Puoi confermare o aggiornare il tuo obiettivo. Capitale e profilo di rischio restano privati."
                : "Ora definisci un obiettivo concreto. Capitale e profilo di rischio resteranno privati."}
            </p>
            <div className="cluster">
              <ButtonLink href="/goal">{alreadyCompleted ? "Gestisci obiettivo" : "Definisci il primo obiettivo"}</ButtonLink>
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
        max-width: 1100px;
        min-width: 0;
        width: 100%;
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
      .survey-navigation,
      .review-row {
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
        padding: 14px 16px;
      }
      .review-row + .review-row {
        border-top: 1px solid var(--line);
      }
      .review-row p {
        font-size: 0.82rem;
        margin: 3px 0 0;
      }
      .survey-page .progress,
      .survey-progress-bar {
        background: #e6edf1;
        border-radius: 999px;
        height: 8px;
        overflow: hidden;
      }
      .survey-page .progress span,
      .survey-progress-fill {
        background: linear-gradient(90deg, var(--mint-600), var(--gold-500));
        border-radius: 999px;
        display: block;
        height: 100%;
        transition: width 0.3s ease;
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
        .review-row {
          align-items: stretch;
          display: grid;
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
