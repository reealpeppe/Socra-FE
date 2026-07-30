import type { Metadata } from "next";
import Link from "next/link";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "Community Socra — Incontri che diventano percorsi",
  description: "La community Socra prende forma nei percorsi uno-a-uno tra mentee e mentor.",
};

export default function CommunityPage() {
  return (
    <>
      <PublicNavbar />
      <main id="main-content" tabIndex={-1} style={{ paddingTop: "64px", minHeight: "60vh" }}>
        <section style={{
          textAlign: "center",
          padding: "clamp(80px, 12vw, 140px) clamp(16px, 4vw, 40px) clamp(60px, 8vw, 100px)",
          background: "var(--paper)",
          minHeight: "60vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <span style={{
            color: "var(--muted)",
            fontSize: "0.72rem",
            fontWeight: 800,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "16px",
          }}>
            Una community, una relazione alla volta
          </span>
          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 900,
            margin: "0 0 24px",
            color: "var(--ink)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            La community nasce<br />nei percorsi
          </h1>
          <p style={{
            color: "var(--muted)",
            maxWidth: "500px",
            margin: "0 auto 36px",
            lineHeight: 1.65,
            fontSize: "1rem",
          }}>
            Socra mette in relazione mentee e mentor in percorsi uno-a-uno. Il valore nasce dal confronto diretto, da obiettivi chiari e dalla responsabilità reciproca.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
            <Link href="/come-funziona" style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--navy-950)",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.95rem",
              padding: "14px 28px",
              borderRadius: "999px",
              textDecoration: "none",
            }}>
              Scopri i percorsi →
            </Link>
            <Link href="/register" style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1px solid var(--line)",
              borderRadius: "999px",
              color: "var(--navy-950)",
              fontSize: "0.95rem",
              fontWeight: 800,
              padding: "14px 28px",
              textDecoration: "none",
            }}>
              Crea il profilo
            </Link>
          </div>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
