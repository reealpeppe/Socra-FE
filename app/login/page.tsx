"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Brand } from "@/components/Brand";
import { PublicFooter, PublicNavbar } from "@/components/PublicLayout";
import { authPost, ClientApiError } from "@/lib/api";
import styles from "./auth.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await authPost("login", { identifier, password });
      const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
      router.push(next);
      router.refresh();
    } catch (err) {
      const reason = err instanceof ClientApiError ? err.message : "Accesso non riuscito.";
      setError(`${reason} Controlla username o email e password, poi riprova.`);
    } finally {
      setLoading(false);
    }
  }

  function updateIdentifier(value: string) {
    setIdentifier(value);
    if (error) setError(null);
  }

  function updatePassword(value: string) {
    setPassword(value);
    if (error) setError(null);
  }

  return (
    <div className={styles.page}>
      <PublicNavbar />
      <main className={styles.main} id="main-content" tabIndex={-1}>
        <section className={styles.card} aria-labelledby="login-title">
          <div className={styles.brandRow}>
            <Link className={styles.brandLink} href="/" aria-label="Torna alla pagina iniziale di Socra">
              <Brand variant="dark" />
            </Link>
          </div>
          <h1 className={styles.title} id="login-title">Bentornato su Socra</h1>
          <p className={styles.subtitle}>Accedi per continuare i tuoi percorsi nella community.</p>

          {error ? <p className={styles.error} id="login-error" role="alert">{error}</p> : null}

          <form
            aria-describedby={error ? "login-error" : undefined}
            className={styles.form}
            method="post"
            onSubmit={onSubmit}
          >
            <div className={styles.field}>
              <label className={styles.label} htmlFor="identifier">Username o email</label>
              <input
                aria-invalid={error ? "true" : undefined}
                autoComplete="username"
                className={styles.input}
                id="identifier"
                inputMode="email"
                name="identifier"
                onChange={(event) => updateIdentifier(event.target.value)}
                required
                spellCheck={false}
                type="text"
                value={identifier}
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">Password</label>
              <div className={styles.passwordRow}>
                <input
                  aria-invalid={error ? "true" : undefined}
                  autoComplete="current-password"
                  className={styles.input}
                  id="password"
                  name="password"
                  onChange={(event) => updatePassword(event.target.value)}
                  required
                  type={showPassword ? "text" : "password"}
                  value={password}
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
            </div>
            <button
              aria-busy={loading}
              className={styles.submit}
              disabled={loading}
              type="submit"
            >
              {loading ? "Accesso…" : "Accedi"}
            </button>
          </form>

          <details className={styles.help}>
            <summary>Non riesci ad accedere?</summary>
            <p>
              Il recupero automatico della password non è ancora disponibile. Non creare
              un secondo account: chiedi assistenza attraverso il canale con cui hai
              ricevuto l’accesso a Socra, indicando username o email ma mai la password.
            </p>
          </details>

          <p className={styles.footerText}>
            Non hai un account?{" "}
            <Link className={styles.footerLink} href="/register">Crea il tuo profilo</Link>
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}

function safeNextPath(value: string | null): string {
  const allowedPrefixes = ["/admin", "/dashboard", "/feedback", "/goal", "/matching", "/onboarding", "/paths", "/profiles", "/requests", "/settings", "/tour", "/wallet"];
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  try {
    const target = new URL(value, "https://socra.local");
    if (target.origin !== "https://socra.local") return "/dashboard";
    const isAllowed = allowedPrefixes.some(
      (prefix) => target.pathname === prefix || target.pathname.startsWith(`${prefix}/`)
    );
    return isAllowed ? `${target.pathname}${target.search}${target.hash}` : "/dashboard";
  } catch {
    return "/dashboard";
  }
}
