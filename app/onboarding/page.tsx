"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ChevronLeft, LockKeyhole, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  TopicCompetenceStyles,
  TopicInvestmentStep,
  TopicKnowledgeStep,
  TopicMentoringStep,
  TopicReview,
  isMentorEligible,
  mentorChoiceIsComplete,
} from "@/components/TopicCompetenceMatrix";
import { ButtonLink, Card, ProgressSteps } from "@/components/Ui";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import {
  autonomyOptions,
  instrumentOptions,
  knowledgeConcepts,
  knowledgeOptions,
  sectionDQuestions,
  situationalQuestions,
  type SelectOption,
} from "@/lib/options";
import type {
  TopicCompetenceDraft,
  TopicCompetencePayload,
  TopicInvestmentBand,
  TopicKnowledgeLevel,
} from "@/lib/types";

const legacyDraftKey = "socra_onboarding_draft";
const draftKeyFor = (userId: string) => `${legacyDraftKey}:${userId}`;

type Answers = Record<string, unknown> & {
  D4?: Record<string, number>;
  D5?: string;
  D7?: string;
  D8?: string;
  D9?: string;
  section_d?: Record<string, string>;
  topic_competences_v2?: Record<string, TopicCompetenceDraft>;
};

type SubmittedAnswers = Omit<Answers, "topic_competences_v2"> & {
  topic_competences_v2: TopicCompetencePayload;
};

type OnboardingState = {
  user_id?: string;
  level: string;
  is_coach: boolean;
  latest_answer_id: string | null;
};

