import { AsyncState, ButtonLink, PageContainer } from "@/components/Ui";

export default function NotFound() {
  return (
    <main className="global-route-state" id="main-content">
      <PageContainer size="narrow">
        <AsyncState
          status="empty"
          headingLevel={1}
          title="Pagina non trovata"
          body="Il collegamento potrebbe essere scaduto oppure la pagina potrebbe essere stata spostata."
          action={<ButtonLink href="/dashboard">Torna alla dashboard</ButtonLink>}
        />
      </PageContainer>
    </main>
  );
}
