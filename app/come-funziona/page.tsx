import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Target, Users, BookOpen, TrendingUp, ShieldCheck } from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "Come funziona Socra",
  description: "Un percorso semplice, umano e meritocratico. Impara da chi lo ha già fatto.",
};

const steps = [
  {
    num: 1,
    icon: GraduationCap,
    title: "Scopri il tuo livello",
    body: "Rispondi a poche domande per scoprire il tuo livello d'investimento attuale",
  },
  {
    num: 2,
    icon: Target,
    title: "Definisci il tuo obiettivo",
    body: "Cosa vuoi imparare, in che tempo e con quale approccio. La piattaforma ti guida",
  },
  {
    num: 3,
    icon: Users,
    title: "Trova il mentor giusto",
    body: "Il nostro matching suggerisce le persone più in linea con il tuo livello (max ±1)",
  },
  {
    num: 4,
    icon: BookOpen,
    title: "Fai il tuo percorso",
    body: "Impara, applica, metti in pratica con il supporto del tuo mentor",
  },
  {
    num: 5,
    icon: TrendingUp,
    title: "Cresci e fai crescere",
    body: "Accumula reputation, scala i livelli, diventa mentor a tua volta",
  },
];

const differences = [
  {
    title: "No pay, no coins, no vendite",
    body: "Non vendiamo corsi, consulenze o prodotti finanziari. Zero conflitti di interesse",
  },
  {
    title: "No AI nel matching",
    body: "Le persone scelgono le persone, non un algoritmo. Il matching ti suggerisce, decidi tu",
  },
  {
    title: "Gratuito",
    body: "Puoi iniziare il tuo percorso senza spendere nulla. La valuta interna è non monetizzabile",
  },
  {
    title: "Meritocrazia",
    body: "I livelli si guadagnano con i percorsi e il feedback. Non con l'anzianità o il portfolio",
  },
  {
    title: "Privacy by design",
    body: "I dati finanziari non appaiono mai in pubblico. Solo info utili al matching",
  },
];

export default function ComeFunzionaPage() {
  return (
    <>
      <PublicNavbar />
      <main style={{ paddingTop: "64px" }}>

        {/* ── Header ── */}
        <section style={{
          background: "var(--paper)",
          padding: "clamp(56px,8vw,96px) clamp(16px,4vw,40px)",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: "760px", margin: "0 auto" }}>
            <h1 style={{
              color: "var(--ink)",
              fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
              fontWeight: 900,
              margin: "0 0 20px",
              letterSpacing: "-0.02em",
            }}>
              Come funziona{" "}
              <span style={{ color: "var(--navy-950)" }}>SOCRA</span>
            </h1>
            <p style={{
              color: "var(--muted)",
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              lineHeight: 1.7,
              margin: 0,
            }}>
              Un percorso semplice, umano e meritocratico. Impara da chi lo ha già fatto.
            </p>
          </div>
        </section>

        {/* ── 5 Step ── */}
        <section style={{
          background: "#ffffff",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0,1fr))",
            gap: "20px",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
            className="cf-steps-grid"
          >
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div key={step.num} style={{
                  border: "1px solid var(--line)",
                  borderRadius: "16px",
                  padding: "28px 22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  position: "relative",
                }}>
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "var(--navy-950)",
                    color: "var(--gold-500)",
                    fontSize: "0.9rem",
                    fontWeight: 900,
                    flexShrink: 0,
                  }}>
                    {step.num}
                  </span>
                  <Icon size={28} color="var(--navy-950)" />
                  <h3 style={{ color: "var(--ink)", fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                    {step.title}
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                    {step.body}
                  </p>
                </div>
              );
            })}
          </div>

          <style>{`
            @media (max-width: 1000px) {
              .cf-steps-grid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
            }
            @media (max-width: 640px) {
              .cf-steps-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
            }
            @media (max-width: 420px) {
              .cf-steps-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>

        {/* ── Perché SOCRA è diverso ── */}
        <section style={{
          background: "var(--paper)",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{
              color: "var(--ink)",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              fontWeight: 900,
              textAlign: "center",
              margin: "0 0 40px",
              letterSpacing: "-0.02em",
            }}>
              Perché SOCRA è diverso
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0,1fr))",
              gap: "16px",
            }}
              className="cf-diff-grid"
            >
              {differences.map((d) => (
                <div key={d.title} style={{
                  background: "#ffffff",
                  border: "1px solid var(--line)",
                  borderRadius: "12px",
                  padding: "24px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}>
                  <ShieldCheck size={22} color="var(--gold-500)" />
                  <h3 style={{ color: "var(--ink)", fontSize: "0.9rem", fontWeight: 800, margin: 0 }}>
                    {d.title}
                  </h3>
                  <p style={{ color: "var(--muted)", fontSize: "0.82rem", lineHeight: 1.55, margin: 0 }}>
                    {d.body}
                  </p>
                </div>
              ))}
            </div>

            <style>{`
              @media (max-width: 1000px) {
                .cf-diff-grid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
              }
              @media (max-width: 640px) {
                .cf-diff-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
              }
              @media (max-width: 420px) {
                .cf-diff-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ── CTA bottom ── */}
        <section style={{
          background: "var(--navy-950)",
          padding: "clamp(56px,8vw,96px) clamp(16px,4vw,40px)",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <h2 style={{
              color: "#ffffff",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
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
              margin: "0 0 32px",
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
              padding: "14px 32px",
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
