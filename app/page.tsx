import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Target, Users, BookOpen, TrendingUp } from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "Socra — Impara da chi lo ha già fatto",
  description: "Piattaforma peer-to-peer di mentorship per investitori. Gratuita, trasparente, meritocratica.",
};

const steps = [
  {
    icon: GraduationCap,
    title: "Scopri il livello",
    body: "Rispondi a poche domande e scopri dove sei nel tuo percorso di investimento",
  },
  {
    icon: Target,
    title: "Definisci il tuo obiettivo",
    body: "Cosa vuoi imparare? Quanto vuoi crescere? Definisci il tuo profilo da mentee",
  },
  {
    icon: Users,
    title: "Trova il mentor giusto",
    body: "Il nostro algoritmo ti suggerisce i mentor più affini al tuo livello e obiettivi",
  },
  {
    icon: BookOpen,
    title: "Fai il tuo percorso",
    body: "Incontri reali, apprendimento autentico. La piattaforma facilita senza intromettersi",
  },
  {
    icon: TrendingUp,
    title: "Cresci e fai crescere",
    body: "Accumula reputazione, scala i livelli, diventa mentor tu stesso",
  },
];

const bigStats = [
  { value: "10.000+", label: "persone nella community" },
  { value: "2.500+", label: "mentor qualificati" },
  { value: "18.547", label: "percorsi completati" },
  { value: "4.8/5", label: "soddisfazione media" },
];

export default function HomePage() {
  return (
    <>
      <PublicNavbar />
      <main style={{ paddingTop: "64px" }}>

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
                Community membership peer-to-peer
              </p>
              <h1 style={{
                color: "#ffffff",
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                fontWeight: 900,
                lineHeight: 1.0,
                margin: "0 0 24px",
                letterSpacing: "-0.02em",
              }}>
                Impara da chi<br />lo ha già fatto.
              </h1>
              <p style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: "clamp(1rem, 2vw, 1.15rem)",
                lineHeight: 1.7,
                maxWidth: "52ch",
                margin: "0 0 36px",
              }}>
                SOCRA è una piattaforma gratuita in cui persone reali ti aiutano a raggiungere i tuoi obiettivi finanziari. Peer-to-peer. Trasparente. Meritocratica.
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
                  ▶ Guarda il video
                </a>
              </div>
            </div>

            {/* Right: stats panel */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px",
              padding: "clamp(20px,3vw,32px)",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}>
              <div style={{
                background: "rgba(245,182,47,0.08)",
                border: "1px solid rgba(245,182,47,0.2)",
                borderRadius: "12px",
                padding: "20px 24px",
              }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", fontWeight: 600, margin: "0 0 4px" }}>
                  Obiettivi raggiunti
                </p>
                <p style={{ color: "#ffffff", fontSize: "3rem", fontWeight: 900, lineHeight: 1, margin: "0 0 4px" }}>78%</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", margin: 0 }}>dai mentee attivi sulla piattaforma</p>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "20px 24px",
              }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", fontWeight: 600, margin: "0 0 4px" }}>
                  La formazione
                </p>
                <p style={{ color: "#ffffff", fontSize: "3rem", fontWeight: 900, lineHeight: 1, margin: "0 0 4px" }}>92%</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", margin: 0 }}>soddisfazione</p>
              </div>
              <div style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                padding: "20px 24px",
              }}>
                <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.8rem", fontWeight: 600, margin: "0 0 4px" }}>
                  Percorsi completati
                </p>
                <p style={{ color: "var(--gold-500)", fontSize: "2.4rem", fontWeight: 900, lineHeight: 1, margin: "0 0 4px" }}>18.547</p>
                <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", margin: 0 }}>nella community</p>
              </div>
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

        {/* ── Stats strip ── */}
        <section style={{
          background: "var(--paper)",
          padding: "clamp(40px,6vw,72px) clamp(16px,4vw,40px)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0,1fr))",
            gap: "24px",
            maxWidth: "1200px",
            margin: "0 auto",
            textAlign: "center",
          }}
            className="home-stats-grid"
          >
            {bigStats.map(s => (
              <div key={s.label} style={{
                background: "#ffffff",
                border: "1px solid var(--line)",
                borderRadius: "12px",
                padding: "28px 20px",
              }}>
                <p style={{
                  color: "var(--navy-950)",
                  fontSize: "clamp(1.8rem, 3vw, 2.4rem)",
                  fontWeight: 900,
                  margin: "0 0 6px",
                  letterSpacing: "-0.02em",
                }}>
                  {s.value}
                </p>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0, lineHeight: 1.4 }}>{s.label}</p>
              </div>
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
              Unisciti a oltre 10.000 persone che stanno già imparando con SOCRA.
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
