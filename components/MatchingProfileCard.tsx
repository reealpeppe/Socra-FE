import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Waypoints } from "lucide-react";
import type { SkillCoverage, GoalMatch } from "@/lib/types";
import { ProfileAvatar } from "./ProfileAvatar";
import { coverageCounts, MissingObjectives } from "./SkillSummary";
import styles from "./MatchingProfileCard.module.css";

export function MatchingProfileCard({ userId, name, topic, coverage, score, mode, matches, cost, recommended, badges, discoveryOfferId, actionLabel, disabled, onRequest }: {
  userId: string; name: string; topic: string; coverage: SkillCoverage; score: number;
  mode?: string | null; cost?: number; recommended?: boolean; badges?: string[]; discoveryOfferId?: string;
  matches?: GoalMatch[];
  actionLabel: string; disabled: boolean; onRequest: () => void;
}) {
  const topics = matches?.length ? matches : [{ ...coverage, goal_id: "single", topic, match_score: score, discussion_mode_label: mode }];
  const identity = <div className={styles.identity}>
      <ProfileAvatar userId={userId} name={name} />
      <div className={styles.name}><h2>{name}</h2><Link href={`/profiles/${encodeURIComponent(userId)}`}>Vedi profilo <ArrowUpRight size={14} aria-hidden="true" /></Link></div>
    </div>;
  return <article className={styles.card} data-person-id={userId}>
    {topics.map((match, index) => {
      const { count, total } = coverageCounts(match);
      const content = <section className={styles.topicGroup} key={match.goal_id} aria-label={`Obiettivi su ${match.topic}`}>
        <div className={styles.coverage}><span>{match.topic}</span><strong>{count} di {total} {total === 1 ? "obiettivo" : "obiettivi"}</strong>{recommended && index === 0 ? <small>Consigliato</small> : null}</div>
        <p className={styles.label}>Potete lavorare su</p>
        <ul className={styles.activities}>{match.covered_objective_codes?.map((code, activityIndex) => <li key={code}><Check size={18} aria-hidden="true" /><span>{match.covered_objective_labels?.[activityIndex] || code}</span></li>)}</ul>
        {match.discussion_mode_label ? <p className={styles.mode}>{match.discussion_mode_label}</p> : null}
        <MissingObjectives coverage={match} />
        <p className={styles.score}><Waypoints size={16} aria-hidden="true" /><span>Compatibilità su {match.topic}</span><strong>{Number.isFinite(match.match_score) ? `${Math.max(0, Math.min(100, Math.round(match.match_score)))}%` : "—"}</strong></p>
      </section>;
      // Observe the identity and primary topic, so additional themes cannot make
      // the existing 50%-for-one-second visibility threshold unreachable.
      return index === 0 ? <div className={styles.discovery} key={match.goal_id} data-discovery-offer={discoveryOfferId}>{identity}{content}</div> : content;
    })}
    {badges?.length ? <div className={styles.badges} aria-label="Badge mentor">{badges.slice(0, 3).map(badge => <span key={badge}>{badge}</span>)}</div> : null}
    <div className={styles.footer}>
      {Number.isFinite(cost) ? <p className={styles.cost}>Costo del percorso per te: {cost} {cost === 1 ? "credito" : "crediti"}</p> : null}
      <button className={styles.action} type="button" disabled={disabled} onClick={onRequest}>{actionLabel}<ArrowRight size={18} aria-hidden="true" /></button>
    </div>
  </article>;
}
