"use client";
import type { GoalMatch } from '@/lib/types';
import styles from './SkillLearning.module.css';

export function GoalMatchChoices({matches,selectedGoalId,onSelect}: {matches: GoalMatch[]; selectedGoalId: string | null; onSelect: (goalId: string)=>void}) {
  return <fieldset className={styles.fieldset}><legend>Su quale tema vuoi iniziare?</legend><p className="muted">La proposta riguarda un solo tema. Gli altri obiettivi restano disponibili.</p>
    <div className={styles.choices}>{matches.map(match=><label key={match.goal_id} className={styles.choice}>
      <input type="radio" name="proposal-goal" checked={selectedGoalId===match.goal_id} onChange={()=>onSelect(match.goal_id)}/>
      <span><strong>{match.topic}</strong><small>{match.coverage_count} di {match.requested_count} attività · compatibilità {Math.round(match.match_score)}% per {match.topic}</small></span>
    </label>)}</div>
  </fieldset>;
}
