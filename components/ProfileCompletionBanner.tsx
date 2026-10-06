import Link from 'next/link';
import type {ProfileCompletion} from '@/lib/types';
import styles from './SkillLearning.module.css';

export function ProfileCompletionBanner({completion}:{completion:ProfileCompletion}) {
  if(completion.experience_completed&&completion.context_completed)return null;
  return <aside className={`${styles.notice} stack`} aria-label="Completa il tuo profilo">
    <strong>Completa il tuo profilo!</strong>
    <p>Hai ancora alcune domande facoltative sul tuo contesto personale. Le risposte rimangono private; puoi anche scegliere “Preferisco non rispondere”.</p>
    <Link className="button secondary" href={completion.experience_completed?'/settings#personal-context':'/competenze'}>Completa il profilo · {completion.context_answered_count}/{completion.context_total_count}</Link>
  </aside>;
}
