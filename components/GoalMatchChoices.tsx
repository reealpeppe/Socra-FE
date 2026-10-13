"use client";
import type { GoalMatch } from '@/lib/types';
import styles from './AlignmentDialog.module.css';

export function GoalMatchChoices({matches,selectedGoalId,onSelect}: {matches: GoalMatch[]; selectedGoalId: string | null; onSelect: (goalId: string)=>void}) {
  return <fieldset className={styles.fieldset}><legend>Su quale tema vuoi iniziare?</legend>
    <div className={styles.choices}>{matches.map(match=><label key={match.goal_id} className={styles.choice}>
      <input type="radio" name="proposal-goal" checked={selectedGoalId===match.goal_id} onChange={()=>onSelect(match.goal_id)}/>
      <span><strong>{match.topic}</strong><small>{match.coverage_count} di {match.requested_count} attività · {Math.round(match.match_score)}% compatibilità</small></span>
    </label>)}</div>
  </fieldset>;
}
