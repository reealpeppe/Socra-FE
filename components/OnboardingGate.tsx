"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ButtonLink, Card } from "@/components/Ui";
import { ClientApiError, clientGet } from "@/lib/api";

type OnboardingState = {
  latest_answer_id: string | null;
};

type GateState = "loading" | "complete" | "missing" | "unauthenticated" | "error";

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<GateState>("loading");
  const [loginHref, setLoginHref] = useState("/login");

  const verify = useCallback(() => {
    setState("loading");
    clientGet<OnboardingState>("/surveys/onboarding/me")
      .then((response) => setState(response.latest_answer_id ? "complete" : "missing"))
      .catch((error) => {
        if (error instanceof ClientApiError && error.status === 401) {
          const search = typeof window === "undefined" ? "" : window.location.search;
          setLoginHref(`/login?next=${encodeURIComponent(`${pathname}${search}`)}`);
          setState("unauthenticated");
          return;
        }
        setState("error");
      });
  }, [pathname]);

  useEffect(() => {
    verify();
  }, [verify]);

  if (state === "loading") {
    return (
      <Card>
        <p className="muted" role="status">Verifica onboarding…</p>
      </Card>
    );
  }

  if (state === "complete") return <>{children}</>;

  if (state === "unauthenticated") {
    return (
      <Card>
        <div className="stack">
          <p className="eyebrow">Sessione scaduta</p>
          <h2>Accedi per continuare</h2>
          <p className="muted">Dopo l&apos;accesso potrai riprendere il flusso da qui.</p>
          <ButtonLink href={loginHref}>Vai all&apos;accesso</ButtonLink>
        </div>
      </Card>
    );
  }

  if (state === "error") {
    return (
      <Card>
        <div className="stack">
          <p className="eyebrow">Verifica non disponibile</p>
          <h2>Non riusciamo a controllare la survey</h2>
          <p className="muted">Riprova tra poco: i flussi operativi restano protetti finché la verifica non riesce.</p>
          <button className="button secondary" type="button" onClick={verify}>Riprova</button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="stack">
        <p className="eyebrow">Survey obbligatoria</p>
        <h2>Completa la survey prima di continuare</h2>
        <p className="muted">
          Obiettivo, matching, richieste, percorsi e feedback si attivano quando il livello iniziale è stato salvato.
        </p>
        <ButtonLink href="/onboarding">Riprendi survey</ButtonLink>
      </div>
    </Card>
  );
}
