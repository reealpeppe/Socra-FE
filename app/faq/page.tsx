import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";
import { FaqTabs } from "./FaqTabs";

export const metadata: Metadata = {
  title: "FAQ Socra — Le domande più frequenti",
  description: "Tutto quello che ti serve sapere su SOCRA. Se non trovi la risposta che cerchi, siamo qui per aiutarti.",
};

export default function FaqPage() {
  return (
    <>
      <PublicNavbar />
      <main style={{ paddingTop: "64px" }}>

        {/* ── Header ── */}
        <section style={{
          background: "var(--navy-950)",
          padding: "clamp(56px,8vw,96px) clamp(16px,4vw,40px)",
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1.1fr) minmax(260px,0.6fr)",
            gap: "clamp(32px,5vw,72px)",
            alignItems: "center",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
            className="faq-hero-grid"
          >
            <div>
              <h1 style={{
                color: "#ffffff",
                fontSize: "clamp(2.2rem, 5vw, 4rem)",
                fontWeight: 900,
                margin: "0 0 20px",
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
              }}>
                Le domande<br />
                <span style={{ color: "var(--gold-500)" }}>più frequenti</span>
              </h1>
              <p style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
                lineHeight: 1.7,
                margin: 0,
                maxWidth: "52ch",
              }}>
                Tutto quello che ti serve sapere su SOCRA è qui sotto. Se non trovi la risposta che cerchi, siamo qui per aiutarti.
              </p>
            </div>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "28px 24px",
            }}>
              <p style={{ color: "var(--gold-500)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 12px" }}>
                Sicurezza e fiducia prima di tutto
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", lineHeight: 1.6, margin: "0 0 16px" }}>
                SOCRA è progettata per garantire un ambiente sicuro. Trasparente e meritocratico.
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>
                La tua registrazione è sempre al sicuro.
              </p>
            </div>
          </div>

          <style>{`
            @media (max-width: 760px) {
              .faq-hero-grid { grid-template-columns: 1fr !important; }
              .faq-hero-grid > div:last-child { display: none !important; }
            }
          `}</style>
        </section>

        {/* ── FAQ content ── */}
        <section style={{
          background: "var(--paper)",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            <FaqTabs />
          </div>
        </section>

        {/* ── Bottom contact section ── */}
        <section style={{
          background: "#ffffff",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
            <h2 style={{
              color: "var(--ink)",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              fontWeight: 900,
              textAlign: "center",
              margin: "0 0 12px",
              letterSpacing: "-0.02em",
            }}>
              Non hai trovato la risposta che cercavi?
            </h2>
            <p style={{
              color: "var(--muted)",
              textAlign: "center",
              fontSize: "1rem",
              margin: "0 0 40px",
            }}>
              Il nostro team è sempre disponibile.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0,1fr))",
              gap: "20px",
            }}
              className="faq-contact-grid"
            >
              <div style={{
                border: "1px solid var(--line)",
                borderRadius: "14px",
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Mail size={20} color="var(--navy-950)" />
                </div>
                <h3 style={{ color: "var(--ink)", fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                  Scrivici una email
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>
                  Risposta entro 24 ore lavorative
                </p>
                <a href="mailto:support@socra.io" style={{
                  color: "var(--navy-950)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  marginTop: "auto",
                }}>
                  support@socra.io →
                </a>
              </div>

              <div style={{
                border: "1px solid var(--line)",
                borderRadius: "14px",
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "var(--paper)",
                  border: "1px solid var(--line)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <MessageCircle size={20} color="var(--navy-950)" />
                </div>
                <h3 style={{ color: "var(--ink)", fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                  Chat live
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>
                  Risposta in pochi minuti durante gli orari lavorativi
                </p>
                <a href="#" style={{
                  color: "var(--navy-950)",
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  marginTop: "auto",
                }}>
                  Avvia chat →
                </a>
              </div>

              <div style={{
                background: "var(--navy-950)",
                borderRadius: "14px",
                padding: "28px 24px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                alignItems: "flex-start",
              }}>
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <MessageCircle size={20} color="var(--gold-500)" />
                </div>
                <h3 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                  Apri una chat
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>
                  Direttamente dalla piattaforma. Sempre disponibile per gli utenti registrati.
                </p>
                <Link href="/register" style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--gold-500)",
                  color: "var(--navy-950)",
                  fontWeight: 800,
                  fontSize: "0.875rem",
                  padding: "10px 20px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  marginTop: "auto",
                }}>
                  Contattaci →
                </Link>
              </div>
            </div>

            <style>{`
              @media (max-width: 760px) {
                .faq-contact-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
          </div>
        </section>

      </main>
      <PublicFooter />
    </>
  );
}
