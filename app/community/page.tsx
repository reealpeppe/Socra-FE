import type { Metadata } from "next";
import { PublicNavbar, PublicFooter } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "Community Socra",
  description: "Spazi di confronto, gruppi tematici e discussioni aperte tra mentee e mentor. Presto disponibile.",
};

export default function CommunityPage() {
  return (
    <>
      <PublicNavbar />
      <main style={{ paddingTop: "64px", minHeight: "60vh" }}>
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
            In arrivo
          </span>
          <h1 style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 900,
            margin: "0 0 24px",
            color: "var(--ink)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
          }}>
            La community di Socra<br />sta crescendo
          </h1>
          <p style={{
            color: "var(--muted)",
            maxWidth: "500px",
            margin: "0 auto 36px",
            lineHeight: 1.65,
            fontSize: "1rem",
          }}>
            Spazi di confronto, gruppi tematici e discussioni aperte tra mentee e mentor. Presto disponibile.
          </p>
          <a href="/register" style={{
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
            Inizia ora →
          </a>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
