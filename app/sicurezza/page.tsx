import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Lock, Video, AlertTriangle, Users, Star, CheckCircle } from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "Sicurezza Socra — La tua protezione, la nostra priorità",
  description: "SOCRA è progettata per offrire un ambiente sicuro, trasparente e affidabile. Ogni interazione è basata sul rispetto e sulla chiarezza.",
};

const features = [
  {
    icon: Lock,
    title: "Dati protetti",
    body: "I dati finanziari non escono mai dal tuo profilo privato. Zero link a banche o investimenti",
  },
  {
    icon: Video,
    title: "Call senza registrazione",
    body: "Le sessioni non vengono mai registrate senza consenso esplicito di entrambe le parti",
  },
  {
    icon: Shield,
    title: "Prima call in piattaforma",
    body: "La prima sessione avviene sempre tramite la piattaforma per garantire sicurezza a entrambi",
  },
  {
    icon: CheckCircle,
    title: "Verifica a moderazione",
    body: "Il team modera i profili e può sospendere account in caso di comportamenti scorretti",
  },
  {
    icon: AlertTriangle,
    title: "Zero tolleranza",
    body: "Comportamenti aggressivi, spam o contenuti inappropriati vengono rimossi immediatamente",
  },
  {
    icon: Star,
    title: "Reputazione meritocratica",
    body: "Il feedback bidirezionale costruisce una reputazione trasparente e non falsificabile",
  },
];

const rules = [
  "Rispetto, sempre. I nostri valori sono fondamentali.",
  "No discriminazioni, linguaggio offensivo o comportamenti inappropriati.",
  "Trasparenza con i tuoi partner: sii onesto sui tuoi obiettivi e le tue aspettative.",
  "Aggiornamenti costanti: se qualcosa cambia, informaci sempre.",
];

export default function SicurezzaPage() {
  return (
    <>
      <PublicNavbar />
      <main style={{ paddingTop: "64px" }}>

        {/* ── Hero ── */}
        <section style={{
          background: "#ffffff",
          padding: "clamp(56px,8vw,100px) clamp(16px,4vw,40px)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.2fr) minmax(240px,0.5fr)",
            gap: "clamp(32px,5vw,72px)",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
            className="sic-hero-grid"
          >
            <div>
              <h1 style={{
                color: "var(--ink)",
                fontSize: "clamp(2.2rem, 5vw, 4rem)",
                fontWeight: 900,
                margin: "0 0 24px",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}>
                La tua sicurezza,<br />la nostra priorità.
              </h1>
              <p style={{
                color: "var(--muted)",
                fontSize: "clamp(1rem, 2vw, 1.1rem)",
                lineHeight: 1.7,
                margin: "0 0 28px",
                maxWidth: "55ch",
              }}>
                SOCRA è progettata per offrire un ambiente sicuro, trasparente e affidabile. Ogni interazione è basata sul rispetto e sulla chiarezza.
              </p>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "var(--muted)",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}>
                <Shield size={18} color="var(--gold-500)" />
                Sicurezza by design. Privacy by default.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--gold-500), #ffd36a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 24px 60px rgba(245,182,47,0.3)",
              }}>
                <Shield size={64} color="var(--navy-950)" />
              </div>
            </div>
          </div>

          <style>{`
            @media (max-width: 720px) {
              .sic-hero-grid { grid-template-columns: 1fr !important; }
              .sic-hero-grid > div:last-child { display: none !important; }
            }
          `}</style>
        </section>

        {/* ── Come proteggiamo la community ── */}
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
              Come proteggiamo la community
            </h2>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: "20px",
            }}
              className="sic-features-grid"
            >
              {features.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} style={{
                    background: "#ffffff",
                    border: "1px solid var(--line)",
                    borderRadius: "14px",
                    padding: "28px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "14px",
                  }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "var(--navy-950)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Icon size={20} color="var(--gold-500)" />
                    </div>
                    <h3 style={{ color: "var(--ink)", fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                      {f.title}
                    </h3>
                    <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
                      {f.body}
                    </p>
                    <a href="#" style={{
                      color: "var(--navy-950)",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      marginTop: "auto",
                    }}>
                      Scopri di più →
                    </a>
                  </div>
                );
              })}
            </div>

            <style>{`
              @media (max-width: 900px) {
                .sic-features-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
              }
              @media (max-width: 560px) {
                .sic-features-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </section>

        {/* ── Le nostre regole, il nostro patto ── */}
        <section style={{
          background: "#ffffff",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
            gap: "clamp(32px,5vw,80px)",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
            className="sic-rules-grid"
          >
            <div>
              <h2 style={{
                color: "var(--ink)",
                fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)",
                fontWeight: 900,
                margin: "0 0 24px",
                letterSpacing: "-0.02em",
              }}>
                Le nostre regole,<br />il nostro patto
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {rules.map((rule, i) => (
                  <div key={i} style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                    padding: "16px",
                    background: "var(--paper)",
                    border: "1px solid var(--line)",
                    borderRadius: "10px",
                  }}>
                    <CheckCircle size={18} color="var(--mint-600)" style={{ flexShrink: 0, marginTop: "1px" }} />
                    <p style={{ color: "var(--ink)", fontSize: "0.9rem", lineHeight: 1.55, margin: 0 }}>
                      {rule}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: "16px",
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
            }}>
              <Users size={32} color="var(--navy-950)" />
              <h3 style={{ color: "var(--ink)", fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>
                Community safety prima di tutto
              </h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6, margin: 0 }}>
                SOCRA è progettata attorno alle persone. Ogni funzionalità è pensata per mantenere un ambiente sicuro, rispettoso e trasparente. La fiducia è la nostra valuta più importante.
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
                Trasparenza, rispetto e qualità dell&apos;esperienza sono le nostre linee guida. Un&apos;attività incoerente con questi valori viene segnalata e rimossa rapidamente.
              </p>
            </div>
          </div>

          <style>{`
            @media (max-width: 760px) {
              .sic-rules-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>

        {/* ── Hai bisogno di aiuto? ── */}
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
              Hai bisogno di aiuto?
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.65)",
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: "0 0 32px",
            }}>
              Il nostro team è sempre disponibile. Puoi segnalare qualsiasi problema direttamente dalla piattaforma.
            </p>
            <Link href="/faq" style={{
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
              Contattaci
            </Link>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  );
}