type SurveyResult = {
  total_score: number;
  derived_level: string;
  is_coach: boolean;
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

type StepKind =
  | "topicKnowledge"
  | "topicInvestment"
  | "topicMentoring"
  | "knowledge"
  | "situations"
  | "context"
  | "review";

const STEPS: StepKind[] = [
  "topicKnowledge",
  "topicInvestment",
  "topicMentoring",
  "knowledge",
  "situations",
  "context",
  "review",
];

const STEP_META: Record<StepKind, { title: string; progressTitle: string; section: string }> = {
  topicKnowledge: { title: "Conoscenza degli strumenti", progressTitle: "Conoscenza", section: "1" },
  topicInvestment: { title: "Esperienza diretta e importi", progressTitle: "Esperienza", section: "2" },
  topicMentoring: { title: "Disponibilità a condividere", progressTitle: "Mentorship", section: "3" },
  knowledge: { title: "Conoscenze di base", progressTitle: "Basi", section: "4" },
  situations: { title: "Scelte in situazioni concrete", progressTitle: "Scenari", section: "5" },
  context: { title: "Contesto personale", progressTitle: "Contesto", section: "6" },
  review: { title: "Rivedi e conferma", progressTitle: "Conferma", section: "Fine" },
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState<OnboardingState | null>(null);
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftWarning, setDraftWarning] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [loadedDraft, setLoadedDraft] = useState(false);
  const [draftStorageKey, setDraftStorageKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const saveQueue = useRef<Promise<unknown>>(Promise.resolve());
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const scores = useMemo(() => estimateDraftScores(answers), [answers]);
  const safeStep = Math.min(step, STEPS.length - 1);
  const current = STEPS[safeStep];
  const topics = answers.topic_competences_v2 || {};

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
          setAnswers(normalizeDraftAnswers(dbDraft.answers || {}));
          setStep(clampStep(dbDraft.current_step));
          setLoadedDraft(true);
          return;
        }
      } catch {
        if (active) setDraftWarning("Bozza online non disponibile: continuiamo a salvare su questo dispositivo.");
      }

      const rawDraft = resolvedDraftStorageKey ? window.sessionStorage.getItem(resolvedDraftStorageKey) : null;
      if (rawDraft) {
        try {
          const draft = JSON.parse(rawDraft) as SurveyDraft;
          setStep(clampStep(draft.step || 0));
          setAnswers(normalizeDraftAnswers(draft.answers || {}));
        } catch {
          if (resolvedDraftStorageKey) window.sessionStorage.removeItem(resolvedDraftStorageKey);
        }
      }
      if (active) setLoadedDraft(true);
    }

    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!loadedDraft || result || completed) return;
    const draft: SurveyDraft = {
      step: safeStep,
      scores,
      answers,
      dNeverInvested: allInvestmentBandsAreZero(answers),
    };
    if (draftStorageKey) window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
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

  function updateTopic(topic: string, patch: Partial<TopicCompetenceDraft>) {
    setError(null);
    setAnswers((currentAnswers) => {
      const currentTopics = currentAnswers.topic_competences_v2 || {};
      const currentTopic = currentTopics[topic] || {};
      const wasMentorEligible = isMentorEligible(currentTopic);
      const nextTopic = { ...currentTopic, ...patch };
      if (wasMentorEligible && !isMentorEligible(nextTopic)) {
        nextTopic.wants_to_mentor = false;
        delete nextTopic.safety_scenario_answer;
      }
      if (patch.wants_to_mentor === false) delete nextTopic.safety_scenario_answer;
      const nextAnswers: Answers = {
        ...currentAnswers,
        topic_competences_v2: { ...currentTopics, [topic]: nextTopic },
      };
      if (allInvestmentBandsAreZero(nextAnswers)) delete nextAnswers.D5;
      return nextAnswers;
    });
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

  function showValidationError(message: string) {
    setError(message);
    window.requestAnimationFrame(() => {
      errorRef.current?.focus();
      document.querySelector<HTMLElement>('[data-incomplete="true"] input:not(:disabled), [data-incomplete="true"] select')?.focus();
    });
  }

  function next() {
    if (!isStepComplete(current, answers)) {
      showValidationError(current === "topicMentoring"
        ? "Indica Sì o No per ogni strumento disponibile e completa gli eventuali scenari di sicurezza."
        : "Completa ogni risposta della sezione prima di continuare.");
      return;
    }
    setError(null);
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
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
      const response = await clientPost<SurveyResult>("/surveys/onboarding/me/answers", {
        section: "onboarding",
        answers: buildSubmittedAnswers(answers),
      });
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
          <ProgressSteps steps={STEPS.map((kind) => STEP_META[kind].progressTitle)} current={safeStep} />
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
                      Distinguiamo ciò che conosci dall’esperienza maturata con denaro reale, strumento per strumento.
                    </p>
                  </div>

                  <div className="workflow-panel-head">
                    <div>
                      <p className="eyebrow">Sezione {safeStep + 1} di {STEPS.length}</p>
                      <h2 ref={stepHeadingRef} tabIndex={-1}>{STEP_META[current].title}</h2>
                    </div>
                    <span className="pill">{STEP_META[current].section}</span>
                  </div>

                  {current === "topicKnowledge" ? (
                    <TopicKnowledgeStep answers={topics} onChange={(topic, value: TopicKnowledgeLevel) => updateTopic(topic, { knowledge_level: value })} />
                  ) : current === "topicInvestment" ? (
                    <TopicInvestmentStep answers={topics} onChange={(topic, value: TopicInvestmentBand) => updateTopic(topic, { invested_amount_band: value })} />
                  ) : current === "topicMentoring" ? (
                    <TopicMentoringStep
                      answers={topics}
                      onChange={(topic, value) => updateTopic(topic, { wants_to_mentor: value })}
                      onSafetyChange={(topic, value) => updateTopic(topic, { safety_scenario_answer: value })}
                    />
                  ) : current === "knowledge" ? (
                    <GeneralKnowledgeStep answers={answers} onChange={setKnowledge} />
                  ) : current === "situations" ? (
                    <SituationsStep
                      answers={answers}
                      skipAutonomy={allInvestmentBandsAreZero(answers)}
                      onChange={setSituation}
                    />
                  ) : current === "context" ? (
                    <ContextStep answers={answers.section_d || {}} onChange={setContextAnswer} />
                  ) : (
                    <ReviewStep answers={answers} onEdit={(kind) => setStep(STEPS.indexOf(kind))} />
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
                      <button className="button primary" type="button" onClick={next}>Continua</button>
                    )}
                  </div>
                </div>
              </Card>

              <div className="survey-privacy-note">
                <ShieldCheck size={15} aria-hidden />
                <span>Le fasce investite e il contesto personale restano privati e non vengono mostrati ad altri utenti.</span>
              </div>
            </div>

            <aside className="survey-sidebar">
              <Card className="workflow-panel">
                <p className="survey-sidebar-label">Perché questa survey?</p>
                <p className="muted">
                  Conoscere uno strumento e averlo usato sono esperienze diverse. Considerarle separatamente rende i confronti più coerenti.
                </p>
              </Card>
              <Card className="workflow-panel workflow-note">
                <LockKeyhole size={18} aria-hidden />
                <p>Nessuna risposta è preselezionata. Puoi tornare indietro prima dell’invio finale.</p>
              </Card>
            </aside>
          </div>
        )}
        <TopicCompetenceStyles />
        <SurveyStyles />
      </div>
    </AppShell>
  );
}

