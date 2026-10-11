import type { Metadata } from "next";
import Link from "next/link";
import styles from "./Home.module.css";
import { GraduationCap, Target, Users, BookOpen, TrendingUp } from "lucide-react";
import publicStyles from "@/components/PublicLayout.module.css";

export const metadata: Metadata = {
  title: "Socra — Se lo sai insegnalo, se non lo sai imparalo",
  description: "La community dove la conoscenza finanziaria passa da persona a persona. Impara, approfondisci e condividi la tua esperienza.",
};

const steps = [
  {
    icon: GraduationCap,
    title: "Parti dalla tua esperienza",
    body: "Completa la survey guidata per raccontare cosa conosci, cosa hai messo in pratica e cosa puoi condividere.",
  },
  {
    icon: Target,
    title: "Definisci obiettivi e competenze",
    body: "Indica dove vuoi crescere come apprendista e gli ambiti in cui puoi mettere la tua esperienza a disposizione come mentor.",
  },
  {
    icon: Users,
    title: "Crea le connessioni giuste",
    body: "Socra ti suggerisce mentor adatti al tuo obiettivo e ti rende disponibile, sugli argomenti idonei, a chi può imparare da te.",
  },
  {
    icon: BookOpen,
    title: "Inizia il percorso",
    body: "Accetta o invia una richiesta, organizzate i vostri incontri e lavorate insieme verso un obiettivo concreto e condiviso.",
  },
  {
    icon: TrendingUp,
    title: "Concludi, valuta e cresci",
    body: "Al termine, entrambi chiudete il percorso e lasciate un feedback. I risultati contribuiscono alla fiducia nella community.",
  },
];

const operatingPillars = [
  {
    title: "01 — Raccontaci cosa sai e dove vuoi arrivare",
    body: "Con la survey racconti la tua esperienza e le tue competenze; con l’obiettivo scegli ciò che vuoi imparare o approfondire.",
  },
  {
    title: "02 — Incontra le persone giuste",
    body: "Scopri chi può aiutarti a crescere e chi può beneficiare della tua esperienza. Valutate insieme se iniziare.",
  },
  {
    title: "03 — Impara e condividi",
    body: "Segui i tuoi percorsi, approfondisci nuovi argomenti e restituisci valore alla community condividendo quello che sai.",
  },
];

const pathRules = [
  {
    title: "Si parte insieme",
    body: "Mentor e apprendista possono proporre un percorso. Si comincia solo quando entrambi scelgono di partecipare.",
  },
  {
    title: "Ci si incontra davvero",
    body: "Il percorso prende forma nel confronto tra mentor e apprendista, organizzato intorno a un obiettivo chiaro e condiviso.",
  },
  {
    title: "Si cresce da entrambe le parti",
    body: "Alla fine, mentor e apprendista chiudono il percorso e lasciano il proprio feedback, contribuendo alla fiducia nella community.",
  },
];

export default function HomePage() {
  return (
    <>      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.context}>Finanza e investimenti da persona a persona</p>
            <h1>Se lo sai insegnalo,<br />se non lo sai imparalo.</h1>
            <p className={styles.lead}>Socra è la community dove la conoscenza finanziaria passa da persona a persona. Trova chi ha esperienza in ciò che vuoi imparare e metti la tua esperienza a disposizione di chi può imparare da te.</p>
            <div className={styles.actions}>
              <Link className={publicStyles.actionGold} href="/register">Entra nella community</Link>
              <a className={publicStyles.actionOutline} href="#come-funziona">Come funziona</a>
            </div>
          </div>
        </section>

        <section className={styles.model}>
          <div className={styles.container}>
            <p className={styles.sectionLabel}>Il modello Socra</p>
            <div className={styles.pillars}>
              {operatingPillars.map((pillar) => (
                <div key={pillar.title}>
                  <h2>{pillar.title}</h2>
                  <p>{pillar.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="come-funziona" className={styles.process}>
          <div className={styles.container}>
            <p className={styles.sectionLabel}>Come funziona</p>
            <h2 className={styles.sectionTitle}>Un percorso chiaro, passo dopo passo</h2>
            <div className={styles.steps}>
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className={styles.step}>
                    <span className={styles.stepNumber}>{i + 1}</span>
                    <div>
                      <Icon size={24} color="var(--navy-950)" />
                      <h3>{step.title}</h3>
                      <p>{step.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link className={publicStyles.textLink} href="/come-funziona">Scopri tutti i dettagli</Link>
          </div>
        </section>

        <section className={styles.exchange}>
          <div className={styles.container}>
            <p className={styles.sectionLabel}>Come funziona lo scambio</p>
            <h2 className={styles.sectionTitle}>Ogni percorso è un impegno reciproco</h2>
            <div className={styles.rules}>
              {pathRules.map((rule) => (
                <article key={rule.title}>
                  <h3>{rule.title}</h3>
                  <p>{rule.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.close}>
          <div>
            <h2>Quello che sai può aiutare qualcuno.</h2>
            <p>E qualcuno può aiutarti a scoprire ciò che ancora non sai. Entra in Socra e inizia a far circolare la conoscenza.</p>
            <Link className={publicStyles.actionGold} href="/register">Crea il tuo profilo</Link>
          </div>
        </section>
      </main>    </>
  );
}
