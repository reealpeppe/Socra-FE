import type { SkillGroup } from "@/lib/types";
import styles from "./SkillLearning.module.css";

export function SkillPreparation({ group, compact = false }: { group: Pick<SkillGroup, "label" | "known_count" | "total_count" | "preparation_percent"> & { confirmed_count?: number }; compact?: boolean }) {
  const declared = group.confirmed_count === undefined ? null : Math.max(0, group.known_count - group.confirmed_count);
  if (compact) return <div className={styles.preparationCompact}>
    <strong>{group.label}</strong>
    <progress aria-label={`Preparazione su ${group.label}`} max={group.total_count || 1} value={group.known_count} />
    <small>{Math.round(group.preparation_percent)}% · {group.known_count}/{group.total_count}</small>
  </div>;
  return <div className={styles.preparation}>
    <div className={styles.preparationHeading}><strong>{group.label}</strong><span>{Math.round(group.preparation_percent)}%</span></div>
    <progress aria-label={`Preparazione su ${group.label}`} max={group.total_count || 1} value={group.known_count} />
    <small>{group.known_count} di {group.total_count} attività conosciute</small>
    {declared !== null ? <small>{declared} dichiarate · {group.confirmed_count} {group.confirmed_count === 1 ? "confermata" : "confermate"} nei percorsi</small> : null}
  </div>;
}
