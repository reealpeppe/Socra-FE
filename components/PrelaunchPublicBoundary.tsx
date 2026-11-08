"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clientGet, ClientApiError } from "@/lib/api";
import { isPrelaunchEntryPage } from "@/lib/prelaunch-navigation";
import { SessionChangedError } from "@/lib/request-cache";
import type { UserMe } from "@/lib/types";
import styles from "./Prelaunch.module.css";

/** Entry pages never offer a second registration to a signed-in prelaunch user. */
export function PrelaunchPublicBoundary({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const entry = isPrelaunchEntryPage(pathname);
  const [checked, setChecked] = useState<{ path: string; state: "show" | "redirect" | "error" } | null>(null);
  useEffect(() => {
    if (!entry) return;
    let active = true;
    let generation = 0;
    function check(retries = 1) {
      const current = ++generation;
      clientGet<UserMe>("/auth/me").then(user => {
        if (!active || current !== generation) return;
        if (user.prelaunch_blocked) {
          setChecked({ path: pathname, state: "redirect" });
          router.replace("/dashboard");
        } else setChecked({ path: pathname, state: "show" });
      }).catch(error => {
        if (!active || current !== generation) return;
        if (error instanceof SessionChangedError && retries > 0) { check(retries - 1); return; }
        setChecked({ path: pathname, state: error instanceof ClientApiError && error.status === 401 ? "show" : "error" });
      });
    }
    const refresh = () => check();
    check();
    window.addEventListener("socra:session-refresh", refresh);
    return () => { active = false; window.removeEventListener("socra:session-refresh", refresh); };
  }, [entry, pathname, router]);

  if (!entry || checked?.path === pathname && checked.state === "show") return children;
  return <main className={styles.page} id="main-content"><div className={styles.content}>
    {checked?.path === pathname && checked.state === "error" ? <>
      <p role="alert">Non riusciamo a verificare l’accesso. Riprova tra poco.</p>
      <button className="button secondary" onClick={() => window.location.reload()}>Riprova</button>
    </> : <p role="status">Verifica dell’accesso…</p>}
  </div></main>;
}
