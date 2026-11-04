"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EmailVerificationGate } from "@/components/EmailVerificationGate";
import { PersonalAppContent, PersistentAppShell } from "@/components/AppShell";
import { PrelaunchArea, PrelaunchFrame } from "@/components/PrelaunchArea";
import { cachedClientValue, clientGet, refreshClientSession, ClientApiError } from "@/lib/api";
import { PrelaunchModeContext } from "@/lib/prelaunch";
import type { UserMe } from "@/lib/types";
import styles from "./Prelaunch.module.css";

export function PrelaunchGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const personal = ["/onboarding", "/competenze", "/goal", "/settings"].includes(pathname);
  const [user, setUser] = useState<UserMe | null>(() => cachedClientValue<UserMe>("/auth/me") ?? null);
  const [error, setError] = useState<number | null>(null);

  useEffect(() => {
    let active = true, generation = 0;
    function refresh() {
      const current = ++generation;
      clientGet<UserMe>("/auth/me").then(value => {
        if (active && current === generation) { setUser(value); setError(null); }
      }).catch(reason => {
        if (active && current === generation) {
          setUser(null);
          setError(reason instanceof ClientApiError ? reason.status : 500);
        }
      });
    }
    refresh();
    window.addEventListener("socra:session-refresh", refresh);
    const interval = window.setInterval(refreshClientSession, 60000);
    return () => {
      active = false;
      window.removeEventListener("socra:session-refresh", refresh);
      window.clearInterval(interval);
    };
  }, [pathname]);

  if (!user) return <main className={styles.page} id="main-content"><div className={styles.content}>
    {error === 401 ? <><h1>Accedi per continuare</h1><Link className="button dark" href="/login?accesso=1">Vai all’accesso</Link></>
      : error ? <><p role="alert">Non riusciamo a verificare l’accesso.</p><button className="button secondary" onClick={refreshClientSession}>Riprova</button></>
      : <p role="status">Verifica dell’accesso…</p>}
  </div></main>;

  if (!user.prelaunch_blocked) return <PersistentAppShell><EmailVerificationGate>{children}</EmailVerificationGate></PersistentAppShell>;
  return <PrelaunchModeContext.Provider value={true}><PrelaunchFrame user={user}>
    {personal ? <PersonalAppContent>{children}</PersonalAppContent>
      : <PrelaunchArea key={user.id} user={user} roleEditor={pathname === "/prelancio/prepara"} completion={pathname === "/prelancio/profilo-pronto"} />}
  </PrelaunchFrame></PrelaunchModeContext.Provider>;
}
