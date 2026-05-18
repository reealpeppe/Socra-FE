"use client";

import { useEffect, useState } from "react";
import { ButtonLink, Card } from "@/components/Ui";
import { clientGet } from "@/lib/api";

type OnboardingState = {
  latest_answer_id: string | null;
};

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<"loading" | "complete" | "missing" | "error">("loading");

  useEffect(() => {
    clientGet<OnboardingState>("/surveys/onboarding/me")
      .then((response) => setState(response.latest_answer_id ? "complete" : "missing"))
      .catch(() => setState("error"));
  }, []);

  if (state === "loading") {
    return (
      <Card>
        <p className="muted">Verifica onboarding...</p>
      </Card>
    );
  }

  if (state === "complete") {
    return <>{children}</>;
  }

  return (
    <Card>
      <div className="stack">
        <p className="eyebrow">Survey obbligatoria</p>
        <h2>Completa la survey prima di continuare</h2>
        <p className="muted">
          Puoi esplorare l&apos;app, ma goal, matching, richieste, percorsi e feedback restano bloccati finché il livello non viene salvato.
        </p>
        {state === "error" ? <p className="error">Non riesco a verificare lo stato onboarding.</p> : null}
        <ButtonLink href="/onboarding">Riprendi survey</ButtonLink>
      </div>
    </Card>
  );
}
