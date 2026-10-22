import Link from 'next/link';
import type {ProfileCompletion} from '@/lib/types';
import styles from './SkillLearning.module.css';

export const incompleteProfileCompletion: ProfileCompletion = {
  experience_completed: false,
  context_completed: false,
  context_answered_count: 0,
  context_total_count: 5,
};

export function ProfileCompletionBanner({completion}:{completion:ProfileCompletion}) {
  if(completion.experience_completed&&completion.context_completed)return null;
  return <aside className={`${styles.notice} stack`} aria-label="Completa il tuo profilo">
    <strong>Completa il tuo profilo!</strong>
    <p>Le domande sul contesto personale sono facoltative e le risposte restano riservate.</p>
    {completion.experience_completed
      ? <Link className="button secondary" href="/settings#personal-context">Completa il profilo · {completion.context_answered_count}/{completion.context_total_count}</Link>
      : <><button className={`button secondary ${styles.contextLocked}`} type="button" disabled>Completa il profilo · {completion.context_answered_count}/{completion.context_total_count}</button><Link href="/competenze">Prima completa la tua esperienza</Link></>}
  </aside>;
}
