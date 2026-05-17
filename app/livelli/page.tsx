import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Star, TrendingUp } from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "Livelli Socra — Il percorso di crescita",
  description: "I livelli di SOCRA premiano il tuo impegno, la qualità dei percorsi e il valore che porti alla community.",
};

const levels = [
  {
    code: "L0",
    name: "Principiante",
    stars: 0,
    color: "#e5e9f0",
    textColor: "#647084",
    description: "Stai esplorando. Hai accesso alla community e puoi fare la survey",
    items: [
      "Accesso alla community",
      "Puoi completare la survey",
      "Visibilità profilo base",
    ],
  },
  {
    code: "L1",
    name: "Base",
    stars: 1,
    color: "#eaf1ff",
    textColor: "#2f62d6",
    description: "Hai completato la survey e 1-2 percorsi come mentee",
    items: [
      "Hai completato la survey",
      "1-2 percorsi come mentee",
      "Accesso al matching base",
    ],
  },
  {
    code: "L2",
    name: "Intermedio",
    stars: 2,
    color: "#f0edff",
    textColor: "#6857d6",
    description: "Hai esperienza con 3+ percorsi. Puoi diventare mentor L0-L1",
    items: [
      "3+ percorsi completati",
      "Puoi fare da mentor a L0-L1",
      "Accesso a gruppi tematici",
    ],
  },
  {
    code: "L3",
    name: "Avanzato",
    stars: 3,
    color: "#e7f8ef",
    textColor: "#129b68",
    description: "Mentor qualificato. Priorità nel matching. Accesso a gruppi avanzati",
    items: [
      "Mentor qualificato",
      "Priorità nel matching",
      "Accesso a gruppi avanzati",
    ],
  },
  {
    code: "L4",
    name: "Senior",
    stars: 4,
    color: "#fff4dd",
    textColor: "#b07d1a",
    description: "Mentor esperto e affidabile. Accesso a percorsi enterprise",
    items: [
      "Mentor esperto e affidabile",
      "Accesso percorsi enterprise",
      "Badge di eccellenza",
    ],
  },
  {
    code: "L5",
    name: "Master",
    stars: 5,
    color: "#f5b62f",
    textColor: "#020817",
    description: "Eccellenza assoluta. Contributi allo sviluppo della piattaforma",
    items: [
      "Eccellenza assoluta",
      "Contributi alla piattaforma",
      "Accesso governance community",
    ],
  },
];

const advancement = [
  {
    icon: BookOpen,
    title: "Percorsi completati",
    body: "Ogni percorso come mentee o mentor contribuisce al tuo score di avanzamento",
  },
  {
    icon: Star,
    title: "Feedback di qualità",
    body: "La soddisfazione media dei tuoi partner pesa più della quantità dei percorsi",
  },
  {
    icon: TrendingUp,
    title: "Impatto reale",
    body: "Il valore che hai portato alla community viene misurato e premiato nel tempo",
  },
];

function StarRow({ count, max = 5 }: { count: number; max?: number }) {
  return (
    <div style={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: max }).map((_, i) => (
        <span key={i} style={{
          color: i < count ? "#f5b62f" : "#d8e0ea",
          fontSize: "14px",
          lineHeight: 1,
        }}>★</span>
      ))}
    </div>
  );
}

