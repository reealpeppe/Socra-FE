export default function CommunityLoading() {
  return <div className="card page-state-card" role="status" aria-label="Caricamento contenuto">
    <div className="route-skeleton" aria-hidden><span /><span /><span /></div>
    <span className="sr-only">Caricamento del contenuto…</span>
  </div>;
}
