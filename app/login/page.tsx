"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Brand } from "@/components/Brand";
import { authPost, ClientApiError } from "@/lib/api";

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
      setError(err instanceof ClientApiError ? err.message : "Accesso non riuscito");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <Brand variant="dark" />
        </div>
        <h1 className="auth-title">Bentornato su Socra</h1>
        <p className="auth-sub">Accedi al tuo account</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={onSubmit}>
          <div>
            <label className="auth-label" htmlFor="identifier">Username o email</label>
            <input
              id="identifier"
              className="input"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              inputMode="email"
              required
            />
          </div>
          <div>
            <label className="auth-label" htmlFor="password">Password</label>
            <div className="auth-password-row">
              <input
                id="password"
                className="input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                className="button secondary"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Nascondi password" : "Mostra password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="button dark"
            style={{ width: "100%" }}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Accesso..." : "Accedi"}
          </button>
        </form>

        <p className="auth-footer">
          Non hai un account?{" "}
          <Link href="/register">Registrati</Link>
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
        .auth-password-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .auth-password-row .input {
          flex: 1;
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
      `}</style>
    </div>
  );
}

function safeNextPath(value: string | null): string {
  const allowedPrefixes = ["/admin", "/dashboard", "/feedback", "/goal", "/matching", "/onboarding", "/paths", "/profiles", "/requests", "/settings", "/wallet"];
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return allowedPrefixes.some((prefix) => value === prefix || value.startsWith(`${prefix}/`)) ? value : "/dashboard";
}
