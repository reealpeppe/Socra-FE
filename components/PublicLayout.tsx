"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { Brand } from "@/components/Brand";
import { ClientApiError, clientGet } from "@/lib/api";
import type { UserMe } from "@/lib/types";
import styles from "./PublicLayout.module.css";

const navLinks = [
  { href: "/come-funziona", label: "Come funziona" },
  { href: "/community", label: "Community" },
  { href: "/sicurezza", label: "Sicurezza" },
  { href: "/faq", label: "FAQ" },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionState, setSessionState] = useState<"loading" | "authenticated" | "anonymous" | "error">("loading");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const requestIdRef = useRef(0);

  const refreshSession = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    try {
      await clientGet<UserMe>("/auth/me");
      if (requestId === requestIdRef.current) setSessionState("authenticated");
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      if (error instanceof ClientApiError && error.status === 401) {
        setSessionState("anonymous");
      } else {
        setSessionState((current) => current === "authenticated" ? current : "error");
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) void refreshSession(); });
    window.addEventListener("socra:session-refresh", refreshSession);
    return () => {
      active = false;
      requestIdRef.current += 1;
      window.removeEventListener("socra:session-refresh", refreshSession);
    };
  }, [refreshSession]);

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
        <Link prefetch={true}
          href="/"
          className={styles.brandLink}
          aria-current={pathname === "/" ? "page" : undefined}
          aria-label="Socra, pagina iniziale"
          onClick={closeMobileMenu}
        >
          <Brand variant="dark" />
        </Link>
        <div className={styles.navLinks}>
          {navLinks.map(l => (
            <Link prefetch={true}
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
          {sessionState === "authenticated" ? (
            <Link prefetch={true} href="/dashboard" aria-label="Torna alla community" className={styles.navCta} onClick={closeMobileMenu}>
              <span className={styles.fullCta}>Torna alla community</span>
              <span className={styles.shortCta}>Community</span>
            </Link>
          ) : sessionState === "anonymous" ? (
            <>
              <Link prefetch={true} href="/login" className={styles.loginLink} aria-current={pathname === "/login" ? "page" : undefined}>Accedi</Link>
              <Link prefetch={true} href="/register" aria-label="Inizia ora" className={styles.navCta} aria-current={pathname === "/register" ? "page" : undefined} onClick={closeMobileMenu}>
                <span className={styles.fullCta}>Inizia ora</span>
                <span className={styles.shortCta}>Inizia</span>
              </Link>
            </>
          ) : sessionState === "error" ? (
            <button className={styles.retryButton} type="button" onClick={() => void refreshSession()}>Riprova</button>
          ) : (
            <span className={styles.sessionLoading} role="status">Verifica sessione…</span>
          )}
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
              <Link prefetch={true}
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
            {sessionState === "authenticated" ? (
              <Link prefetch={true} className={styles.navLink} href="/dashboard" onClick={closeMobileMenu}>Torna alla community</Link>
            ) : sessionState === "anonymous" ? (
              <Link prefetch={true} aria-current={pathname === "/login" ? "page" : undefined} className={styles.loginLink} href="/login" onClick={closeMobileMenu}>Accedi al tuo account</Link>
            ) : sessionState === "error" ? (
              <p className={styles.sessionMessage}>Sessione non verificabile. Riprova dal pulsante in alto.</p>
            ) : null}
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
          <Link prefetch={true} className={styles.brandLink} href="/" aria-label="Socra, pagina iniziale">
            <Brand variant="light" />
          </Link>
          <p className={styles.footerTagline}>Incontri tra persone, obiettivi chiari e responsabilità reciproca.</p>
        </div>
        <div className={styles.footerNavGroup}>
          <p className={styles.footerNavLabel}>Esplora</p>
          <nav aria-label="Navigazione nel piè di pagina" className={styles.footerNav}>
          {navLinks.map(l => (
              <Link prefetch={true}
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
          <nav aria-label="Contatti e informazioni legali" className={`${styles.footerNav} ${styles.footerMetaNav}`}>
            <Link prefetch={true}
              aria-current={pathname === "/termini" ? "page" : undefined}
              className={styles.footerLink}
              href="/termini"
            >
              Termini
            </Link>
            <Link prefetch={true}
              aria-current={pathname === "/privacy" ? "page" : undefined}
              className={styles.footerLink}
              href="/privacy"
            >
              Privacy
            </Link>
            <span className={styles.footerContact}>Contatti: <a className={styles.footerLink} href="mailto:info@socra.it">info@socra.it</a></span>
          </nav>
          <p className={styles.copyright}>© {year} Socra. Community peer-to-peer.</p>
        </div>
      </div>
    </footer>
  );
}
