"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Brand } from "@/components/Brand";
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";
import { authPost, ClientApiError } from "@/lib/api";
import styles from "../login/auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    nickname: "",
    consent_essential: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError(null);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authPost("register", form);
      router.push("/onboarding");
      router.refresh();
    } catch (err) {
      const reason = err instanceof ClientApiError ? err.message : "Registrazione non riuscita.";
      setError(`${reason} Controlla i dati indicati e riprova.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <PublicNavbar />
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <section className={`${styles.card} ${styles.registerCard}`} aria-labelledby="register-title">
          <div className={styles.brandRow}>
            <Link className={styles.brandLink} href="/" aria-label="Torna alla pagina iniziale di Socra">
              <Brand variant="dark" />
            </Link>
          </div>
          <h1 className={styles.title} id="register-title">Crea il tuo account</h1>
          <p className={styles.subtitle}>
            Entra nella community, completa la survey e definisci il primo obiettivo
            su cui vuoi confrontarti.
          </p>

          {error ? <p className={styles.error} id="register-error" role="alert">{error}</p> : null}

          <form
            aria-label="Crea il tuo account"
            aria-describedby={error ? "register-error" : undefined}
            className={styles.form}
            method="post"
            onSubmit={onSubmit}
          >
            <div className={styles.twoColumns}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="username">Username</label>
                <input
                  aria-invalid={error ? "true" : undefined}
                  autoComplete="username"
                  className={styles.input}
                  id="username"
                  minLength={3}
                  name="username"
                  onChange={(event) => update("username", event.target.value)}
                  required
                  spellCheck={false}
                  value={form.username}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="nickname">Nome visibile (facoltativo)</label>
                <input
                  autoComplete="nickname"
                  className={styles.input}
                  id="nickname"
                  name="nickname"
                  onChange={(event) => update("nickname", event.target.value)}
                  value={form.nickname}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                aria-invalid={error ? "true" : undefined}
                autoComplete="email"
                className={styles.input}
                id="email"
                name="email"
                onChange={(event) => update("email", event.target.value)}
                required
                spellCheck={false}
                type="email"
                value={form.email}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Password</label>
              <div className={styles.passwordRow}>
                <input
                  aria-describedby="password-hint"
                  aria-invalid={error ? "true" : undefined}
                  autoComplete="new-password"
                  className={styles.input}
                  id="password"
                  minLength={10}
                  name="password"
                  onChange={(event) => update("password", event.target.value)}
                  pattern="(?=.*[A-Za-z])(?=.*[0-9]).{10,}"
                  required
                  title="Usa almeno 10 caratteri, con almeno una lettera e un numero."
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                />
                <button
                  aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                  className={styles.togglePassword}
                  onClick={() => setShowPassword((current) => !current)}
                  type="button"
                >
                  {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
                </button>
              </div>
              <p className={styles.hint} id="password-hint">
                Almeno 10 caratteri, con almeno una lettera e un numero.
              </p>
            </div>

            <div className={styles.consentBox}>
              <input
                checked={form.consent_essential}
                id="consent_essential"
                name="consent_essential"
                onChange={(event) => update("consent_essential", event.target.checked)}
                required
                type="checkbox"
              />
              <div className={styles.consentCopy}>
                <label htmlFor="consent_essential">
                  Dichiaro di avere almeno 18 anni, accetto i Termini della community
                  e dichiaro di aver letto l’informativa privacy (obbligatorio).
                </label>
                <p>
                  Prima di accettare, consulta i{" "}
                  <Link className={styles.legalLink} href="/termini">Termini</Link>
                  {" "}e l’{" "}
                  <Link className={styles.legalLink} href="/privacy">informativa privacy</Link>.
                  Non chiediamo consensi facoltativi in anticipo.
                </p>
              </div>
            </div>

            <button
              aria-busy={loading}
              className={styles.submit}
              disabled={loading}
              type="submit"
            >
              {loading ? "Creazione…" : "Crea account"}
            </button>
          </form>

          <p className={styles.footerText}>
            Hai già un account?{" "}
            <Link className={styles.footerLink} href="/login">Accedi</Link>
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
