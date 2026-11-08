"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Brand } from "@/components/Brand";
import { authPost, ClientApiError, clientGet } from "@/lib/api";
import { safeInvitationReturn } from "@/lib/invitations";
import { useLaunchStatus } from "@/lib/prelaunch";
import type { UserMe } from "@/lib/types";
import styles from "@/app/(public)/login/auth.module.css";

export function LoginForm({ onSuccess, initialIdentifier = "", compact = false, submitLabel = "Accedi" }: {
  onSuccess?: (user: UserMe) => void | Promise<void>;
  initialIdentifier?: string;
  compact?: boolean;
  submitLabel?: string;
}) {
  const router = useRouter();
  const id = useId();
  const { state } = useLaunchStatus();
  const [identifier, setIdentifier] = useState(initialIdentifier);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [invitationNext, setInvitationNext] = useState<string | null>(null);
  useEffect(() => { queueMicrotask(() => setInvitationNext(safeInvitationReturn(new URLSearchParams(window.location.search).get("next")))); }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await authPost("login", { identifier: identifier.trim(), password });
      setPassword("");
      const user = await clientGet<UserMe>("/auth/me");
      if (onSuccess) await onSuccess(user);
      else {
        const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
        router.replace(user.prelaunch_blocked ? "/dashboard" : next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Accesso non riuscito. Riprova.");
    } finally { setLoading(false); }
  }

  const form = <>
    {error && <p className={styles.error} id={id + "-error"} role="alert">{error}</p>}
    <form aria-describedby={error ? id + "-error" : undefined} className={styles.form} method="post" onSubmit={onSubmit}>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={id + "-identifier"}>Username o email</label>
        <input aria-invalid={!!error} autoComplete="username" className={styles.input} id={id + "-identifier"}
          name="identifier" maxLength={255} required spellCheck={false} type="text" value={identifier}
          readOnly={!!initialIdentifier} disabled={loading}
          onChange={event => { setIdentifier(event.target.value); setError(null); }} />
      </div>
      <div className={styles.field}>
        <label className={styles.label} htmlFor={id + "-password"}>Password</label>
        <div className={styles.passwordRow}>
          <input aria-invalid={!!error} autoComplete="current-password" className={styles.input} id={id + "-password"}
            name="password" required maxLength={1024} type={showPassword ? "text" : "password"} value={password}
            disabled={loading} onChange={event => { setPassword(event.target.value); setError(null); }} />
          <button aria-label={showPassword ? "Nascondi password" : "Mostra password"} className={styles.togglePassword}
            onClick={() => setShowPassword(value => !value)} type="button">
            {showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}
          </button>
        </div>
      </div>
      <button aria-busy={loading} className={styles.submit} disabled={loading} type="submit">{loading ? "Accesso…" : submitLabel}</button>
    </form>
    <p className={styles.footerText}><Link className={styles.footerLink} href="/forgot-password">Password dimenticata?</Link></p>
    {!compact && <p className={styles.footerText}>Non hai un account? <Link className={styles.footerLink}
      href={state?.phase === "prelaunch" ? "/prelancio" : invitationNext ? `/register?next=${invitationNext}` : "/register"}>
      {state?.phase === "prelaunch" ? "Riserva il tuo posto" : "Crea il tuo profilo"}</Link></p>}
  </>;

  if (compact) return form;
  return <div className={styles.page}><main className={styles.main} id="main-content" tabIndex={-1}>
    <section className={styles.card} aria-labelledby={id + "-title"}>
      <div className={styles.brandRow}><Link className={styles.brandLink} href="/" aria-label="Torna alla pagina iniziale di Socra"><Brand variant="dark" /></Link></div>
      <h1 className={styles.title} id={id + "-title"}>Bentornato su Socra</h1>
      <p className={styles.subtitle}>{state?.phase === "prelaunch" ? "Accedi alla tua area per preparare il profilo e invitare i tuoi amici." : "Accedi per continuare i tuoi percorsi nella community."}</p>
      {form}
    </section>
  </main></div>;
}

export function safeNextPath(value: string | null): string {
  const invitation = safeInvitationReturn(value);
  if (invitation) return invitation;
  const allowedPrefixes = ["/admin", "/dashboard", "/feedback", "/goal", "/competenze", "/matching", "/onboarding", "/paths", "/profiles", "/requests", "/settings", "/tour", "/wallet"];
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  try {
    const target = new URL(value, "https://socra.local");
    if (target.origin !== "https://socra.local") return "/dashboard";
    return allowedPrefixes.some(prefix => target.pathname === prefix || target.pathname.startsWith(prefix + "/"))
      ? target.pathname + target.search + target.hash : "/dashboard";
  } catch { return "/dashboard"; }
}
