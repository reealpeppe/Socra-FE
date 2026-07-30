"use client";

import { AsyncState, Button, PageContainer } from "@/components/Ui";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="global-route-state" id="main-content">
      <PageContainer size="narrow">
        <AsyncState
          status="error"
          headingLevel={1}
          title="Qualcosa non ha funzionato"
          body="I tuoi dati non sono stati modificati. Puoi riprovare senza perdere il lavoro già salvato."
          action={<Button onClick={reset}>Riprova</Button>}
        />
      </PageContainer>
    </main>
  );
}
