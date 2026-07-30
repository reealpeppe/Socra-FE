import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Target, Users, BookOpen, TrendingUp } from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "Socra — Impara con un percorso peer-to-peer",
  description: "Percorsi di apprendimento sugli investimenti tra mentee e mentor, con matching, crediti interni e feedback reciproco.",
};

const steps = [
  {
    icon: GraduationCap,
    title: "Scopri il livello",
    body: "Completa la survey guidata e trova un punto di partenza coerente con la tua esperienza",
  },
  {
    icon: Target,
    title: "Definisci il tuo obiettivo",
    body: "Scegli l'area e il risultato di apprendimento su cui vuoi lavorare come mentee",
  },
  {
    icon: Users,
    title: "Valuta i mentor suggeriti",
    body: "Socra propone profili compatibili e una motivazione sintetica. La scelta resta tua",
  },
  {
    icon: BookOpen,
    title: "Apri il percorso",
    body: "Dopo l'accettazione del mentor, organizzate la prima call e portate avanti l'obiettivo",
  },
  {
    icon: TrendingUp,
    title: "Chiudi con il feedback",
    body: "Entrambe le persone chiudono il proprio lato e lasciano il feedback previsto",
  },
];

const operatingPillars = [
  {
    title: "Matching spiegabile",
    body: "Vedi una compatibilità finale e una motivazione leggibile, non i punteggi interni dell'algoritmo.",
  },
  {
    title: "Unità interne non monetizzabili",
    body: "Le unità di partecipazione bilanciano il dare e il ricevere: non si acquistano e non si convertono in denaro.",
  },
  {
    title: "Reputazione aggregata",
    body: "I feedback alimentano badge e metriche sintetiche, senza pubblicare singoli voti.",
  },
];

const pathRules = [
  {
    title: "Accettazione esplicita",
    body: "Mentee e mentor possono proporre un percorso. Si apre solo quando l'altra persona accetta.",
  },
  {
    title: "Prima call collegata",
    body: "Socra crea il link della prima call e conserva nel percorso i metadati operativi previsti.",
  },
  {
    title: "Chiusura da entrambi i lati",
    body: "Il completamento richiede la chiusura e il feedback obbligatorio di mentee e mentor.",
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
                Apprendimento peer-to-peer
              </p>
              <h1 style={{
                color: "#ffffff",
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                fontWeight: 900,
                lineHeight: 1.0,
                margin: "0 0 24px",
                letterSpacing: "-0.02em",
              }}>
                Impara con chi<br />ha esperienza.
              </h1>
              <p style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "clamp(1rem, 2vw, 1.15rem)",
                lineHeight: 1.7,
                maxWidth: "52ch",
                margin: "0 0 36px",
              }}>
                SOCRA mette in contatto persone che vogliono imparare e persone disponibili a condividere esperienza sugli investimenti. Un obiettivo alla volta, dentro un percorso tracciabile.
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}>
                <Link href="/register" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--gold-500)",
                  color: "var(--navy-950)",
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  padding: "14px 28px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}>
                  Scopri il tuo livello →
                </Link>
                <a href="#come-funziona" style={{
                  color: "rgba(255,255,255,0.75)",
                  fontSize: "0.95rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
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
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <p style={{
              color: "var(--gold-500)",
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
              <Link href="/come-funziona" style={{
                color: "var(--navy-950)",
                fontWeight: 700,
                fontSize: "0.9rem",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}>
                Scopri tutti i dettagli →
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
              color: "var(--gold-500)",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              margin: "0 0 10px",
              textTransform: "uppercase",
            }}>
              Regole essenziali
            </p>
            <h2 style={{ color: "var(--ink)", fontSize: "clamp(1.6rem,3vw,2.2rem)", margin: 0 }}>
              Cosa rende operativo un percorso
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
              Pronto a iniziare il tuo percorso?
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: "0 0 36px",
            }}>
              Crea il profilo, completa la survey e definisci il primo obiettivo di apprendimento.
            </p>
            <Link href="/register" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--gold-500)",
              color: "var(--navy-950)",
              fontWeight: 800,
              fontSize: "1rem",
              padding: "16px 36px",
              borderRadius: "999px",
              textDecoration: "none",
            }}>
              Inizia ora →
            </Link>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  );
}
