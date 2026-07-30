import type { Metadata } from "next";
import Link from "next/link";
import { Compass, Handshake, MessageCircle, Target, UsersRound } from "lucide-react";
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";
import publicStyles from "@/components/PublicLayout.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Community Socra — Incontri che diventano percorsi",
  description: "La community Socra prende forma nei percorsi uno-a-uno tra mentee e mentor.",
};

const principles = [
  {
    icon: Target,
    title: "Un obiettivo alla volta",
    body: "Ogni incontro parte da qualcosa che vuoi capire o imparare. Un confine chiaro rende il confronto più utile per entrambi.",
  },
  {
    icon: MessageCircle,
    title: "Confronto, non palcoscenico",
    body: "Non servono guru né classifiche. Contano la capacità di ascoltare, spiegare con chiarezza e dichiarare i propri limiti.",
  },
  {
    icon: Handshake,
    title: "Responsabilità reciproca",
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
                <span>nei percorsi.</span>
              </h1>
              <p className={styles.lead}>
                Socra mette in relazione persone che vogliono imparare e persone
                disponibili a condividere esperienza. Il valore nasce da obiettivi chiari,
                ascolto e responsabilità reciproca.
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
                  <strong>“Voglio fare chiarezza.”</strong>
                  <p>Una persona definisce ciò che vuole comprendere, senza dover esporre dettagli inutili.</p>
                </div>
              </article>
              <article className={styles.voiceCard}>
                <span className={styles.voiceIcon}><UsersRound aria-hidden="true" size={20} /></span>
                <div>
                  <strong>“Posso condividere la mia esperienza.”</strong>
                  <p>Socra propone incontri coerenti; entrambe le persone restano libere di scegliere.</p>
                </div>
              </article>
              <article className={styles.voiceCard}>
                <span className={styles.voiceIcon}><Handshake aria-hidden="true" size={20} /></span>
                <div>
                  <strong>“Costruiamo un percorso.”</strong>
                  <p>Dopo l’accettazione nasce uno spazio con un obiettivo condiviso e un feedback reciproco.</p>
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
                La qualità non dipende da quante persone parlano, ma da come si
                incontrano. Socra struttura il minimo necessario e lascia spazio alla
                relazione.
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
              <h2>Puoi imparare. Puoi restituire.</h2>
              <p>
                Mentee e mentor non sono categorie rigide. In momenti diversi puoi avere
                una domanda da approfondire o un’esperienza utile da mettere a disposizione.
              </p>
            </header>
            <div className={styles.roleGrid}>
              <article className={styles.roleCard}>
                <span className={styles.roleLabel}>Come mentee</span>
                <h3>Parti da un obiettivo concreto.</h3>
                <p>
                  Descrivi ciò che vuoi imparare, valuta le persone proposte e scegli chi
                  contattare. La decisione resta sempre tua.
                </p>
              </article>
              <article className={styles.roleCard}>
                <span className={styles.roleLabel}>Come mentor</span>
                <h3>Condividi esperienza, non certezze.</h3>
                <p>
                  Ascolta il contesto, esplicita i limiti e aiuta l’altra persona a costruire
                  un metodo. Nessun profilo è una certificazione professionale.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className={styles.pact}>
          <div className={`${styles.inner} ${styles.pactGrid}`}>
            <div className={styles.pactCopy}>
              <p className={styles.eyebrowDark}>Il patto della community</p>
              <h2>Poche regole, molto chiare.</h2>
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