function GeneralKnowledgeStep({ answers, onChange }: { answers: Answers; onChange: (key: string, value: string) => void }) {
  return (
    <div className="stack">
      <p className="muted">Ora guardiamo alcuni concetti che attraversano più strumenti.</p>
      <div className="survey-matrix survey-form-grid">
        {knowledgeConcepts.map((concept) => (
          <QuestionSelect
            key={concept.value}
            id={`knowledge-${concept.value}`}
            label={concept.label}
            options={knowledgeOptions}
            value={answers.D4?.[concept.value] === undefined ? undefined : String(answers.D4[concept.value])}
            onChange={(value) => onChange(concept.value, value)}
          />
        ))}
      </div>
    </div>
  );
}

function SituationsStep({
  answers,
  skipAutonomy,
  onChange,
}: {
  answers: Answers;
  skipAutonomy: boolean;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="stack survey-situations">
      <p className="muted">Non cerchiamo la risposta perfetta: scegli quella che descrive meglio come ragioneresti.</p>
      {skipAutonomy ? (
        <div className="survey-not-applicable" role="note">
          <strong>Autonomia nelle decisioni</strong>
          <span>Hai indicato 0 € per tutti gli strumenti: questa domanda non serve nel tuo caso.</span>
        </div>
      ) : (
        <QuestionSelect
          id="experience-autonomy"
          label="Quando investi, come prendi le decisioni?"
          options={autonomyOptions}
          value={answers.D5}
          onChange={(value) => onChange("D5", value)}
          hint="Ci interessa distinguere l’esperienza diretta dalle operazioni eseguite seguendo completamente qualcun altro."
        />
      )}
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

function ContextStep({ answers, onChange }: { answers: Record<string, string>; onChange: (key: string, value: string) => void }) {
  return (
    <div className="stack">
      <p className="muted">
        Questa sezione fa parte della survey ma non cambia livello o matching. Per ogni domanda puoi scegliere
        “Preferisco non rispondere”. Le risposte condivise restano private e sono usate solo in forma aggregata.
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

function ReviewStep({ answers, onEdit }: { answers: Answers; onEdit: (kind: StepKind) => void }) {
  const skipAutonomy = allInvestmentBandsAreZero(answers);
  const sections = [
    {
      kind: "knowledge" as const,
      label: "Conoscenze di base",
      items: knowledgeConcepts.map((concept) => ({
        label: concept.label,
        value: optionLabel(knowledgeOptions, String(answers.D4?.[concept.value] ?? "")),
      })),
    },
    {
      kind: "situations" as const,
      label: "Scenari",
      items: [
        ...(!skipAutonomy
          ? [{ label: "Come prendi le decisioni", value: optionLabel(autonomyOptions, answers.D5) }]
          : []),
        ...situationalQuestions.map((question) => ({
          label: question.prompt,
          value: optionLabel(question.options, answers[question.key] as string | undefined),
        })),
      ],
    },
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
        Controlla le risposte prima dell’invio. La classificazione iniziale è one-shot; la disponibilità alla mentorship potrà essere aggiornata in seguito.
      </p>
      <TopicReview
        answers={answers.topic_competences_v2 || {}}
        onEdit={(section) => onEdit(section === "knowledge" ? "topicKnowledge" : section === "investment" ? "topicInvestment" : "topicMentoring")}
      />
      <div className="review-list">
        {sections.map((section) => (
          <section className="review-row" key={section.kind} aria-labelledby={`review-${section.kind}`}>
            <div className="review-row-head">
              <h3 id={`review-${section.kind}`}>{section.label}</h3>
              {section.kind === "context" ? <span className="pill">Privato</span> : null}
            </div>
            <dl className="review-values">
              {section.items.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
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
    <div className="survey-question" data-incomplete={value ? undefined : "true"}>
      <label htmlFor={id}>{label}</label>
      {hint ? <span className="survey-question-hint">{hint}</span> : null}
      <select id={id} name={id} className="input" value={value || ""} onChange={(event) => onChange(event.target.value)} required>
        <option value="">Seleziona una risposta</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

function ResultCard({ level, isCoach, alreadyCompleted = false }: { level: string; isCoach: boolean; alreadyCompleted?: boolean }) {
  const copy: Record<string, { title: string; description: string }> = {
    L0: { title: "Primi passi", description: "Partirai da obiettivi introduttivi con un mentor compatibile." },
    L1: { title: "Basi operative", description: "Hai già un’esperienza concreta su almeno uno strumento." },
    L2: { title: "Esperienza avanzata", description: "Hai maturato conoscenza ed esperienza concreta su almeno uno strumento." },
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
                {isCoach ? <span className="pill green">Disponibilità mentor attiva su uno o più strumenti</span> : null}
              </div>
            </div>
            <p className="muted">
              {alreadyCompleted
                ? "Puoi aggiornare ciò che vuoi imparare. Il tuo contesto di partenza resta privato."
                : "Ora scegli cosa vuoi imparare con l’aiuto della community. Il tuo contesto di partenza resterà privato."}
            </p>
            <div className="cluster">
              <ButtonLink href="/goal">{alreadyCompleted ? "Gestisci obiettivo" : "Scegli cosa imparare"}</ButtonLink>
              {alreadyCompleted ? <ButtonLink href="/dashboard" variant="secondary">Dashboard</ButtonLink> : null}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function isStepComplete(step: StepKind, answers: Answers): boolean {
  const topics = answers.topic_competences_v2 || {};
  const topicKnowledgeComplete = instrumentOptions.every((item) => !!topics[item.value]?.knowledge_level);
  const investmentComplete = instrumentOptions.every((item) => !!topics[item.value]?.invested_amount_band);
  const mentoringComplete = instrumentOptions.every((item) => (
    !isMentorEligible(topics[item.value]) || mentorChoiceIsComplete(item.value, topics[item.value])
  ));
  const knowledgeComplete = knowledgeConcepts.every((concept) => answers.D4?.[concept.value] !== undefined);
  const situationsComplete = (allInvestmentBandsAreZero(answers) || !!answers.D5)
    && situationalQuestions.every((question) => !!answers[question.key]);
  const contextComplete = sectionDQuestions.every((question) => !!answers.section_d?.[question.key]);

  if (step === "topicKnowledge") return topicKnowledgeComplete;
  if (step === "topicInvestment") return investmentComplete;
  if (step === "topicMentoring") return mentoringComplete;
  if (step === "knowledge") return knowledgeComplete;
  if (step === "situations") return situationsComplete;
  if (step === "context") return contextComplete;
  return topicKnowledgeComplete && investmentComplete && mentoringComplete
    && knowledgeComplete && situationsComplete && contextComplete;
}

function optionLabel(options: SelectOption[], value?: string): string {
  if (!value) return "Da completare";
  return options.find((option) => option.value === value)?.label || value;
}

function optionScore(options: SelectOption[], value?: string): number {
  return Number(options.find((option) => option.value === value)?.score || 0);
}

function estimateDraftScores(answers: Answers): { A: number; B: number; C: number } {
  const topics = answers.topic_competences_v2 || {};
  const A = instrumentOptions.filter((item) => !!topics[item.value]?.knowledge_level).length;
  const B = instrumentOptions.filter((item) => {
    const amount = topics[item.value]?.invested_amount_band;
    return !!amount && amount !== "A0";
  }).length;
  const C = situationalQuestions.reduce(
    (total, question) => total + optionScore(question.options, answers[question.key] as string | undefined),
    0
  );
  return { A, B, C };
}

function allInvestmentBandsAreZero(answers: Answers): boolean {
  const topics = answers.topic_competences_v2 || {};
  return instrumentOptions.every((item) => topics[item.value]?.invested_amount_band === "A0");
}

function buildSubmittedAnswers(answers: Answers): SubmittedAnswers {
  const topics = answers.topic_competences_v2 || {};
  const instruments = instrumentOptions.map((item) => {
    const answer = topics[item.value];
    if (!answer?.knowledge_level || !answer.invested_amount_band) throw new Error(`Risposta incompleta per ${item.value}`);
    return {
      topic: item.value,
      knowledge_level: answer.knowledge_level,
      invested_amount_band: answer.invested_amount_band,
      wants_to_mentor: isMentorEligible(answer) && answer.wants_to_mentor === true,
      safety_scenario_answer: answer.safety_scenario_answer || null,
    };
  });
  const rest: Answers = { ...answers };
  delete rest.topic_competences_v2;
  if (allInvestmentBandsAreZero(answers)) delete rest.D5;
  return { ...rest, topic_competences_v2: { instruments } };
}

function normalizeDraftAnswers(answers: Answers): Answers {
  const rawTopics = answers.topic_competences_v2;
  if (!rawTopics || Array.isArray(rawTopics)) return { ...answers, topic_competences_v2: {} };
  const normalized = { ...answers };
  if (allInvestmentBandsAreZero(normalized)) delete normalized.D5;
  return normalized;
}

function clampStep(value: number): number {
  return Math.min(Math.max(value, 0), STEPS.length - 1);
}

function SurveyStyles() {
  return (
    <style jsx global>{`
      .survey-page { display: grid; gap: 20px; margin-inline: auto; max-width: 1240px; min-width: 0; width: 100%; }
      .survey-save-status { color: var(--muted); font-size: 0.78rem; margin: -10px 0 0; text-align: right; }
      .survey-layout { align-items: start; display: grid; gap: 20px; grid-template-columns: minmax(0, 1fr) 280px; }
      .survey-layout.single { grid-template-columns: minmax(0, 760px); }
      .survey-main,
      .survey-sidebar,
      .survey-question,
      .survey-form-grid,
      .survey-matrix { display: grid; gap: 16px; min-width: 0; }
      .survey-sidebar { gap: 14px; }
      .survey-not-applicable {
        background: var(--surface-soft, #f5f7f6);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
        color: var(--muted);
        display: grid;
        font-size: 0.9rem;
        gap: 4px;
        line-height: 1.5;
        padding: 14px 16px;
      }
      .survey-not-applicable strong { color: var(--ink); }
      .survey-heading { font-size: clamp(1.45rem, 3vw, 2rem); margin: 0 0 6px; }
      .survey-subheading { line-height: 1.55; margin: 0; }
      .workflow-question { min-height: 600px; padding: clamp(18px, 3vw, 30px); }
      .workflow-panel-head,
      .survey-navigation { align-items: center; display: flex; gap: 14px; justify-content: space-between; }
      .survey-navigation { border-top: 1px solid var(--line); margin-top: 8px; padding-top: 18px; }
      .survey-form-grid,
      .survey-matrix { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .survey-question label { color: var(--navy-950); font-size: 0.88rem; font-weight: 800; margin-bottom: 2px; }
      .survey-question-hint { color: var(--muted); font-size: 0.76rem; line-height: 1.4; }
      .survey-situations { gap: 22px; }
      .review-list { border: 1px solid var(--line); border-radius: var(--radius-sm); overflow: hidden; }
      .review-row { display: grid; gap: 14px; padding: 14px 16px; }
      .review-list > .review-row + .review-row { border-top: 1px solid var(--line); }
      .review-row-head { align-items: center; display: flex; gap: 10px; justify-content: space-between; }
      .review-row-head h3 { font-size: 0.95rem; margin: 0; }
      .review-row > .button { justify-self: start; }
      .review-values { display: grid; gap: 0; margin: 0; }
      .review-values > div { display: grid; gap: 4px; grid-template-columns: minmax(150px, 0.65fr) minmax(0, 1fr); padding: 9px 0; }
      .review-values > div + div { border-top: 1px solid var(--line); }
      .review-values dt { color: var(--muted); font-size: 0.78rem; line-height: 1.45; }
      .review-values dd { color: var(--navy-950); font-size: 0.82rem; font-weight: 750; line-height: 1.45; margin: 0; }
      .survey-sidebar-label { color: var(--muted); font-size: 0.72rem; font-weight: 900; letter-spacing: 0.08em; margin: 0 0 8px; text-transform: uppercase; }
      .survey-sidebar .muted { font-size: 0.86rem; line-height: 1.55; margin: 0; }
      .workflow-note,
      .survey-privacy-note { align-items: center; color: var(--muted); display: flex; font-size: 0.8rem; gap: 9px; }
      .workflow-symbol { align-items: center; background: var(--mint-100); border-radius: 999px; color: var(--mint-600); display: inline-flex; height: 52px; justify-content: center; width: 52px; }
      .workflow-result { min-width: 0; padding: clamp(22px, 4vw, 34px); }
      .workflow-result .pill { line-height: 1.35; max-width: 100%; white-space: normal; }
      .level-reveal { align-items: center; background: linear-gradient(145deg, #fff8e8, #ffffff); border: 1px solid #ffe0a0; border-radius: var(--radius); display: grid; gap: 18px; grid-template-columns: auto 1fr; padding: 18px; }
      .level-reveal-badge { align-items: center; background: var(--navy-950); border: 4px solid var(--gold-500); border-radius: 999px; color: white; display: inline-flex; font-size: 1.35rem; font-weight: 950; height: 84px; justify-content: center; width: 84px; }
      .level-reveal > div { min-width: 0; }
      @media (max-width: 1050px) {
        .survey-layout { grid-template-columns: 1fr; }
        .survey-sidebar { display: none; }
      }
      @media (max-width: 640px) {
        .survey-form-grid,
        .survey-matrix,
        .level-reveal { grid-template-columns: 1fr; }
        .workflow-panel-head,
        .review-row-head { align-items: stretch; display: grid; }
        .review-values > div { grid-template-columns: 1fr; }
        .survey-navigation { align-items: stretch; display: grid; grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 420px) {
        .survey-navigation { grid-template-columns: 1fr; }
        .survey-navigation .button { min-width: 0; white-space: normal; width: 100%; }
      }
    `}</style>
  );
}
