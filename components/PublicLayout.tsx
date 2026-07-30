"use client";
import Link from "next/link";
import { Brand } from "@/components/Brand";

const navLinks = [
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/community", label: "Community" },
  { href: "/livelli", label: "Livelli" },
  { href: "/sicurezza", label: "Sicurezza" },
  { href: "/faq", label: "FAQ" },
];

export function PublicNavbar() {
  return (
    <>
      <a className="skip-link" href="#main-content">Vai al contenuto principale</a>
      <nav className="public-nav" aria-label="Navigazione pubblica">
        <Link href="/" style={{ textDecoration: "none" }} aria-label="Socra, pagina iniziale">
          <Brand variant="light" />
        </Link>
        <div className="public-nav-links">
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} className="public-nav-link">{l.label}</Link>
          ))}
        </div>
        <div className="public-nav-actions">
          <Link href="/login" className="public-nav-login">Accedi</Link>
          <Link href="/register" className="public-nav-cta">Inizia ora →</Link>
        </div>
      </nav>
    </>
  );
}

export function PublicFooter() {
  return (
    <footer style={{
      background: "var(--navy-950)",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      color: "rgba(255,255,255,0.5)",
      padding: "40px clamp(16px,4vw,40px)",
    }}>
      <div style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "24px", justifyContent: "space-between", maxWidth: "1200px", margin: "0 auto" }}>
        <Brand variant="light" />
        <nav aria-label="Navigazione nel piè di pagina" style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "24px" }}>
          {navLinks.map(l => (
            <Link key={l.href} href={l.href} style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.875rem", textDecoration: "none" }}>{l.label}</Link>
          ))}
        </nav>
        <p style={{ fontSize: "0.8rem", margin: 0 }}>© 2026 Socra. Apprendimento peer-to-peer sugli investimenti.</p>
      </div>
    </footer>
  );
}
