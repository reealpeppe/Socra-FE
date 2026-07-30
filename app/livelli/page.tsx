import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Compass,
  Layers3,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Livelli Socra — Il tuo punto di partenza",
  description: "I livelli aiutano Socra a proporre percorsi e persone coerenti con il tuo punto di partenza.",
};

const levels = [
  {
    code: "L0",
    name: "Orientamento",
    icon: Compass,
    description: "Per prendere confidenza con i fondamentali e trasformare i primi dubbi in un obiettivo concreto.",
    items: [
      "Obiettivi introduttivi e leggibili",
      "Percorsi guidati passo dopo passo",
      "Mentor coerenti con il punto di partenza",
    ],
  },
  {
    code: "L1",
    name: "Autonomia guidata",
    icon: Layers3,
    description: "Per consolidare un metodo, mettere ordine nelle conoscenze e lavorare su temi più specifici.",
    items: [
      "Obiettivi più focalizzati",
      "Confronto tra teoria ed esperienza",
      "Possibilità di rendersi disponibili come mentor",
    ],
  },
  {
    code: "L2",
    name: "Condivisione",
    icon: Sparkles,
    description: "Per affrontare obiettivi articolati e condividere un’esperienza già strutturata con la community.",
    items: [
      "Temi e obiettivi più approfonditi",
      "Percorsi costruiti sul contesto",
      "Possibilità di accompagnare altri membri",
    ],
  },
];

const principles = [
  {
    icon: BookOpenCheck,
    title: "Un punto di partenza",
    body: "La survey aiuta Socra a proporti un’esperienza coerente. Non è un esame e non certifica competenze professionali.",
  },
  {
    icon: UsersRound,
    title: "Relazioni più pertinenti",
    body: "Il livello lavora insieme al tuo obiettivo per rendere più utili i profili e i percorsi che incontri.",
  },
  {
    icon: ShieldCheck,
    title: "Nessuna classifica",
    body: "Non misura rendimento, patrimonio o valore personale. Le risposte dettagliate della survey restano private.",
  },
];

export default function LivelliPage() {
  return (
    <>
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <p className={styles.eyebrow}>Il tuo punto di partenza</p>
              <h1>
                Un livello che
                <span>orienta, non giudica.</span>
              </h1>
              <p className={styles.heroLead}>
                Ognuno entra in Socra con esperienze e domande diverse. Il livello
                rende più pertinenti i percorsi, senza trasformare la community in
                una classifica.
              </p>
              <div className={styles.heroActions}>
                <Link href="/register" className={styles.primaryCta}>
                  Scopri il tuo livello <ArrowRight size={17} aria-hidden="true" />
                </Link>
                <Link href="/come-funziona" className={styles.secondaryCta}>
                  Come funziona Socra
                </Link>
              </div>
            </div>

            <div className={styles.heroRail} aria-label="Livelli iniziali Socra">
              {levels.map((level, index) => {
                const Icon = level.icon;
                return (
                  <article className={styles.heroLevel} key={level.code}>
                    <div className={styles.heroLevelCode}>{level.code}</div>
                    <div>
                      <span>0{index + 1}</span>
                      <strong>{level.name}</strong>
                    </div>
                    <Icon size={21} aria-hidden="true" />
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.levelsSection}>
          <div className={styles.sectionInner}>
            <header className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrowDark}>I livelli iniziali</p>
                <h2>Tre modi di entrare nel percorso.</h2>
              </div>
              <p>
                Il tuo livello rende l’esperienza più leggibile: cambia il tipo di
                obiettivi e di relazioni che Socra ti propone, non il valore della
                tua partecipazione.
              </p>
            </header>

            <div className={styles.levelGrid}>
              {levels.map((level) => {
                const Icon = level.icon;
                return (
                  <article className={styles.levelCard} key={level.code}>
                    <div className={styles.levelCardTop}>
                      <span className={styles.levelCode}>{level.code}</span>
                      <span className={styles.levelIcon}>
                        <Icon size={21} aria-hidden="true" />
                      </span>
                    </div>
                    <div>
                      <h3>{level.name}</h3>
                      <p>{level.description}</p>
                    </div>
                    <ul>
                      {level.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.principlesSection}>
          <div className={styles.sectionInner}>
            <header className={styles.principlesHeader}>
              <p className={styles.eyebrow}>Cosa significa davvero</p>
              <h2>Il livello serve alla qualità del percorso.</h2>
            </header>
            <div className={styles.principlesGrid}>
              {principles.map((principle) => {
                const Icon = principle.icon;
                return (
                  <article className={styles.principleCard} key={principle.title}>
                    <span className={styles.principleIcon}>
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <h3>{principle.title}</h3>
                    <p>{principle.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaInner}>
            <div>
              <p className={styles.eyebrowDark}>Inizia da qui</p>
              <h2>Trova il tuo posto nella community.</h2>
            </div>
            <div className={styles.ctaCopy}>
              <p>
                Crea il profilo, completa la survey e scegli il primo obiettivo su
                cui vuoi confrontarti.
              </p>
              <Link href="/register" className={styles.primaryCta}>
                Crea il profilo <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
