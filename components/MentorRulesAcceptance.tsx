import { useId } from "react";
import styles from "./MentorRulesAcceptance.module.css";

export const MENTOR_RULES_VERSION = "mentor-rules-2026-11-20";

export function MentorRulesAcceptance({ checked, onChange, disabled = false }: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const title = useId();
  return (
    <section className={styles.rules} aria-labelledby={title}>
      <h3 id={title}>Prima di iniziare: cosa fa un mentor su Socra</h3>
      <p>Su Socra insegni a fare, non decidi al posto di chi impara. Per questo ogni mentor accetta tre regole.</p>
      <ul>
        <li><strong>Insegno, non consiglio cosa comprare.</strong> Condivido la mia esperienza e spiego come si fa. Non dico a nessuno quali prodotti comprare, vendere o tenere.</li>
        <li><strong>I soldi restano di chi impara.</strong> Non gestisco denaro, conti o credenziali di altre persone e non chiedo mai di farlo.</li>
        <li><strong>Non vendo niente.</strong> Non uso Socra per proporre prodotti, servizi a pagamento o link da cui guadagno.</li>
      </ul>
      <label>
        <input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} disabled={disabled} required />
        <span>Ho letto le tre regole e mi impegno a rispettarle.</span>
      </label>
      <p className="muted">Il team Socra esamina le segnalazioni e decide come intervenire in base alla violazione accertata.</p>
    </section>
  );
}
