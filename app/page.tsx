import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Target, Users, BookOpen, TrendingUp } from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";
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
    <>
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} style={{ paddingTop: "64px" }}>

        {/* ── Hero ── */}
        <section style={{
          background: "var(--navy-950)",
          backgroundImage: "radial-gradient(circle at 85% 12%, rgba(245,182,47,0.18) 0%, transparent 40%)",
          padding: "clamp(60px, 10vw, 120px) clamp(16px, 4vw, 40px) clamp(60px, 8vw, 100px)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.1fr) minmax(280px,0.7fr)",
            gap: "clamp(32px,5vw,72px)",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
            className="home-hero-grid"
          >
            {/* Left: text */}
            <div>
              <p style={{
                color: "var(--gold-500)",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                margin: "0 0 20px",
              }}>
                Finanza e investimenti da persona a persona
              </p>
              <h1 style={{
                color: "#ffffff",
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                fontWeight: 900,
                lineHeight: 1.0,
                margin: "0 0 24px",
                letterSpacing: "-0.02em",
                textWrap: "balance",
              }}>
                Se lo sai insegnalo,<br />se non lo sai imparalo.
              </h1>
              <p style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "clamp(1rem, 2vw, 1.15rem)",
                lineHeight: 1.7,
                maxWidth: "52ch",
                margin: "0 0 36px",
              }}>
                Socra è la community dove la conoscenza finanziaria passa da persona a persona. Trova chi ha esperienza in ciò che vuoi imparare e metti la tua esperienza a disposizione di chi può imparare da te.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
                <Link className={publicStyles.actionGold} href="/register">
                  Entra nella community
                </Link>
                <a className={publicStyles.textLinkOnDark} href="#come-funziona">
                  Come funziona
                </a>
              </div>
            </div>

            {/* Right: product model */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              padding: "clamp(20px,3vw,32px)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}>
              <p style={{
                color: "var(--gold-500)",
                fontSize: "0.72rem",
                fontWeight: 800,
                letterSpacing: "0.14em",
                margin: 0,
                textTransform: "uppercase",
              }}>
                Il modello Socra
              </p>
              {operatingPillars.map((pillar, index) => (
                <div key={pillar.title} style={{
                  background: index === 0 ? "rgba(245,182,47,0.08)" : "rgba(255,255,255,0.04)",
                  border: index === 0 ? "1px solid rgba(245,182,47,0.2)" : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  padding: "20px 24px",
                }}>
                  <h2 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 800, margin: "0 0 6px" }}>
                    {pillar.title}
                  </h2>
                  <p style={{ color: "rgba(255,255,255,0.58)", fontSize: "0.82rem", lineHeight: 1.55, margin: 0 }}>
                    {pillar.body}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <style>{`
            @media (max-width: 760px) {
              .home-hero-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>

        {/* ── Come funziona preview ── */}
        <section id="come-funziona" style={{
          background: "#ffffff",
          padding: "clamp(48px,8vw,96px) clamp(16px,4vw,40px)",
          scrollMarginTop: "80px",
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <p style={{
              color: "#80580c",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 12px",
              textAlign: "center",
            }}>
              Come funziona
            </p>
            <h2 style={{
              color: "var(--ink)",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 900,
              textAlign: "center",
              margin: "0 0 48px",
              letterSpacing: "-0.02em",
            }}>
              Un percorso chiaro, passo dopo passo
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0,1fr))",
              gap: "16px",
            }}
              className="home-steps-grid"
            >
              {steps.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} style={{
                    background: "var(--paper)",
                    border: "1px solid var(--line)",
                    borderRadius: "12px",
                    padding: "24px 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}>
                    <span style={{
                      background: "var(--navy-950)",
                      color: "var(--gold-500)",
                      borderRadius: "50%",
                      width: "32px",
                      height: "32px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      flexShrink: 0,
                    }}>
                      {i + 1}
                    </span>
                    <Icon size={24} color="var(--navy-950)" />
                    <h3 style={{ color: "var(--ink)", fontSize: "0.95rem", fontWeight: 800, margin: 0 }}>{step.title}</h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.55, margin: 0 }}>{step.body}</p>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: "center", marginTop: "36px" }}>
              <Link className={publicStyles.textLink} href="/come-funziona">
                Scopri tutti i dettagli
              </Link>
            </div>
          </div>

          <style>{`
            @media (max-width: 900px) {
              .home-steps-grid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
            }
            @media (max-width: 600px) {
              .home-steps-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>

        {/* ── Operating principles ── */}
        <section style={{
          background: "var(--paper)",
          padding: "clamp(40px,6vw,72px) clamp(16px,4vw,40px)",
        }}>
          <div style={{ maxWidth: "760px", margin: "0 auto 32px", textAlign: "center" }}>
            <p style={{
              color: "#80580c",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              margin: "0 0 10px",
              textTransform: "uppercase",
            }}>
              Come funziona lo scambio
            </p>
            <h2 style={{ color: "var(--ink)", fontSize: "clamp(1.6rem,3vw,2.2rem)", margin: 0 }}>
              Ogni percorso è un impegno reciproco
            </h2>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0,1fr))",
            gap: "24px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
            className="home-stats-grid"
          >
            {pathRules.map((rule) => (
              <article key={rule.title} style={{
                background: "#ffffff",
                border: "1px solid var(--line)",
                borderRadius: "12px",
                padding: "28px 20px",
              }}>
                <h3 style={{
                  color: "var(--navy-950)",
                  fontSize: "1rem",
                  fontWeight: 800,
                  margin: "0 0 6px",
                }}>
                  {rule.title}
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0, lineHeight: 1.55 }}>{rule.body}</p>
              </article>
            ))}
          </div>

          <style>{`
            @media (max-width: 760px) {
              .home-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
            }
            @media (max-width: 480px) {
              .home-stats-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>

        {/* ── CTA section ── */}
        <section style={{
          background: "var(--navy-950)",
          padding: "clamp(56px,8vw,96px) clamp(16px,4vw,40px)",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: "640px", margin: "0 auto" }}>
            <h2 style={{
              color: "#ffffff",
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
              fontWeight: 900,
              margin: "0 0 16px",
              letterSpacing: "-0.02em",
            }}>
              Quello che sai può aiutare qualcuno.
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: "0 0 36px",
            }}>
              E qualcuno può aiutarti a scoprire ciò che ancora non sai. Entra in Socra e inizia a far circolare la conoscenza.
            </p>
            <Link className={publicStyles.actionGold} href="/register">
              Crea il tuo profilo
            </Link>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  );
}
