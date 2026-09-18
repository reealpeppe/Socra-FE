/** Labels come from the API catalog, not technical matching or private survey data. */
export function DiscussionPreferences({ labels }: { labels?: string[] }) {
  if (!labels?.length) return null;
  return (
    <div style={{ display: "grid", gap: "6px", marginBlock: "12px" }}>
      <span style={{ color: "var(--muted)", fontSize: "0.78rem", fontWeight: 700 }}>Tipo di confronto</span>
      <ul style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: 0, padding: 0, listStyle: "none" }}>
        {labels.map((label) => <li className="pill" style={{ whiteSpace: "normal" }} key={label}>{label}</li>)}
      </ul>
    </div>
  );
}
