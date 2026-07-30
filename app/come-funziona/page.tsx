import type { Metadata } from "next";
import Link from "next/link";
import { GraduationCap, Target, Users, BookOpen, TrendingUp, ShieldCheck } from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";
import publicStyles from "@/components/PublicLayout.module.css";

export const metadata: Metadata = {
  title: "Come funziona Socra",
  description: "Dalla survey al feedback: il flusso operativo dei percorsi peer-to-peer di Socra.",
};

const steps = [
  {
    num: 1,
    icon: GraduationCap,
    title: "Scopri il tuo livello",
    body: "Completa la survey iniziale e lascia che Socra adatti l’esperienza al tuo punto di partenza",
  },
  {
    num: 2,
    icon: Target,
    title: "Definisci il tuo obiettivo",
    body: "Scegli l’argomento e il risultato di apprendimento su cui vuoi lavorare",
  },
  {
    num: 3,
    icon: Users,
    title: "Valuta i mentor",
    body: "Socra suggerisce profili coerenti con il tuo obiettivo, il tuo livello e la disponibilità del momento",
  },
  {
    num: 4,
    icon: BookOpen,
    title: "Apri il percorso",
    body: "Mentee e mentor possono proporre un percorso. Quando l'altra persona accetta, si apre e potete organizzare la prima call",
  },
  {
    num: 5,
    icon: TrendingUp,
    title: "Chiudi e lascia feedback",
    body: "Mentee e mentor chiudono il proprio lato e completano il feedback reciproco obbligatorio",
  },
];

const differences = [
  {
    title: "Apprendimento, non consulenza",
    body: "Il percorso serve a imparare e confrontarsi. Non è una raccomandazione finanziaria né una promessa di rendimento",
  },
  {
    title: "Matching che suggerisce",
    body: "La piattaforma ordina i profili compatibili e spiega il suggerimento. Sei sempre tu a scegliere chi contattare",
  },
  {
    title: "Crediti interni",
    body: "I crediti bilanciano i percorsi ricevuti e offerti. Non si acquistano, non si vendono e non si convertono in denaro",
  },
  {
    title: "Feedback reciproco",
    body: "Ogni persona valuta il percorso dal proprio ruolo. Il profilo pubblico mostra solo risultati aggregati",
  },
  {
    title: "Visibilità controllata",
    body: "Livello, argomenti, risultati aggregati e badge possono essere visibili nella community; le risposte dettagliate della survey restano private",
  },
];

export default function ComeFunzionaPage() {
  return (
    <>
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} style={{ paddingTop: "64px" }}>

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
              Un flusso chiaro: profilo, obiettivo, proposta di matching, percorso e feedback.
            </p>
          </div>
        </section>

        {/* ── 5 Step ── */}
        <section style={{
          background: "#ffffff",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <header style={{ maxWidth: "700px", margin: "0 auto 42px", textAlign: "center" }}>
            <p style={{
              color: "#80580c",
              fontSize: "0.72rem",
              fontWeight: 900,
              letterSpacing: "0.17em",
              margin: "0 0 12px",
              textTransform: "uppercase",
            }}>
              In 5 passaggi
            </p>
            <h2 style={{
              color: "var(--ink)",
              fontSize: "clamp(1.7rem, 3.8vw, 2.7rem)",
              fontWeight: 900,
              letterSpacing: "-0.025em",
              margin: 0,
              textWrap: "balance",
            }}>
              Dal primo obiettivo al feedback reciproco
            </h2>
          </header>
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
              Crea il profilo e completa la survey per definire il primo obiettivo di apprendimento.
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
