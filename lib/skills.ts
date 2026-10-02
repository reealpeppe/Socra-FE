import type { SkillCatalog, SkillProfile } from "./types";

export type SkillAnswers = Pick<SkillProfile, "known_skills" | "mentor_skills">;
export const emptySkillAnswers = (): SkillAnswers => ({ known_skills: [], mentor_skills: [] });

export function restoreSkillAnswers(raw: unknown, catalog: SkillCatalog): SkillAnswers {
  if (!raw || typeof raw !== "object") return emptySkillAnswers();
  const value = raw as Partial<SkillAnswers>;
  const valid = new Set(catalog.topics.flatMap(topic => topic.skills.map(skill => skill.code)));
  const known = Array.isArray(value.known_skills) ? [...new Set(value.known_skills.filter(code => valid.has(code)))] : [];
  return {
    known_skills: known,
    mentor_skills: Array.isArray(value.mentor_skills) ? [...new Set(value.mentor_skills.filter(code => known.includes(code)))] : [],
  };
}
