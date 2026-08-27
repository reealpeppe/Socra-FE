"use client";

import {
  instrumentOptions,
  topicInvestmentOptions,
  topicKnowledgeOptions,
} from "@/lib/options";
import type {
  TopicCompetenceDraft,
  TopicInvestmentBand,
  TopicKnowledgeLevel,
} from "@/lib/types";

type TopicAnswers = Record<string, TopicCompetenceDraft>;

type MatrixOption = {
  value: string;
  label: string;
  shortLabel: string;
  description?: string;
};

export function TopicKnowledgeStep({
  answers,
  onChange,
}: {
  answers: TopicAnswers;
  onChange: (topic: string, value: TopicKnowledgeLevel) => void;
}) {
  const values = Object.fromEntries(
    instrumentOptions.map((item) => [item.value, answers[item.value]?.knowledge_level])
  );
  const completed = Object.values(values).filter(Boolean).length;

  return (
    <div className="stack topic-step">
      <div>
        <p className="topic-question">Quanto conosci ciascuno di questi strumenti?</p>
        <p className="muted topic-intro">
          Valuta ciò che sapresti spiegare oggi, indipendentemente da quanto hai investito.
        </p>
      </div>
      <OptionLegend />
      <RadioMatrix
        ariaLabel="Conoscenza per strumento"
        inputPrefix="topic-knowledge"
        options={topicKnowledgeOptions}
        values={values}
        onChange={(topic, value) => onChange(topic, value as TopicKnowledgeLevel)}
      />
      <CompletionStatus completed={completed} />
    </div>
  );
}

export function TopicInvestmentStep({
  answers,
  onChange,
}: {
  answers: TopicAnswers;
  onChange: (topic: string, value: TopicInvestmentBand) => void;
}) {
  const values = Object.fromEntries(
    instrumentOptions.map((item) => [item.value, answers[item.value]?.invested_amount_band])
  );
  const completed = Object.values(values).filter(Boolean).length;

  return (
    <div className="stack topic-step">
      <div>
        <p className="topic-question">
          Qual è l’importo massimo di capitale tuo che hai avuto investito nello stesso momento in ciascuno strumento?
        </p>
        <p className="muted topic-intro">
          Conta solo denaro reale: demo e simulatori non contano. Non sommare acquisti e vendite ripetuti sullo stesso capitale.
        </p>
      </div>
      <RadioMatrix
        ariaLabel="Importo investito per strumento"
        inputPrefix="topic-investment"
        options={topicInvestmentOptions}
        values={values}
        rowHints={{
          forex: "Considera il capitale proprio effettivamente esposto, non il nozionale.",
          derivatives: "Considera premio, margine o capitale proprio effettivamente a rischio, non il nozionale.",
        }}
        onChange={(topic, value) => onChange(topic, value as TopicInvestmentBand)}
      />
      <CompletionStatus completed={completed} />
    </div>
  );
}

export function TopicMentoringStep({
  answers,
  onChange,
  onSafetyChange,
}: {
  answers: TopicAnswers;
  onChange: (topic: string, value: boolean) => void;
  onSafetyChange: (topic: "forex" | "derivatives", value: string) => void;
}) {
  const disabledTopics = new Set(
    instrumentOptions.filter((item) => !isMentorEligible(answers[item.value])).map((item) => item.value)
  );
  const eligibleCount = instrumentOptions.length - disabledTopics.size;
  const completed = instrumentOptions.filter((item) => (
    disabledTopics.has(item.value) || mentorChoiceIsComplete(item.value, answers[item.value])
  )).length;
  const values = Object.fromEntries(instrumentOptions.map((item) => {
    const value = answers[item.value]?.wants_to_mentor;
    return [item.value, typeof value === "boolean" ? (value ? "yes" : "no") : undefined];
  }));

  return (
    <div className="stack topic-step">
      <div>
        <p className="topic-question">
          Su quali strumenti ti senti pronto a condividere la tua esperienza pratica per aiutare un’altra persona?
        </p>
        <p className="muted topic-intro">
          Le righe disponibili dipendono dalle risposte precedenti. Potrai modificare questa disponibilità nelle impostazioni.
        </p>
      </div>
      {eligibleCount === 0 ? (
        <p className="topic-inline-notice" role="status">
          Al momento non risultano strumenti disponibili per la mentorship. Puoi comunque continuare.
        </p>
      ) : null}
      <RadioMatrix
        ariaLabel="Disponibilità alla mentorship per strumento"
        inputPrefix="topic-mentoring"
        options={[
          { value: "yes", label: "Sì", shortLabel: "Sì" },
          { value: "no", label: "No", shortLabel: "No" },
        ]}
        values={values}
        disabledTopics={disabledTopics}
        disabledMessage="Non disponibile con le risposte attuali"
        onChange={(topic, value) => onChange(topic, value === "yes")}
      />
      <SafetyScenario
        topic="forex"
        answer={answers.forex}
        onChange={(value) => onSafetyChange("forex", value)}
      />
      <SafetyScenario
        topic="derivatives"
        answer={answers.derivatives}
        onChange={(value) => onSafetyChange("derivatives", value)}
      />
      <CompletionStatus completed={completed} label="righe definite" />
    </div>
  );
}

