import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Handshake, MessageCircle, Target, UsersRound } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";
import publicStyles from "@/components/PublicLayout.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Community Socra — Incontri che diventano percorsi",
  description: "Impara e condividi la tua esperienza in percorsi tra persone, dalle basi agli approfondimenti avanzati.",
};

const principles = [
  {
    icon: Target,
    title: "Un obiettivo alla volta",
    body: "Ogni percorso nasce da qualcosa di concreto che vuoi imparare o approfondire. Un obiettivo chiaro rende lo scambio più semplice e utile per entrambi.",
  },
  {
    icon: MessageCircle,
    title: "Persone, non guru",
    body: "In Socra nessuno sale in cattedra. Conta ciò che puoi condividere, la capacità di ascoltare e la disponibilità a mettere la tua esperienza al servizio degli altri.",
  },
  {
    icon: Handshake,
    title: "Un impegno reciproco",
    body: "Il percorso si apre solo dopo un’accettazione esplicita e si chiude con il contributo e il feedback di entrambe le persone.",
  },
];

const pact = [
  {
    title: "Niente pressioni commerciali",
    body: "Nessuna vendita non richiesta, promessa di rendimento o spinta a investire.",
  },
  {
    title: "Condividi solo ciò che serve",
    body: "Evita password, documenti, dati di terzi e dettagli finanziari non necessari.",
  },
  {
    title: "Opinioni, non istruzioni personali",
    body: "Socra facilita l’apprendimento tra persone: non offre consulenza finanziaria.",
  },
  {
    title: "Segnala con contesto",
    body: "Se qualcosa non va, usa la segnalazione del percorso e descrivi fatti verificabili.",
  },
];

export default function CommunityPage() {
  return (
    <>
      <PublicNavbar />
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <section className={styles.hero}>
          <div className={`${styles.inner} ${styles.heroGrid}`}>
            <div>
              <p className={styles.eyebrow}>Una relazione alla volta</p>
              <h1>
                La community nasce
                <span>dallo scambio.</span>
              </h1>
              <p className={styles.lead}>
                In Socra ognuno può avere qualcosa da imparare e qualcosa da condividere.
                Le persone si incontrano attraverso percorsi costruiti su obiettivi concreti,
                trasformando l’esperienza di ciascuno in valore per la community.
              </p>
              <div className={styles.heroActions}>
                <Link className={publicStyles.actionGold} href="/register">Crea il tuo profilo</Link>
                <Link className={publicStyles.actionOnDark} href="/come-funziona">Come funziona un percorso</Link>
              </div>
            </div>

            <div className={styles.conversation} aria-label="Dal bisogno al percorso">
              <article className={styles.voiceCard}>
                <span className={styles.voiceIcon}><Compass aria-hidden="true" size={20} /></span>
                <div>
                  <strong>“C’è qualcosa che voglio imparare.”</strong>
                  <p>Definisci ciò che vuoi approfondire e Socra ti aiuta a incontrare chi ha esperienza in quell’ambito.</p>
                </div>
              </article>
              <article className={styles.voiceCard}>
                <span className={styles.voiceIcon}><UsersRound aria-hidden="true" size={20} /></span>
                <div>
                  <strong>“C’è qualcosa che posso condividere.”</strong>
                  <p>Metti a disposizione ciò che sai e incontra chi può trarre valore dalla tua esperienza.</p>
                </div>
              </article>
              <article className={styles.voiceCard}>
                <span className={styles.voiceIcon}><Handshake aria-hidden="true" size={20} /></span>
                <div>
                  <strong>“Possiamo crescere insieme.”</strong>
                  <p>Quando entrambi accettate, inizia un percorso con un obiettivo condiviso, fatto di confronto, esperienza e feedback reciproco.</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.principles}>
          <div className={styles.inner}>
            <header className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrowDark}>Cosa ci tiene insieme</p>
                <h2>Una community utile, non rumorosa.</h2>
              </div>
              <p>
                In Socra non conta parlare a tutti, ma incontrare la persona giusta.
                La piattaforma facilita connessioni utili e lascia alle persone ciò che
                conta davvero: confrontarsi, condividere esperienza e crescere insieme.
              </p>
            </header>
            <div className={styles.principleGrid}>
              {principles.map((principle) => {
                const Icon = principle.icon;
                return (
                  <article className={styles.principleCard} key={principle.title}>
                    <span className={styles.cardIcon}><Icon aria-hidden="true" size={21} /></span>
                    <h3>{principle.title}</h3>
                    <p>{principle.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className={styles.roles}>
          <div className={styles.inner}>
            <header className={styles.rolesHeader}>
              <p className={styles.eyebrowDark}>Due modi di partecipare</p>
              <h2>Oggi impari. Domani condividi. O entrambe le cose.</h2>
              <p>
                Non sei solo mentor o apprendista. Puoi imparare da chi ha più esperienza
                in un ambito e condividere la tua in un altro, anche se investi già da anni.
              </p>
            </header>
            <div className={styles.roleGrid}>
              <article className={styles.roleCard}>
                <span className={styles.roleLabel}>Come apprendista</span>
                <h3>Impara con un obiettivo concreto.</h3>
                <p>
                  Descrivi ciò che vuoi imparare, valuta le persone proposte e scegli chi
                  contattare. La decisione resta sempre tua.
                </p>
              </article>
              <article className={styles.roleCard}>
                <span className={styles.roleLabel}>Come mentor</span>
                <h3>Metti la tua esperienza a disposizione.</h3>
                <p>
                  Condividi ciò che hai imparato, ascolta chi hai davanti e aiutalo a comprendere
                  meglio un argomento. Non servono certezze assolute, ma trasparenza sui propri limiti.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.pact}>
          <div className={`${styles.inner} ${styles.pactGrid}`}>
            <div className={styles.pactCopy}>
              <p className={styles.eyebrowDark}>Il patto della community</p>
              <h2>Poche regole, per crescere insieme.</h2>
              <p>
                Entrare in Socra significa proteggere il confronto e la libertà di scelta
                dell’altra persona.
              </p>
              <div className={styles.pactActions}>
                <Link className={publicStyles.actionDark} href="/sicurezza">Leggi sicurezza e regole</Link>
                <Link className={publicStyles.textLink} href="/register">Entra nella community</Link>
              </div>
            </div>
            <div className={styles.pactList}>
              {pact.map((item, index) => (
                <article className={styles.pactItem} key={item.title}>
                  <span className={styles.pactNumber}>{index + 1}</span>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
