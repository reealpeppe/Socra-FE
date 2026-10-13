import type { SkillCoverage } from "@/lib/types";
import { ChevronDown } from "lucide-react";
import styles from "./SkillLearning.module.css";
import detailsStyles from "./SkillCoverageDetails.module.css";

export function coverageCounts(coverage: SkillCoverage) {
  const count = coverage.coverage_count ?? coverage.covered_objective_codes?.length ?? 0;
  const total = coverage.requested_count ?? count + (coverage.missing_objective_codes?.length || 0);
  return { count, total, missing: Math.max(0, total - count) };
}

export function MissingObjectives({ coverage }: { coverage: SkillCoverage }) {
  const { missing } = coverageCounts(coverage);
  if (!missing) return null;
  return <details className={detailsStyles.missing}>
    <summary>{missing === 1 ? "Un altro obiettivo" : `Gli altri ${missing} obiettivi`} <ChevronDown size={14} aria-hidden="true" /></summary>
    <p>Da affrontare in un altro percorso:</p>
    <ul>{coverage.missing_objective_labels?.map(label => <li key={label}>{label}</li>)}</ul>
  </details>;
}

export function ObjectiveSummary({ labels, mode, topic, title = "Obiettivi del percorso", modeTitle = "Come vuoi lavorare" }: { labels?: string[]; mode?: string | null; topic?: string; title?: string; modeTitle?: string }) {
  if (!labels?.length) return null;
  return <div className={styles.objectiveSummary}>{topic ? <h3>{topic}</h3> : null}<strong className={styles.summaryLabel}>{title}</strong><ul className={styles.list}>{labels.map((label, index) => <li key={`${index}-${label}`}>{label}</li>)}</ul>{mode ? <div className={styles.modeSummary}><strong className={styles.summaryLabel}>{modeTitle}</strong><p>{mode}</p></div> : null}</div>;
}

export function CoverageSummary({ coverage }: { coverage: SkillCoverage }) {
  if (!coverage.skill_model) return null;
  const { count, total } = coverageCounts(coverage);
  return <div className={styles.coverage}>
    {count < total ? <p className={styles.partial}>Copertura parziale</p> : null}
    <details className={styles.coverageDetails}><summary>Su cosa potete lavorare</summary>
    <strong>{count} di {total} obiettivi</strong>
    <ul className={styles.list}>{coverage.covered_objective_labels?.map(label => <li key={label}>{label}</li>)}</ul>
    {coverage.missing_objective_labels?.length ? <><p className="muted">Da affrontare in un altro percorso:</p><ul className={styles.list}>{coverage.missing_objective_labels.map(label => <li key={label}>{label}</li>)}</ul></> : null}
    </details>
  </div>;
}
