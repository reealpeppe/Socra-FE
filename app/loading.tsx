import { AsyncState, PageContainer } from "@/components/Ui";

export default function Loading() {
  return (
    <main className="global-route-state" id="main-content">
      <PageContainer size="narrow">
        <AsyncState
          status="loading"
          headingLevel={1}
          title="Stiamo preparando Socra"
          body="La pagina sarà pronta tra un momento."
        />
      </PageContainer>
    </main>
  );
}