export default function LivelliPage() {
  return (
    <>
      <PublicNavbar />
      <main style={{ paddingTop: "64px" }}>

        {/* ── Hero ── */}
        <section style={{
          background: "var(--navy-950)",
          backgroundImage: "radial-gradient(circle at 50% 120%, rgba(245,182,47,0.12) 0%, transparent 60%)",
          padding: "clamp(64px,10vw,120px) clamp(16px,4vw,40px)",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: "800px", margin: "0 auto" }}>
            <p style={{
              color: "var(--gold-500)",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 20px",
            }}>
              Un percorso di crescita meritocratico
            </p>
            <h1 style={{
              color: "#ffffff",
              fontSize: "clamp(2.4rem, 6vw, 5rem)",
              fontWeight: 900,
              margin: "0 0 24px",
              letterSpacing: "-0.02em",
              lineHeight: 1.0,
            }}>
              Ogni livello è un<br />nuovo traguardo
            </h1>
            <p style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "clamp(1rem, 2vw, 1.1rem)",
              lineHeight: 1.7,
              margin: 0,
              maxWidth: "52ch",
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              I livelli di SOCRA premiano il tuo impegno, la qualità dei percorsi e il valore che porti alla community.
            </p>
          </div>
        </section>

        {/* ── Livelli grid ── */}
        <section style={{
          background: "var(--paper)",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{
              color: "var(--ink)",
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: 900,
              textAlign: "center",
              margin: "0 0 40px",
              letterSpacing: "-0.01em",
            }}>
              I livelli di SOCRA
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, minmax(0,1fr))",
              gap: "16px",
            }}
              className="livelli-grid"
            >
              {levels.map((level) => (
                <div key={level.code} style={{
                  background: "#ffffff",
                  border: "1px solid var(--line)",
                  borderRadius: "14px",
                  padding: "24px 18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}>
                  <span style={{
                    display: "inline-block",
                    background: level.color,
                    color: level.textColor,
                    borderRadius: "6px",
                    fontSize: "0.72rem",
                    fontWeight: 900,
                    letterSpacing: "0.06em",
                    padding: "4px 10px",
                    width: "fit-content",
                  }}>
                    {level.code}
                  </span>
                  <div>
                    <h3 style={{ color: "var(--ink)", fontSize: "1rem", fontWeight: 800, margin: "0 0 6px" }}>
                      {level.name}
                    </h3>
                    <StarRow count={level.stars} />
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: "0.8rem", lineHeight: 1.55, margin: 0 }}>
                    {level.description}
                  </p>
                  <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {level.items.map((item) => (
                      <li key={item} style={{ color: "var(--muted)", fontSize: "0.78rem", lineHeight: 1.4 }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <style>{`
              @media (max-width: 1100px) {
                .livelli-grid { grid-template-columns: repeat(3, minmax(0,1fr)) !important; }
              }
              @media (max-width: 640px) {
                .livelli-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
              }
              @media (max-width: 400px) {
                .livelli-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ── Come funziona l'avanzamento ── */}
        <section style={{
          background: "#ffffff",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{
              color: "var(--ink)",
              fontSize: "clamp(1.4rem, 3vw, 2rem)",
              fontWeight: 900,
              textAlign: "center",
              margin: "0 0 40px",
              letterSpacing: "-0.01em",
            }}>
              Come funziona l&apos;avanzamento
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: "24px",
            }}
              className="advancement-grid"
            >
              {advancement.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} style={{
                    background: "var(--paper)",
                    border: "1px solid var(--line)",
                    borderRadius: "14px",
                    padding: "32px 28px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "var(--navy-950)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Icon size={22} color="var(--gold-500)" />
                    </div>
                    <h3 style={{ color: "var(--ink)", fontSize: "1.05rem", fontWeight: 800, margin: 0 }}>
                      {item.title}
                    </h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>

            <style>{`
              @media (max-width: 760px) {
                .advancement-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ── CTA ── */}
        <section style={{
          background: "var(--navy-950)",
          padding: "clamp(56px,8vw,96px) clamp(16px,4vw,40px)",
          textAlign: "center",
        }}>
          <div style={{ maxWidth: "560px", margin: "0 auto" }}>
            <p style={{
              color: "var(--gold-500)",
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              margin: "0 0 12px",
            }}>
              Cresci oggi, aspira domani
            </p>
            <h2 style={{
              color: "#ffffff",
              fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
              fontWeight: 900,
              margin: "0 0 16px",
              letterSpacing: "-0.02em",
            }}>
              Scopri il tuo livello attuale
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: "0 0 32px",
            }}>
              Rispondi alla survey in pochi minuti e inizia il tuo percorso.
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
