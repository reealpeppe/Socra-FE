"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Brand } from "@/components/Brand";
import { authPost, ClientApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    nickname: "",
    consent_essential: false
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function update(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
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
      setError(err instanceof ClientApiError ? err.message : "Registrazione non riuscita");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page" id="main-content">
      <div className="auth-card">
        <div className="auth-brand">
          <Brand variant="dark" />
        </div>
	        <h1 className="auth-title">Crea il tuo account</h1>
	        <p className="auth-sub">Inizia il tuo percorso Socra. Per ora usi email o username e password, senza codici SMS.</p>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div className="auth-grid-two">
            <div>
              <label className="auth-label" htmlFor="username">Username</label>
              <input
                id="username"
                name="username"
                className="input"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                minLength={3}
                autoComplete="username"
                spellCheck={false}
                required
              />
            </div>
            <div>
              <label className="auth-label" htmlFor="nickname">Nome visibile</label>
              <input
                id="nickname"
                name="nickname"
                className="input"
                value={form.nickname}
                onChange={(e) => update("nickname", e.target.value)}
                autoComplete="nickname"
              />
            </div>
          </div>

          <div>
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              autoComplete="email"
              spellCheck={false}
              required
            />
          </div>

          <div>
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="auth-password-row">
              <input
                id="password"
                name="password"
                className="input"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                minLength={10}
                pattern="(?=.*[A-Za-z])(?=.*[0-9]).{10,}"
                title="Usa almeno 10 caratteri, con almeno una lettera e un numero."
                autoComplete="new-password"
                required
              />
              <button
                className="button secondary"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
              >
                {showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            <p className="auth-password-hint">Almeno 10 caratteri, con almeno una lettera e un numero.</p>
          </div>

          <div className="auth-consents">
            <label className="auth-check">
              <input
                name="consent_essential"
                type="checkbox"
                checked={form.consent_essential}
                onChange={(e) => update("consent_essential", e.target.checked)}
                required
              />
              <span>Accetto i Termini della community e dichiaro di aver letto l&apos;informativa privacy (obbligatorio).</span>
            </label>
            <p className="auth-consent-note">
              Non ti chiediamo consensi facoltativi in anticipo: ogni scelta verrà proposta solo quando servirà davvero.
            </p>
          </div>

          <button
            type="submit"
            className="button dark"
            style={{ width: "100%" }}
            disabled={loading || !form.consent_essential}
            aria-busy={loading}
          >
            {loading ? "Creazione…" : "Crea account"}
          </button>
        </form>

        <p className="auth-footer">
          Hai già un account?{" "}
          <Link href="/login">Accedi</Link>
        </p>
      </div>

      <style jsx global>{`
        .auth-page {
          align-items: center;
          background: var(--paper);
          display: flex;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }
        .auth-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow);
          max-width: 440px;
          padding: 40px;
          width: 100%;
        }
        .auth-brand {
          display: flex;
          justify-content: center;
          margin-bottom: 28px;
        }
        .auth-title {
          font-size: 1.6rem;
          font-weight: 800;
          margin: 0 0 6px;
          text-align: center;
          color: var(--ink);
        }
        .auth-sub {
          color: var(--muted);
          margin: 0 0 28px;
          text-align: center;
          font-size: 0.95rem;
        }
        .auth-form {
          display: grid;
          gap: 16px;
        }
        .auth-label {
          color: var(--ink);
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 6px;
        }
        .auth-grid-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .auth-password-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .auth-password-row .input {
          flex: 1;
        }
        .auth-password-hint {
          color: var(--muted);
          font-size: 0.78rem;
          margin: 6px 0 0;
        }
        .auth-consents {
          display: grid;
          gap: 10px;
          padding: 4px 0;
        }
        .auth-check {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          cursor: pointer;
          font-size: 0.85rem;
          color: var(--ink);
          line-height: 1.4;
        }
        .auth-check input[type="checkbox"] {
          margin-top: 2px;
          flex-shrink: 0;
          accent-color: var(--navy-950);
        }
        .auth-consent-note {
          border-left: 2px solid var(--gold-500);
          color: var(--muted);
          font-size: 0.78rem;
          line-height: 1.5;
          margin: 0 0 0 2px;
          padding-left: 12px;
        }
        .auth-error {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          border-radius: var(--radius-sm);
          color: #dc2626;
          font-size: 0.875rem;
          margin-bottom: 16px;
          padding: 10px 14px;
        }
        .auth-footer {
          color: var(--muted);
          font-size: 0.875rem;
          margin-top: 20px;
          text-align: center;
        }
        .auth-footer a {
          color: var(--navy-950);
          font-weight: 700;
          text-decoration: none;
        }
        .auth-footer a:hover {
          text-decoration: underline;
        }
        @media (max-width: 560px) {
          .auth-card {
            padding: 28px 20px;
          }
          .auth-grid-two {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
