"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { clientGet, ClientApiError } from "@/lib/api";
import { ButtonLink, Card } from "@/components/Ui";
import type { UserMe } from "@/lib/types";

export function EmailVerificationGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const restricted = /^\/(matching|profiles|requests|dashboard|tour)(\/|$)/.test(pathname);
  const [user, setUser] = useState<UserMe | null>(null);
  const [error, setError] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!restricted) return;
    let active = true;
    let generation = 0;
    const refresh = () => {
      const current = ++generation;
      clientGet<UserMe>("/auth/me").then(value => {
        if (active && current === generation) { setUser(value); setError(null); }
      }).catch(err => {
        if (active && current === generation) { setUser(null); setError(err instanceof ClientApiError ? err.status : 500); }
      });
    };
    refresh();
    window.addEventListener("socra:session-refresh", refresh);
    return () => { active = false; window.removeEventListener("socra:session-refresh", refresh); };
  }, [restricted, pathname, retry]);

  if (!restricted) return <>{children}</>;
  if (error !== null) return <Card><div className="stack">
    <h1>{error === 401 ? "Accedi per continuare" : "Verifica non disponibile"}</h1>
    {error === 401 ? <ButtonLink href={`/login?next=${encodeURIComponent(pathname + window.location.search)}`}>Vai all&apos;accesso</ButtonLink>
      : <button className="button secondary" onClick={() => setRetry(value => value + 1)}>Riprova</button>}
  </div></Card>;
  if (!user) return <Card><p role="status">Verifica dell’account…</p></Card>;
  if (user.email_verified || !user.email_verification_required || pathname === `/profiles/${user.id}`) return <>{children}</>;
  return <Card><div className="stack">
    <h1>Conferma la tua email</h1>
    <p className="muted">La ricerca dei profili e il matching saranno disponibili dopo la conferma. La tua survey resta salvata.</p>
    <ButtonLink href="/onboarding">Riprendi survey</ButtonLink>
    <ButtonLink href="/settings" variant="secondary">Completa il tuo profilo</ButtonLink>
  </div></Card>;
}