export function TopicReview({
  answers,
  onEdit,
}: {
  answers: TopicAnswers;
  onEdit: (section: "knowledge" | "investment" | "mentoring") => void;
}) {
  return (
    <section className="review-row topic-review" aria-labelledby="review-topics">
      <div className="review-row-head">
        <h3 id="review-topics">Profilo per strumento</h3>
        <span className="pill">Privato</span>
      </div>
      <div className="topic-review-wrap">
        <table className="topic-review-table">
          <thead>
            <tr><th>Strumento</th><th>Conoscenza</th><th>Importo investito</th><th>Mentor</th></tr>
          </thead>
          <tbody>
            {instrumentOptions.map((item) => {
              const answer = answers[item.value] || {};
              return (
                <tr key={item.value}>
                  <th scope="row">{item.label}</th>
                  <td>{topicKnowledgeOptions.find((option) => option.value === answer.knowledge_level)?.label || "Da completare"}</td>
                  <td>{topicInvestmentOptions.find((option) => option.value === answer.invested_amount_band)?.label || "Da completare"}</td>
                  <td>{mentorReviewLabel(item.value, answer)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="review-edit-actions">
        <button className="button secondary" type="button" onClick={() => onEdit("knowledge")}>Modifica conoscenza</button>
        <button className="button secondary" type="button" onClick={() => onEdit("investment")}>Modifica investimenti</button>
        <button className="button secondary" type="button" onClick={() => onEdit("mentoring")}>Modifica mentorship</button>
      </div>
    </section>
  );
}

export const TOPIC_SAFETY_SCENARIOS = {
  forex: {
    label: "Prima di renderti disponibile sul Forex",
    question: "Con la leva, quale affermazione descrive meglio il rischio del capitale utilizzato?",
    pass: "leverage_can_exhaust_capital",
    options: [
      { value: "leverage_can_exhaust_capital", label: "La leva può amplificare le perdite fino a esaurire il capitale esposto." },
      { value: "loss_limited_to_market_move", label: "La perdita dipende soltanto dal movimento percentuale del mercato." },
      { value: "cannot_lose_without_closing", label: "Senza chiudere manualmente la posizione non posso perdere denaro." },
    ],
  },
  derivatives: {
    label: "Prima di renderti disponibile su derivati e opzioni",
    question: "Quale affermazione descrive meglio il rischio di una posizione in derivati?",
    pass: "risk_depends_on_position_and_can_exceed_premium",
    options: [
      { value: "risk_depends_on_position_and_can_exceed_premium", label: "Dipende dalla posizione e può superare il premio versato." },
      { value: "maximum_loss_always_equals_premium", label: "La perdita massima è sempre uguale al premio versato." },
      { value: "margin_guarantees_limited_loss", label: "Il margine garantisce che la perdita resti limitata." },
    ],
  },
} as const;

function SafetyScenario({
  topic,
  answer,
  onChange,
}: {
  topic: keyof typeof TOPIC_SAFETY_SCENARIOS;
  answer?: TopicCompetenceDraft;
  onChange: (value: string) => void;
}) {
  if (answer?.wants_to_mentor !== true && !answer?.safety_scenario_answer) return null;
  const scenario = TOPIC_SAFETY_SCENARIOS[topic];
  const passed = answer.safety_scenario_answer === scenario.pass;
  return (
    <fieldset
      className="topic-safety-scenario"
      data-incomplete={answer.safety_scenario_answer ? undefined : "true"}
    >
      <legend>{scenario.label}</legend>
      <p>{scenario.question}</p>
      <div className="topic-safety-options">
        {scenario.options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name={`safety-${topic}`}
              value={option.value}
              checked={answer.safety_scenario_answer === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {answer.safety_scenario_answer && !passed ? (
        <p className="topic-safety-feedback" role="status">
          Con questa risposta la disponibilità sullo strumento non verrà attivata. Puoi correggerla oppure scegliere No.
        </p>
      ) : null}
    </fieldset>
  );
}

function mentorReviewLabel(topic: string, answer: TopicCompetenceDraft): string {
  if (!isMentorEligible(answer)) return "Non disponibile";
  if (!answer.wants_to_mentor) return "No";
  const scenario = topic === "forex" || topic === "derivatives" ? TOPIC_SAFETY_SCENARIOS[topic] : null;
  if (scenario && answer.safety_scenario_answer !== scenario.pass) return "Non disponibile";
  return "Sì";
}

export function mentorChoiceIsComplete(topic: string, answer?: TopicCompetenceDraft): boolean {
  if (typeof answer?.wants_to_mentor !== "boolean") return false;
  if (answer.wants_to_mentor !== true) return true;
  if (topic !== "forex" && topic !== "derivatives") return true;
  return !!answer.safety_scenario_answer;
}

function RadioMatrix({
  ariaLabel,
  inputPrefix,
  options,
  values,
  onChange,
  disabledTopics = new Set<string>(),
  disabledMessage = "Non disponibile",
  rowHints = {},
}: {
  ariaLabel: string;
  inputPrefix: string;
  options: ReadonlyArray<MatrixOption>;
  values: Record<string, string | undefined>;
  onChange: (topic: string, value: string) => void;
  disabledTopics?: Set<string>;
  disabledMessage?: string;
  rowHints?: Record<string, string>;
}) {
  return (
    <div className="topic-matrix-wrap">
      <table className="topic-matrix" aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col">Strumento</th>
            {options.map((option) => <th scope="col" key={option.value}>{option.shortLabel}</th>)}
          </tr>
        </thead>
        <tbody>
          {instrumentOptions.map((item) => {
            const disabled = disabledTopics.has(item.value);
            const incomplete = !disabled && values[item.value] === undefined;
            return (
              <tr
                key={item.value}
                className={disabled ? "topic-matrix-row disabled" : undefined}
                data-incomplete={incomplete ? "true" : undefined}
              >
                <th scope="row">
                  <span>{item.label}</span>
                  {rowHints[item.value] ? <small>{rowHints[item.value]}</small> : null}
                </th>
                {disabled ? (
                  <td className="topic-disabled-cell" colSpan={options.length}><span>{disabledMessage}</span></td>
                ) : options.map((option) => {
                  const id = `${inputPrefix}-${item.value}-${option.value}`;
                  return (
                    <td key={option.value}>
                      <label className={values[item.value] === option.value ? "topic-radio selected" : "topic-radio"} htmlFor={id}>
                        <input
                          id={id}
                          type="radio"
                          name={`${inputPrefix}-${item.value}`}
                          value={option.value}
                          checked={values[item.value] === option.value}
                          onChange={() => onChange(item.value, option.value)}
                          aria-label={`${item.label}: ${option.label}`}
                        />
                        <span className="topic-mobile-option">{option.label}</span>
                      </label>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function OptionLegend() {
  return (
    <div className="topic-legend" aria-label="Significato dei livelli di conoscenza">
      {topicKnowledgeOptions.map((option) => (
        <div key={option.value}><strong>{option.label}</strong><span>{option.description}</span></div>
      ))}
    </div>
  );
}

function CompletionStatus({
  completed,
  label = "strumenti completati",
}: {
  completed: number;
  label?: string;
}) {
  return <p className="topic-completion" role="status">{completed} di {instrumentOptions.length} {label}</p>;
}

export function isMentorEligible(answer?: TopicCompetenceDraft): boolean {
  return !!answer
    && (answer.knowledge_level === "K2" || answer.knowledge_level === "K3")
    && !!answer.invested_amount_band
    && answer.invested_amount_band !== "A0";
}

export function TopicCompetenceStyles() {
  return (
    <style jsx global>{`
      .topic-step { gap: 18px; }
      .topic-question { color: var(--navy-950); font-size: 1rem; font-weight: 850; line-height: 1.45; margin: 0 0 5px; }
      .topic-intro { font-size: 0.84rem; line-height: 1.55; margin: 0; }
      .topic-legend { display: grid; gap: 8px; grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .topic-legend > div { background: #f7faf8; border: 1px solid var(--line); border-radius: 12px; display: grid; gap: 4px; padding: 10px; }
      .topic-legend strong { color: var(--navy-950); font-size: 0.76rem; }
      .topic-legend span { color: var(--muted); font-size: 0.75rem; line-height: 1.45; }
      .topic-matrix-wrap,
      .topic-review-wrap { border: 1px solid var(--line); border-radius: 14px; max-width: 100%; overflow-x: auto; }
      .topic-matrix,
      .topic-review-table { border-collapse: collapse; table-layout: fixed; width: 100%; }
      .topic-matrix thead { background: #f7f8f7; }
      .topic-matrix th,
      .topic-matrix td { border-bottom: 1px solid var(--line); padding: 10px 7px; text-align: center; vertical-align: middle; }
      .topic-matrix tr:last-child th,
      .topic-matrix tr:last-child td { border-bottom: 0; }
      .topic-matrix thead th { color: var(--muted); font-size: 0.67rem; font-weight: 850; line-height: 1.25; }
      .topic-matrix thead th:first-child { text-align: left; width: 25%; }
      .topic-matrix tbody th { color: var(--navy-950); font-size: 0.76rem; font-weight: 800; line-height: 1.25; text-align: left; }
      .topic-matrix tbody th small { color: var(--muted); display: block; font-size: 0.75rem; font-weight: 500; line-height: 1.4; margin-top: 4px; }
      .topic-radio { align-items: center; border: 1px solid transparent; border-radius: 10px; cursor: pointer; display: flex; justify-content: center; min-height: 44px; padding: 6px; transition: background-color 150ms ease, border-color 150ms ease, transform 150ms ease; }
      .topic-radio:hover { background: #f7f8f7; border-color: var(--line); }
      .topic-radio.selected { background: var(--mint-100); border-color: var(--mint-600); }
      .topic-radio:focus-within { outline: 3px solid rgba(37, 156, 105, 0.25); outline-offset: 2px; }
      .topic-radio input { accent-color: var(--mint-600); cursor: pointer; height: 20px; margin: 0; width: 20px; }
      .topic-mobile-option { display: none; }
      .topic-matrix-row.disabled { background: #f5f6f5; }
      .topic-matrix-row.disabled th { color: #8a918d; }
      .topic-disabled-cell { color: #747c77; font-size: 0.72rem; font-weight: 700; text-align: left !important; }
      .topic-completion { color: var(--muted); font-size: 0.75rem; font-weight: 700; margin: -8px 0 0; text-align: right; }
      .topic-inline-notice { background: #f7f8f7; border-left: 3px solid var(--gold-500); border-radius: 8px; color: var(--muted); font-size: 0.8rem; line-height: 1.5; margin: 0; padding: 10px 12px; }
      .topic-safety-scenario { background: #fffaf0; border: 1px solid #efd59b; border-radius: 14px; display: grid; gap: 10px; margin: 0; padding: 14px; }
      .topic-safety-scenario legend { color: var(--navy-950); font-size: 0.78rem; font-weight: 850; padding-inline: 5px; }
      .topic-safety-scenario > p { color: var(--navy-950); font-size: 0.82rem; font-weight: 700; line-height: 1.45; margin: 0; }
      .topic-safety-options { display: grid; gap: 8px; }
      .topic-safety-options label { align-items: flex-start; background: white; border: 1px solid #eadfc7; border-radius: 10px; cursor: pointer; display: flex; font-size: 0.76rem; gap: 9px; line-height: 1.4; min-height: 44px; padding: 9px 10px; }
      .topic-safety-options label:focus-within { outline: 3px solid rgba(37, 156, 105, 0.25); outline-offset: 2px; }
      .topic-safety-options input { accent-color: var(--mint-600); flex: 0 0 auto; height: 18px; margin: 1px 0 0; width: 18px; }
      .topic-safety-feedback { background: #fff0e7; border-radius: 8px; color: #8a431f !important; font-size: 0.74rem !important; font-weight: 650 !important; padding: 8px 10px; }
      .topic-review { border: 1px solid var(--line); border-radius: var(--radius-sm); }
      .topic-review-table th,
      .topic-review-table td { border-bottom: 1px solid var(--line); font-size: 0.72rem; padding: 9px; text-align: left; }
      .topic-review-table tr:last-child th,
      .topic-review-table tr:last-child td { border-bottom: 0; }
      .topic-review-table thead { background: #f7f8f7; color: var(--muted); }
      .topic-review-table tbody th { color: var(--navy-950); }
      .review-edit-actions { display: flex; flex-wrap: wrap; gap: 8px; }
      .review-edit-actions .button { font-size: 0.72rem; min-height: 38px; padding: 7px 10px; }
      @media (max-width: 760px) {
        .topic-legend { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .topic-matrix-wrap { border: 0; overflow: visible; }
        .topic-matrix,
        .topic-matrix tbody,
        .topic-matrix tr,
        .topic-matrix th,
        .topic-matrix td { display: block; width: 100%; }
        .topic-matrix thead { clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px; }
        .topic-matrix tbody { display: grid; gap: 12px; }
        .topic-matrix tbody tr { background: white; border: 1px solid var(--line); border-radius: 14px; display: grid; gap: 8px; grid-template-columns: repeat(2, minmax(0, 1fr)); overflow: hidden; padding: 13px; }
        .topic-matrix tbody tr.disabled { background: #f5f6f5; }
        .topic-matrix tbody th { border: 0; font-size: 0.88rem; grid-column: 1 / -1; padding: 0 0 4px; }
        .topic-matrix tbody td { border: 0; padding: 0; }
        .topic-radio { border-color: var(--line); gap: 8px; justify-content: flex-start; min-height: 48px; padding: 9px 10px; }
        .topic-mobile-option { color: var(--navy-950); display: inline; font-size: 0.75rem; font-weight: 750; line-height: 1.25; }
        .topic-disabled-cell { grid-column: 1 / -1; }
        .topic-completion { text-align: left; }
      }
      @media (max-width: 640px) {
        .topic-review-wrap { border: 0; overflow: visible; }
        .topic-review-table,
        .topic-review-table tbody,
        .topic-review-table tr,
        .topic-review-table th,
        .topic-review-table td { display: block; width: 100%; }
        .topic-review-table thead { clip: rect(0 0 0 0); clip-path: inset(50%); height: 1px; overflow: hidden; position: absolute; white-space: nowrap; width: 1px; }
        .topic-review-table tbody { display: grid; gap: 9px; }
        .topic-review-table tr { border: 1px solid var(--line); border-radius: 12px; display: grid; gap: 5px; padding: 11px 12px; }
        .topic-review-table th,
        .topic-review-table td { border: 0; padding: 0; }
        .topic-review-table tbody th { font-size: 0.82rem; margin-bottom: 3px; }
        .topic-review-table td { display: grid; font-size: 0.72rem; gap: 8px; grid-template-columns: 7rem minmax(0, 1fr); }
        .topic-review-table td:nth-child(2)::before { color: var(--muted); content: "Conoscenza"; }
        .topic-review-table td:nth-child(3)::before { color: var(--muted); content: "Importo"; }
        .topic-review-table td:nth-child(4)::before { color: var(--muted); content: "Mentor"; }
      }
      @media (max-width: 420px) { .topic-legend { grid-template-columns: 1fr; } }
    `}</style>
  );
}
