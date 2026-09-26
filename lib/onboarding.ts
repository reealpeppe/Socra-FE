import { instrumentOptions, sectionDQuestions, topicExperienceDurationOptions, sharingAutonomyOptions } from "@/lib/options";
import type { TopicCompetenceDraft, TopicCompetencePayload } from "@/lib/types";
export const ONBOARDING_POLICY = "onboarding-sharing-2026-09-26";
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
    typeof row.wants_to_mentor === "boolean" &&
    topicExperienceDurationOptions.some(option => option.value === row.experience_duration)
  );
}
export function surveyComplete(answers: EssentialAnswers): boolean {
  return (
    answers.selectionConfirmed &&
    (answers.selected.length > 0 || answers.none) &&
    answers.selected.every((topic) =>
      topicComplete(topic, answers.topics[topic]),
    ) &&
    sharingAutonomyOptions.some(option => option.value === answers.autonomy) &&
    sectionDQuestions.every((question) =>
      question.options.some((option) => option.value === answers.context[question.key]) ||
      (question.key === "D2" && answers.context.D2 === "gt_75k"),
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
      knowledge_level: row.knowledge_level,
      invested_amount_band: row.invested_amount_band,
      experience_duration: row.experience_duration,
      topic,
      wants_to_mentor: row.wants_to_mentor === true,
    };
  });
  return {
    onboarding_policy: ONBOARDING_POLICY,
    topic_competences_v2: { instruments } as TopicCompetencePayload,
    section_d: answers.context,
    D5: answers.autonomy,
  };
}
export function restoreAnswers(raw: Record<string, unknown>): {
  answers: EssentialAnswers;
  screen: string;
  reviewVisited?: boolean;
} {
  const flow = raw.essential_flow as
    { answers?: EssentialAnswers; screen?: string; reviewVisited?: boolean } | undefined;
  if ([ONBOARDING_POLICY, "onboarding-essential-context-2026-09", "onboarding-essential-2026-09"].includes(String(raw.onboarding_policy)) && flow?.answers) {
    const valid = new Set(instrumentOptions.map((row) => row.value));
    const context = restoreContext(flow.answers.context);
    const missingContext = sectionDQuestions.find((question) => !context[question.key]);
    const missingTopic = flow.answers.selected.find(topic => !topicComplete(topic, flow.answers?.topics[topic]));
    return {
      reviewVisited: flow.reviewVisited === true || flow.screen === "review",
      answers: {
        ...flow.answers,
        selected: flow.answers.selected.filter((topic) => valid.has(topic)),
        context,
      },
      screen: flow.screen === "review"
        ? missingTopic ? `topic:${missingTopic}` : !flow.answers.autonomy ? "autonomy" : missingContext ? `context:${missingContext.key}` : "review"
        : flow.screen || "selection",
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
        (row.knowledge_level !== "K0" || row.invested_amount_band !== "A0" || row.wants_to_mentor === true || !!row.experience_duration)
      );
    })
    .map(({ value }) => value);
  const confirmed = instrumentOptions.every(({ value }) => {
    const row = rows[value];
    return !!row?.knowledge_level && !!row.invested_amount_band && typeof row.wants_to_mentor === "boolean";
  });
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
    return (question.options.some((option) => option.value === value) || (question.key === "D2" && value === "gt_75k"))
      ? [[question.key, value as string]] : [];
  }));
}
