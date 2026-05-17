"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, LockKeyhole, Shield, ShieldCheck } from "lucide-react";
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
  type SelectOption
} from "@/lib/options";

const draftKey = "socra_onboarding_draft";

type Answers = Record<string, unknown> & {
  D1?: string;
  D2?: string;
  D3?: Record<string, number>;
  D4?: Record<string, number>;
  D5?: string;
  D6?: string;
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
  includeD: boolean;
  dNeverInvested: boolean;
};

type SurveyDraftResponse = {
  current_step: number;
  scores: { A?: number; B?: number; C?: number };
  answers: Answers;
  include_section_d: boolean;
  d_never_invested: boolean;
};

type Page =
  | { kind: "choice"; key: keyof Answers; title: string; prompt: string; section: string; options: SelectOption[] }
  | { kind: "instrument"; topic: string; title: string }
  | { kind: "knowledge"; concept: string; title: string }
  | { kind: "sectionDIntro" }
  | { kind: "sectionD"; key: string; title: string; options: SelectOption[] }
  | { kind: "review" };

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [includeD, setIncludeD] = useState(false);
  const [completed, setCompleted] = useState<OnboardingState | null>(null);
  const [result, setResult] = useState<{ total_score: number; derived_level: string; is_coach: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadedDraft, setLoadedDraft] = useState(false);

  const scores = useMemo(() => estimateScores(answers), [answers]);
  const pages = useMemo(() => buildPages(answers, includeD), [answers, includeD]);
  const current = pages[Math.min(step, pages.length - 1)];

  useEffect(() => {
    let cancelled = false;
    async function loadState() {
      try {
        const state = await clientGet<OnboardingState>("/surveys/onboarding/me");
        if (cancelled) return;
        if (state.latest_answer_id) {
          setCompleted(state);
          window.sessionStorage.removeItem(draftKey);
          setLoadedDraft(true);
          return;
        }
      } catch {
        // Draft loading below still allows the gate-driven first onboarding flow to recover.
      }
      await loadDraft(cancelled);
    }
    loadState();
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadDraft(cancelled: boolean) {
    try {
      const dbDraft = await clientGet<SurveyDraftResponse | null>("/surveys/onboarding/me/draft");
      if (cancelled) return;
      if (dbDraft) {
        setStep(dbDraft.current_step);
        setAnswers(dbDraft.answers || {});
        setIncludeD(dbDraft.include_section_d);
        setLoadedDraft(true);
        return;
      }
    } catch {
      // Local fallback below keeps the form usable if draft loading is temporarily unavailable.
    }
    const rawDraft = window.sessionStorage.getItem(draftKey);
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft) as SurveyDraft;
        setStep(draft.step);
        setAnswers(draft.answers || {});
        setIncludeD(draft.includeD);
      } catch {
        window.sessionStorage.removeItem(draftKey);
      }
    }
    setLoadedDraft(true);
  }

  useEffect(() => {
    if (step >= pages.length) {
      setStep(Math.max(pages.length - 1, 0));
    }
  }, [pages.length, step]);

  useEffect(() => {
    if (!loadedDraft || result || completed) return;
    persistDraft({ step, scores, answers, includeD, dNeverInvested: answers.D1 === "none" });
  }, [answers, completed, includeD, loadedDraft, result, scores, step]);

  function choose(key: keyof Answers, value: string) {
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
    advance();
  }

  function chooseInstrument(topic: string, value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      D3: { ...(currentAnswers.D3 || {}), [topic]: Number(value) }
    }));
    advance();
  }

  function chooseKnowledge(concept: string, value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      D4: { ...(currentAnswers.D4 || {}), [concept]: Number(value) }
    }));
    advance();
  }

  function chooseSectionD(key: string, value: string) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      section_d: { ...(currentAnswers.section_d || {}), [key]: value }
    }));
    advance();
  }

  function advance() {
    setStep((currentStep) => Math.min(currentStep + 1, pages.length - 1));
  }

  async function submit() {
    setError(null);
    try {
      const response = await clientPost<{ total_score: number; derived_level: string; is_coach: boolean }>("/surveys/onboarding/me/answers", {
        section: "onboarding",
        answers: buildSubmittedAnswers(answers, includeD)
      });
      window.sessionStorage.removeItem(draftKey);
      setResult(response);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Survey non salvata");
    }
  }

  const mockupStep = Math.min(4, Math.floor((step / Math.max(pages.length - 1, 1)) * 5));
  const progressPct = Math.round((step / Math.max(pages.length - 1, 1)) * 100);

  return (
    <AppShell>
      <div className="survey-page">
        {/* Progress steps bar — nascosta se survey completata */}
        {!completed && !result && (
          <ProgressSteps
            steps={["Su di te", "Obiettivo", "Contesto", "Preferenze", "Conferma"]}
            current={mockupStep}
          />
        )}

        {error ? <p className="error">{error}</p> : null}

        {completed ? (
          <div className="survey-layout">
            <div className="survey-main">
              <Card className="workflow-panel workflow-result">
                <div className="stack">
                  <span className="workflow-symbol"><CheckCircle2 size={26} aria-hidden /></span>
                  <h2>Survey completata</h2>
                  <h3>Livello {completed.level}</h3>
                  <p className="muted">Livello corrente: {completed.level}</p>
                  <p className="muted">
                    La survey iniziale e gia stata salvata. Per questa versione non puo essere ricompilata liberamente.
                  </p>
                  <div className="cluster">
                    <ButtonLink href="/goal">Definisci obiettivo</ButtonLink>
                    <ButtonLink href="/dashboard" variant="secondary">Vai alla dashboard</ButtonLink>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : result ? (
          <div className="survey-layout">
            <div className="survey-main">
              <Card className="workflow-panel workflow-result">
                <div className="stack">
                  <span className="workflow-symbol"><CheckCircle2 size={26} aria-hidden /></span>
                  <p className="eyebrow">Risultato</p>
                  <h2>Livello {result.derived_level}</h2>
                  <p className="muted">
                    Score: {result.total_score}. {result.is_coach ? "Puoi ricevere richieste come mentor." : "Parti come mentee."}
                  </p>
                  <ButtonLink href="/goal">Definisci obiettivo</ButtonLink>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="survey-layout">
            {/* Form principale */}
            <div className="survey-main">
              <Card className="workflow-panel workflow-question survey-card">
                <div className="stack">
                  <div className="survey-intro">
                    <h1 className="survey-heading">Troviamo il mentor giusto per te</h1>
                    <p className="muted survey-subheading">
                      Rispondi a poche domande per aiutarci a capire i tuoi obiettivi e il contesto.
                      In questo modo potremo offrirti i migliori mentor per il tuo percorso.
                    </p>
                  </div>
                  <div className="workflow-panel-head">
                    <div>
                      <p className="eyebrow">Step {Math.min(step + 1, pages.length)} di {pages.length}</p>
                      <h2>{pageTitle(current)}</h2>
                    </div>
                    <span className="pill">{pageSection(current)}</span>
                  </div>
                  <div className="progress" aria-hidden>
                    <span style={{ width: `${((Math.min(step + 1, pages.length)) / pages.length) * 100}%` }} />
                  </div>
                  {renderPage(current, { choose, chooseInstrument, chooseKnowledge, chooseSectionD, setIncludeD, advance, submit })}
                </div>
              </Card>

              {/* Nota sicurezza e privacy */}
              <div className="survey-privacy-note">
                <Shield size={14} aria-hidden />
                <span>Le tue risposte sono private e protette. Solo informazioni necessarie per il matching.</span>
              </div>
            </div>

            {/* Sidebar destra */}
            <aside className="survey-sidebar">
              <Card className="workflow-panel">
                <p className="survey-sidebar-label">Perché questa survey?</p>
                <p className="muted" style={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                  Offriamo le migliori opportunità di apprendimento a chi sa esattamente dove vuole
                  arrivare. La survey ci aiuta a trovare il mentor più adatto a te.
                </p>
              </Card>

              <Card className="workflow-panel">
                <p className="survey-sidebar-label">Il tuo progresso</p>
                <div className="survey-progress-bar">
                  <div
                    className="survey-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p style={{ color: "var(--mint-600)", fontWeight: 800, marginTop: "8px", fontSize: "1.1rem" }}>
                  {progressPct}% completato
                </p>
              </Card>

              <Card className="workflow-panel workflow-privacy">
                <div className="cluster">
                  <span className="icon-disc"><ShieldCheck size={20} aria-hidden /></span>
                  <div>
                    <strong>Le tue risposte sono private</strong>
                    <p className="muted">Servono per livello, branching e matching. Il backend resta autorevole.</p>
                  </div>
                </div>
              </Card>

              <Card className="workflow-panel survey-help-card">
                <p className="survey-sidebar-label">Hai bisogno di aiuto?</p>
                <p className="muted" style={{ fontSize: "0.875rem" }}>
                  Se hai dubbi su una domanda, puoi saltarla e tornarci dopo.
                </p>
                <button type="button" className="button secondary" style={{ marginTop: "12px", fontSize: "0.8rem" }}>
                  Contattaci
                </button>
              </Card>

              <Card className="workflow-panel workflow-note">
                <LockKeyhole size={18} aria-hidden />
                <p>Una domanda alla volta, nessuna risposta preselezionata.</p>
              </Card>
            </aside>
          </div>
        )}

        <WorkflowStyles />
      </div>
    </AppShell>
  );
}

function buildPages(answers: Answers, includeD: boolean): Page[] {
  const pages: Page[] = [
    {
      kind: "choice",
      key: "D1",
      section: "A",
      title: "Esperienza pratica",
      prompt: "Hai mai investito denaro in strumenti finanziari?",
      options: practiceOptions
    }
  ];
  if (answers.D1 && answers.D1 !== "none") {
    pages.push({
      kind: "choice",
      key: "D2",
      section: "A",
      title: "Tempo di esperienza",
      prompt: "Da quanto tempo investi?",
      options: durationOptions
    });
    for (const instrument of instrumentOptions) {
      pages.push({ kind: "instrument", topic: instrument.value, title: instrument.label });
    }
  }
  if (answers.D1) {
    for (const concept of knowledgeConcepts) {
      pages.push({ kind: "knowledge", concept: concept.value, title: concept.label });
    }
  }
  if (answers.D1 && answers.D1 !== "none") {
    pages.push({
      kind: "choice",
      key: "D5",
      section: "B",
      title: "Metodo decisionale",
      prompt: "Come prendi le tue decisioni di investimento?",
      options: autonomyOptions
    });
    pages.push({
      kind: "choice",
      key: "D6",
      section: "B",
      title: "Capitale investito",
      prompt: "Ordine di grandezza del capitale investito complessivamente?",
      options: investedCapitalOptions
    });
  }
  if (allKnowledgeAnswered(answers)) {
    pages.push({ kind: "sectionDIntro" });
    if (includeD) {
      for (const question of sectionDQuestions) {
        pages.push({ kind: "sectionD", key: question.key, title: question.label, options: question.options });
      }
    }
  }
  if (allKnowledgeAnswered(answers) && estimateScores(answers).A + estimateScores(answers).B > 10) {
    for (const question of situationalQuestions) {
      pages.push({
        kind: "choice",
        key: question.key as keyof Answers,
        section: "C",
        title: question.title,
        prompt: question.prompt,
        options: question.options
      });
    }
  }
  pages.push({ kind: "review" });
  return pages;
}

function renderPage(
  page: Page,
  actions: {
    choose: (key: keyof Answers, value: string) => void;
    chooseInstrument: (topic: string, value: string) => void;
    chooseKnowledge: (concept: string, value: string) => void;
    chooseSectionD: (key: string, value: string) => void;
    setIncludeD: (value: boolean) => void;
    advance: () => void;
    submit: () => void;
  }
) {
  if (page.kind === "choice") {
    return <ChoicePage prompt={page.prompt} options={page.options} onChoose={(value) => actions.choose(page.key, value)} />;
  }
  if (page.kind === "instrument") {
    return <ChoicePage prompt="Indica il tuo livello di esperienza su questo strumento." options={instrumentDepthOptions} onChoose={(value) => actions.chooseInstrument(page.topic, value)} />;
  }
  if (page.kind === "knowledge") {
    return <ChoicePage prompt="Quanto ti senti sicuro/a su questo concetto?" options={knowledgeOptions} onChoose={(value) => actions.chooseKnowledge(page.concept, value)} />;
  }
  if (page.kind === "sectionDIntro") {
    return (
      <>
        <p className="muted">Le prossime domande non cambiano il livello e sono opzionali.</p>
        <div className="workflow-choice-grid">
          <button className="button secondary" type="button" onClick={() => { actions.setIncludeD(false); actions.advance(); }}>Salta questa sezione</button>
          <button className="button primary" type="button" onClick={() => { actions.setIncludeD(true); actions.advance(); }}>Compila sezione D</button>
        </div>
      </>
    );
  }
  if (page.kind === "sectionD") {
    return <ChoicePage prompt="Seleziona una risposta. Puoi scegliere Preferisco non rispondere." options={page.options} onChoose={(value) => actions.chooseSectionD(page.key, value)} />;
  }
  return (
    <>
      <p className="muted">Il backend calcolera Score_A, Score_B, Score_C e livello massimo L2.</p>
      <button className="button primary" type="button" onClick={actions.submit}>Salva livello</button>
    </>
  );
}

function ChoicePage({ prompt, options, onChoose }: { prompt: string; options: SelectOption[]; onChoose: (value: string) => void }) {
  return (
    <>
      <p>{prompt}</p>
      <p className="muted">Seleziona una risposta.</p>
      <div className="workflow-choice-grid">
        {options.map((option) => (
          <button key={option.value} className="button secondary" type="button" onClick={() => onChoose(option.value)}>
            {option.label}
          </button>
        ))}
      </div>
    </>
  );
}

function ProgressRow({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="row">
      <span className="cluster">
        {done ? <CheckCircle2 size={16} color="#22a06b" /> : <ClipboardList size={16} color={active ? "#ef8d24" : "#8994aa"} />}
        <strong>{label}</strong>
      </span>
      {active ? <span className="pill amber">Ora</span> : done ? <span className="pill green">Fatto</span> : <span className="pill">In arrivo</span>}
    </div>
  );
}

function pageTitle(page: Page): string {
  if (page.kind === "choice") return page.title;
  if (page.kind === "instrument") return page.title;
  if (page.kind === "knowledge") return page.title;
  if (page.kind === "sectionDIntro") return "Sezione D opzionale";
  if (page.kind === "sectionD") return page.title;
  return "Conferma survey";
}

function pageSection(page: Page): string {
  if (page.kind === "choice") return page.section;
  if (page.kind === "instrument") return "A";
  if (page.kind === "knowledge") return "B";
  if (page.kind === "sectionDIntro" || page.kind === "sectionD") return "D";
  return "Fine";
}

function optionScore(options: SelectOption[], value?: string): number {
  return Number(options.find((option) => option.value === value)?.score || 0);
}

function allKnowledgeAnswered(answers: Answers): boolean {
  return knowledgeConcepts.every((concept) => answers.D4 && answers.D4[concept.value] !== undefined);
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

function buildSubmittedAnswers(answers: Answers, includeD: boolean): Answers {
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
  if (!includeD) {
    delete next.section_d;
  }
  return next;
}

function persistDraft(draft: SurveyDraft): void {
  window.sessionStorage.setItem(draftKey, JSON.stringify(draft));
  clientPost("/surveys/onboarding/me/draft", {
    current_step: draft.step,
    scores: draft.scores,
    answers: draft.answers,
    include_section_d: draft.includeD,
    d_never_invested: draft.dNeverInvested
  }).catch(() => undefined);
}

function WorkflowStyles() {
  return (
    <style jsx global>{`
      /* ── Survey page layout ── */
      .survey-page {
        display: grid;
        gap: 20px;
        max-width: 1100px;
      }

      .survey-layout {
        align-items: start;
        display: grid;
        gap: 20px;
        grid-template-columns: 1fr 300px;
      }

      .survey-main {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .survey-card {
        display: grid;
        gap: 20px;
      }

      .survey-intro {
        display: grid;
        gap: 8px;
      }

      .survey-heading {
        font-size: clamp(1.35rem, 3vw, 1.7rem);
        margin: 0;
      }

      .survey-subheading {
        line-height: 1.55;
        margin: 0;
      }

      .survey-sidebar {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .survey-sidebar-label {
        color: var(--muted);
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        margin: 0 0 10px;
        text-transform: uppercase;
      }

      .survey-privacy-note {
        align-items: center;
        color: var(--muted);
        display: flex;
        font-size: 0.8rem;
        gap: 8px;
      }

      .survey-progress-bar {
        background: var(--line);
        border-radius: 999px;
        height: 8px;
        overflow: hidden;
      }

      .survey-progress-fill {
        background: linear-gradient(90deg, var(--mint-600), var(--gold-500));
        border-radius: 999px;
        height: 100%;
        transition: width 0.3s ease;
      }

      .survey-help-card {
        display: grid;
        gap: 4px;
      }

      /* ── Workflow shared ── */
      .workflow-panel {
        background: rgba(255, 255, 255, 0.96);
      }

      .workflow-question {
        min-height: 480px;
        padding: clamp(18px, 3vw, 30px);
      }

      .workflow-panel-head {
        align-items: start;
        display: flex;
        gap: 14px;
        justify-content: space-between;
      }

      .workflow-choice-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .workflow-choice-grid .button {
        justify-content: flex-start;
        min-height: 56px;
        text-align: left;
        width: 100%;
      }

      .survey-page .progress {
        background: #e6edf1;
        border-radius: 999px;
        height: 8px;
      }

      .survey-page .progress span {
        background: linear-gradient(90deg, var(--gold-500, #d6ad5d), var(--mint-600, #0f766e));
        border-radius: 999px;
        display: block;
        height: 100%;
        transition: width 0.3s ease;
      }

      .workflow-privacy {
        background: linear-gradient(145deg, #fff9ea, #ffffff);
      }

      .workflow-note {
        align-items: center;
        color: #475467;
        display: flex;
        gap: 10px;
      }

      .workflow-symbol {
        align-items: center;
        background: #dcfce7;
        border: 1px solid #bbf7d0;
        border-radius: 999px;
        color: #15803d;
        display: inline-flex;
        height: 52px;
        justify-content: center;
        width: 52px;
      }

      .workflow-result {
        max-width: 760px;
        padding: clamp(22px, 4vw, 34px);
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
        .workflow-choice-grid {
          grid-template-columns: 1fr;
        }

        .workflow-panel-head {
          display: grid;
        }
      }
    `}</style>
  );
}
