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
    title: "Parti da ciò che sai",
    body: "Completa la survey iniziale: raccontaci le tue esperienze, cosa conosci già e cosa puoi condividere.",
  },
  {
    num: 2,
    icon: Target,
    title: "Definisci i tuoi obiettivi",
    body: "Scegli l’argomento, il risultato che vuoi raggiungere e il tipo di confronto: dalle basi al metodo, fino a un approfondimento avanzato.",
  },
  {
    num: 3,
    icon: Users,
    title: "Incontra le persone giuste",
    body: "Socra ti propone chi può aiutarti nel tuo obiettivo e ti mette in contatto con chi può beneficiare della tua esperienza. I risultati dei percorsi migliorano i suggerimenti nel tempo.",
  },
  {
    num: 4,
    icon: BookOpen,
    title: "Inizia un percorso",
    body: "Mentor e apprendista si scelgono reciprocamente. Dopo l’accettazione, chiarite insieme l’obiettivo e organizzate i vostri incontri.",
  },
  {
    num: 5,
    icon: TrendingUp,
    title: "Condividi il feedback e continua a crescere",
    body: "Al termine, entrambi chiudete il percorso e lasciate il feedback. Ciò che avete imparato e condiviso contribuisce alla qualità della community.",
  },
];

const differences = [
  {
    title: "Impari, non ricevi consigli finanziari",
    body: "In Socra si condividono conoscenze ed esperienze per capire e crescere. Il confronto non serve a indicare dove investire e non promette risultati finanziari.",
  },
  {
    title: "Le persone giuste, per te",
    body: "Socra suggerisce persone compatibili con ciò che vuoi approfondire, ti spiega perché e lascia a te la scelta. Non sempre esiste un profilo adatto disponibile.",
  },
  {
    title: "Dai valore, ricevi valore",
    body: "I crediti mantengono vivo lo scambio: condividendo ciò che sai puoi accedere all’esperienza degli altri. Non si comprano, non si vendono e non hanno valore economico.",
  },
  {
    title: "La fiducia si costruisce insieme",
    body: "Al termine di ogni percorso mentor e apprendista si valutano reciprocamente. I feedback contribuiscono alla reputazione, senza rendere pubblici i singoli voti.",
  },
  {
    title: "Tu controlli ciò che condividi",
    body: "La community vede le informazioni utili a creare fiducia e connessioni. Le risposte dettagliate della survey, gli importi e le valutazioni interne restano privati.",
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
              <span style={{ color: "var(--navy-950)" }}>Socra</span>
            </h1>
            <p style={{
              color: "var(--muted)",
              fontSize: "clamp(1rem, 2vw, 1.15rem)",
              lineHeight: 1.7,
              margin: 0,
            }}>
              Entra nella community, racconta cosa vuoi imparare e cosa puoi condividere. Socra favorisce connessioni che trasformano l’esperienza di ognuno in valore per gli altri.
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
              Perché Socra è diverso
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
              Pronto a entrare in Socra?
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: "0 0 32px",
            }}>
              Crea il tuo profilo e raccontaci cosa vuoi imparare e cosa puoi condividere. Socra ti aiuta a trovare con chi confrontarti.
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
