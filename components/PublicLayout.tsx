"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/Brand";
import styles from "./PublicLayout.module.css";

const navLinks = [
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/community", label: "Community" },
  { href: "/livelli", label: "Livelli" },
  { href: "/sicurezza", label: "Sicurezza" },
  { href: "/faq", label: "FAQ" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      toggleRef.current?.focus();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [mobileOpen]);

  function isCurrent(href: string) {
    return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <>
      <a className="skip-link" href="#main-content">Vai al contenuto principale</a>
      <nav className={styles.nav} aria-label="Navigazione pubblica">
        <Link
          href="/"
          className={styles.brandLink}
          aria-current={pathname === "/" ? "page" : undefined}
          aria-label="Socra, pagina iniziale"
          onClick={closeMobileMenu}
        >
          <Brand variant="light" />
        </Link>
        <div className={styles.navLinks}>
          {navLinks.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={styles.navLink}
              aria-current={isCurrent(l.href) ? "page" : undefined}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <div className={styles.navActions}>
          <Link
            href="/login"
            className={styles.loginLink}
            aria-current={pathname === "/login" ? "page" : undefined}
          >
            Accedi
          </Link>
          <Link
            href="/register"
            className={styles.navCta}
            aria-current={pathname === "/register" ? "page" : undefined}
            onClick={closeMobileMenu}
          >
            <span className={styles.fullCta}>Inizia ora</span>
            <span className={styles.shortCta}>Inizia</span>
          </Link>
          <button
            aria-controls="public-mobile-menu"
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Chiudi menu" : "Apri menu"}
            className={styles.mobileToggle}
            onClick={() => setMobileOpen((current) => !current)}
            ref={toggleRef}
            type="button"
          >
            {mobileOpen ? <X aria-hidden="true" size={21} /> : <Menu aria-hidden="true" size={21} />}
          </button>
        </div>
        {mobileOpen ? (
          <div className={styles.mobilePanel} id="public-mobile-menu">
            {navLinks.map((link) => (
              <Link
                aria-current={isCurrent(link.href) ? "page" : undefined}
                className={styles.navLink}
                href={link.href}
                key={link.href}
                onClick={closeMobileMenu}
              >
                {link.label}
              </Link>
            ))}
            <div aria-hidden="true" className={styles.mobileDivider} />
            <Link
              aria-current={pathname === "/login" ? "page" : undefined}
              className={styles.loginLink}
              href="/login"
              onClick={closeMobileMenu}
            >
              Accedi al tuo account
            </Link>
          </div>
        ) : null}
      </nav>
    </>
  );
}

export function PublicFooter() {
  const pathname = usePathname();
  const year = 2026;

  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <Link className={styles.brandLink} href="/" aria-label="Socra, pagina iniziale">
            <Brand variant="light" />
          </Link>
          <p className={styles.footerTagline}>Incontri tra persone, obiettivi chiari e responsabilità reciproca.</p>
        </div>
        <div className={styles.footerNavGroup}>
          <p className={styles.footerNavLabel}>Esplora</p>
          <nav aria-label="Navigazione nel piè di pagina" className={styles.footerNav}>
          {navLinks.map(l => (
              <Link
                aria-current={pathname === l.href ? "page" : undefined}
                className={styles.footerLink}
                key={l.href}
                href={l.href}
              >
                {l.label}
              </Link>
          ))}
          </nav>
        </div>
        <div className={styles.footerMeta}>
          <nav aria-label="Informazioni legali" className={styles.footerNav}>
            <Link
              aria-current={pathname === "/termini" ? "page" : undefined}
              className={styles.footerLink}
              href="/termini"
            >
              Termini
            </Link>
            <Link
              aria-current={pathname === "/privacy" ? "page" : undefined}
              className={styles.footerLink}
              href="/privacy"
            >
              Privacy
            </Link>
          </nav>
          <p className={styles.copyright}>© {year} Socra. Community peer-to-peer.</p>
        </div>
      </div>
    </footer>
  );
}
