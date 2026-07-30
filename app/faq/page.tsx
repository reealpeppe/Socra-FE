import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";
import publicStyles from "@/components/PublicLayout.module.css";
import { FaqTabs } from "./FaqTabs";
import tabStyles from "./FaqTabs.module.css";

export const metadata: Metadata = {
  title: "FAQ Socra — Domande sulla community",
  description: "Risposte aggiornate su percorsi, crediti, matching, reputazione, sicurezza e account Socra.",
};

export default function FaqPage() {
  return (
    <>
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} style={{ paddingTop: "64px" }}>
        <section style={{
          background: "var(--navy-950)",
          padding: "clamp(56px,8vw,96px) clamp(16px,4vw,40px)",
        }}>
          <div
            className="faq-hero-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,1.1fr) minmax(260px,0.6fr)",
              gap: "clamp(32px,5vw,72px)",
              alignItems: "center",
              maxWidth: "1200px",
              margin: "0 auto",
            }}
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
                Domande sulla<br />
                <span style={{ color: "var(--gold-500)" }}>community Socra</span>
              </h1>
              <p style={{
                color: "rgba(255,255,255,0.65)",
                fontSize: "clamp(0.95rem, 2vw, 1.05rem)",
                lineHeight: 1.7,
                margin: 0,
                maxWidth: "54ch",
              }}>
                Tutto ciò che serve per iniziare con aspettative chiare: percorsi, matching, crediti, privacy e sicurezza.
              </p>
            </div>
            <aside className="faq-hero-aside" style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "16px",
              padding: "28px 24px",
            }}>
              <p style={{
                color: "var(--gold-500)",
                fontSize: "0.75rem",
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                margin: "0 0 12px",
              }}>
                Una distinzione importante
              </p>
              <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.875rem", lineHeight: 1.6, margin: "0 0 16px" }}>
                SOCRA facilita percorsi di apprendimento tra persone. Non offre consulenza finanziaria e non garantisce rendimenti.
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", lineHeight: 1.5, margin: 0 }}>
                I crediti della piattaforma sono interni, non acquistabili e non monetizzabili.
              </p>
            </aside>
          </div>

          <style>{`
            @media (max-width: 760px) {
              .faq-hero-grid { grid-template-columns: 1fr !important; }
            }
          `}</style>
        </section>

        <section style={{
          background: "var(--paper)",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{ maxWidth: "860px", margin: "0 auto" }}>
            <Suspense fallback={<p className={tabStyles.loading} role="status">Caricamento domande…</p>}>
              <FaqTabs />
            </Suspense>
          </div>
        </section>

        <section style={{
          background: "#ffffff",
          padding: "clamp(48px,7vw,88px) clamp(16px,4vw,40px)",
        }}>
          <div style={{ maxWidth: "900px", margin: "0 auto" }}>
            <h2 style={{
              color: "var(--ink)",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              fontWeight: 900,
              textAlign: "center",
              margin: "0 0 12px",
              letterSpacing: "-0.02em",
            }}>
              Hai un problema operativo?
            </h2>
            <p style={{
              color: "var(--muted)",
              textAlign: "center",
              fontSize: "1rem",
              lineHeight: 1.6,
              margin: "0 auto 40px",
              maxWidth: "62ch",
            }}>
              Usa gli strumenti disponibili nel percorso e fornisci sempre il contesto necessario. Le segnalazioni vengono valutate, ma non hanno tempi di risposta garantiti.
            </p>

            <div
              className="faq-contact-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0,1fr))",
                gap: "20px",
              }}
            >
              <article style={{
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
                  <AlertTriangle aria-hidden="true" size={20} color="var(--navy-950)" />
                </div>
                <h3 style={{ color: "var(--ink)", fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                  Problema in un percorso
                </h3>
                <p style={{ color: "var(--muted)", fontSize: "0.875rem", lineHeight: 1.55, margin: 0 }}>
                  Apri il dettaglio del percorso e usa “Segnala problema”. La segnalazione entra nella coda di revisione manuale.
                </p>
                <Link className={publicStyles.textLink} href="/paths" style={{ marginTop: "auto" }}>
                  Apri i tuoi percorsi
                </Link>
              </article>

              <article style={{
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
                  <ShieldCheck aria-hidden="true" size={20} color="var(--gold-500)" />
                </div>
                <h3 style={{ color: "#ffffff", fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                  Prima di iniziare
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", lineHeight: 1.55, margin: 0 }}>
                  Leggi come funzionano prima call, dati visibili, presenza e revisione delle segnalazioni.
                </p>
                <Link className={publicStyles.actionGold} href="/sicurezza" style={{ marginTop: "auto" }}>
                  Leggi le regole
                </Link>
              </article>
            </div>

            <style>{`
              @media (max-width: 700px) {
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
