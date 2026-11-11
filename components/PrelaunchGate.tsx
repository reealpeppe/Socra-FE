"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AccessRecovery } from "@/components/AccessRecovery";
import { EmailVerificationGate } from "@/components/EmailVerificationGate";
import { PersonalAppContent, PersistentAppShell } from "@/components/AppShell";
import { PrelaunchArea, PrelaunchFrame } from "@/components/PrelaunchArea";
import { cachedClientValue, clientGet, refreshClientSession, ClientApiError } from "@/lib/api";
import { PrelaunchModeContext } from "@/lib/prelaunch";
import { prelaunchPrivateDestination } from "@/lib/prelaunch-navigation";
import type { UserMe } from "@/lib/types";
import styles from "./Prelaunch.module.css";

export function PrelaunchGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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

  const destination = user?.prelaunch_blocked ? prelaunchPrivateDestination(pathname) : pathname;
  useEffect(() => {
    if (destination !== pathname) router.replace(destination);
  }, [destination, pathname, router]);

  if (!user) return <AccessRecovery state={error === 401 ? "expired" : error ? "unavailable" : "loading"}
    loginHref={"/login?accesso=1&next=" + encodeURIComponent(pathname + (typeof window === "undefined" ? "" : window.location.search))}
    onRetry={refreshClientSession} />;

  if (!user.prelaunch_blocked) return <PersistentAppShell><EmailVerificationGate>{children}</EmailVerificationGate></PersistentAppShell>;
  if (destination !== pathname) return <main className={styles.areaMain} id="main-content"><p role="status">Ti accompagniamo alla tua area…</p></main>;
  return <PrelaunchModeContext.Provider value={true}><PrelaunchFrame user={user}>
    {personal ? <PersonalAppContent>{children}</PersonalAppContent>
      : <PrelaunchArea key={user.id} user={user} roleEditor={pathname === "/prelancio/prepara"} completion={pathname === "/prelancio/profilo-pronto"} />}
  </PrelaunchFrame></PrelaunchModeContext.Provider>;
}
