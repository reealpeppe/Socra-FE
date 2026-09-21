import { instrumentOptions, sectionDQuestions } from "@/lib/options";
import type { TopicCompetenceDraft, TopicCompetencePayload } from "@/lib/types";
import {
  isMentorEligible,
  mentorChoiceIsComplete,
} from "@/components/TopicCompetenceMatrix";

export const ONBOARDING_POLICY = "onboarding-essential-context-2026-09";
export type EssentialAnswers = {
  topics: Record<string, TopicCompetenceDraft>;
  selected: string[];
  selectionConfirmed: boolean;
  none: boolean;
  autonomy?: string;
  context: Record<string, string>;
};
export const emptyAnswers = (): EssentialAnswers => ({
  topics: {},
  selected: [],
  selectionConfirmed: false,
  none: false,
  context: {},
});
export const hasInvestment = (answers: EssentialAnswers) =>
  answers.selected.some((topic) => {
    const band = answers.topics[topic]?.invested_amount_band;
    return !!band && band !== "A0";
  });
export function topicComplete(
  topic: string,
  row?: TopicCompetenceDraft,
): boolean {
  return (
    !!row?.knowledge_level &&
    !!row.invested_amount_band &&
    (!isMentorEligible(row) || mentorChoiceIsComplete(topic, row))
  );
}
export function surveyComplete(answers: EssentialAnswers): boolean {
  return (
    answers.selectionConfirmed &&
    (answers.selected.length > 0 || answers.none) &&
    answers.selected.every((topic) =>
      topicComplete(topic, answers.topics[topic]),
    ) &&
    (!hasInvestment(answers) || !!answers.autonomy) &&
    sectionDQuestions.every((question) =>
      question.options.some((option) => option.value === answers.context[question.key]),
    )
  );
}
export function submittedAnswers(answers: EssentialAnswers) {
  const instruments = instrumentOptions.map(({ value: topic }) => {
    if (!answers.selected.includes(topic))
      return {
        topic,
        knowledge_level: "K0",
        invested_amount_band: "A0",
        wants_to_mentor: false,
      };
    const row = answers.topics[topic];
    return {
      ...row,
      topic,
      wants_to_mentor: isMentorEligible(row) && row.wants_to_mentor === true,
    };
  });
  return {
    onboarding_policy: ONBOARDING_POLICY,
    topic_competences_v2: { instruments } as TopicCompetencePayload,
    section_d: answers.context,
    ...(hasInvestment(answers) ? { D5: answers.autonomy } : {}),
  };
}
export function restoreAnswers(raw: Record<string, unknown>): {
  answers: EssentialAnswers;
  screen: string;
} {
  const flow = raw.essential_flow as
    { answers?: EssentialAnswers; screen?: string } | undefined;
  if ([ONBOARDING_POLICY, "onboarding-essential-2026-09"].includes(String(raw.onboarding_policy)) && flow?.answers) {
    const valid = new Set(instrumentOptions.map((row) => row.value));
    const context = restoreContext(flow.answers.context);
    const missingContext = sectionDQuestions.find((question) => !context[question.key]);
    return {
      answers: {
        ...flow.answers,
        selected: flow.answers.selected.filter((topic) => valid.has(topic)),
        context,
      },
      screen: flow.screen === "review" && missingContext ? `context:${missingContext.key}` : flow.screen || "selection",
    };
  }
  const matrix = raw.topic_competences_v2 as
    TopicCompetencePayload | Record<string, TopicCompetenceDraft> | undefined;
  const rows =
    matrix && "instruments" in matrix && Array.isArray(matrix.instruments)
      ? Object.fromEntries(matrix.instruments.map((row) => [row.topic, row]))
      : ((matrix || {}) as Record<string, TopicCompetenceDraft>);
  const selected = instrumentOptions
    .filter(({ value }) => {
      const row = rows[value];
      return (
        row &&
        (row.knowledge_level !== "K0" || row.invested_amount_band !== "A0")
      );
    })
    .map(({ value }) => value);
  const confirmed = instrumentOptions.every(({ value }) =>
    topicComplete(value, rows[value]),
  );
  return {
    answers: {
      topics: rows,
      selected,
      selectionConfirmed: confirmed,
      none: confirmed && selected.length === 0,
      autonomy: typeof raw.D5 === "string" ? raw.D5 : undefined,
      context: restoreContext(raw.section_d),
    },
    screen: "selection",
  };
}

function restoreContext(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const values = raw as Record<string, unknown>;
  return Object.fromEntries(sectionDQuestions.flatMap((question) => {
    const value = values[question.key];
    return question.options.some((option) => option.value === value)
      ? [[question.key, value as string]] : [];
  }));
}
