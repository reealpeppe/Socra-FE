"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ClipboardList, Database, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ClientApiError, clientGet } from "@/lib/api";

type ReviewItem = {
  id: string;
  source_type: string;
  source_id: string;
  status: string;
  severity: string;
  payload: Record<string, unknown>;
};

const SEVERITY_STYLES: Record<string, { bg: string; color: string }> = {
  critical: { bg: "#fee2e2", color: "#dc2626" },
  high:     { bg: "#fff4dd", color: "#b07d1a" },
  medium:   { bg: "var(--blue-100)", color: "var(--blue-600)" },
  low:      { bg: "var(--line)", color: "var(--muted)" },
};

function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLES[severity.toLowerCase()] || SEVERITY_STYLES.low;
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800,
      padding: "4px 10px", whiteSpace: "nowrap", textTransform: "capitalize"
    }}>
      {severity}
    </span>
  );
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  open:     { bg: "var(--blue-100)",   color: "var(--blue-600)",  label: "Aperto" },
  resolved: { bg: "var(--mint-100)",   color: "var(--mint-600)",  label: "Risolto" },
  closed:   { bg: "var(--line)",       color: "var(--muted)",     label: "Chiuso" },
  pending:  { bg: "var(--orange-100)", color: "#b07d1a",          label: "In attesa" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || { bg: "var(--line)", color: "var(--muted)", label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800,
      padding: "4px 10px", whiteSpace: "nowrap"
    }}>
      {s.label}
    </span>
  );
}

function readableValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}

export default function AdminPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  const openItems = items.filter((item) => item.status !== "resolved" && item.status !== "closed").length;
  const highSeverityItems = items.filter((item) => ["high", "critical"].includes(item.severity.toLowerCase())).length;

  useEffect(() => {
    clientGet<ReviewItem[]>("/admin/review-queue")
      .then(setItems)
      .catch((err) => {
        if (err instanceof ClientApiError && err.status === 403) {
          setAccessDenied(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Coda admin non disponibile");
      })
      .finally(() => setLoading(false));
  }, []);

  if (accessDenied) {
    return (
      <AppShell>
        <section className="card" role="alert" style={{ display: "grid", gap: "12px", maxWidth: "680px" }}>
          <ShieldAlert size={28} aria-hidden />
          <h1 style={{ color: "var(--navy-950)", margin: 0 }}>Area riservata</h1>
          <p className="muted" style={{ margin: 0 }}>
            Questo account non dispone dei permessi amministrativi.
          </p>
          <div>
            <Link href="/dashboard" className="button">Torna alla dashboard</Link>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: "grid", gap: "24px" }}>
        {/* Page header */}
        <div>
          <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
            Pannello Admin
          </h1>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            V1 read-only — le azioni admin richiedono endpoint dedicati futuri.
          </p>
        </div>

        {loading ? <p className="muted" role="status">Caricamento coda di revisione…</p> : null}

        {/* Metric cards */}
        {!loading ? <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          <MetricCard
            icon={<ClipboardList size={20} aria-hidden />}
            iconBg="var(--blue-100)"
            iconColor="var(--blue-600)"
            label="Review attive"
            value={String(openItems)}
            sub="Elementi non chiusi nella coda"
          />
          <MetricCard
            icon={<ShieldAlert size={20} aria-hidden />}
            iconBg="#fee2e2"
            iconColor="#dc2626"
            label="Priorità alta"
            value={String(highSeverityItems)}
            sub="Severity high o critical"
          />
          <MetricCard
            icon={<Database size={20} aria-hidden />}
            iconBg="var(--mint-100)"
            iconColor="var(--mint-600)"
            label="Modalità"
            value="read"
            sub="Nessuna mutazione admin in V1"
          />
        </div> : null}

        {error ? <p className="error">{error}</p> : null}

        {/* Review Queue */}
        {!loading ? <div className="card">
          <div style={{ display: "grid", gap: "16px" }}>
            <h2 style={{ color: "var(--navy-950)", fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
              Review Queue
            </h2>

            {items.length === 0 ? (
              <div style={{
                alignItems: "center", border: "1.5px dashed var(--line)",
                borderRadius: "var(--radius-sm)", display: "flex",
                flexDirection: "column", gap: "8px", padding: "48px 24px", textAlign: "center"
              }}>
                <p style={{ color: "var(--muted)", fontWeight: 700, margin: 0 }}>Nessun elemento</p>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>Le segnalazioni e anomalie appariranno qui.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--paper)",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--radius-sm)",
                      display: "grid",
                      gap: "12px",
                      padding: "14px 16px"
                    }}
                  >
                    {/* Top row */}
                    <div style={{
                      alignItems: "flex-start", display: "flex",
                      gap: "10px", justifyContent: "space-between", flexWrap: "wrap"
                    }}>
                      <div>
                        <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 2px", textTransform: "uppercase" }}>
                          Sorgente
                        </p>
                        <p style={{ color: "var(--navy-950)", fontWeight: 700, margin: 0 }}>{item.source_type}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <SeverityBadge severity={item.severity} />
                        <StatusBadge status={item.status} />
                      </div>
                    </div>

                    {/* Severity visual */}
                    <div style={{ alignItems: "center", display: "flex", gap: "6px" }}>
                      <AlertTriangle
                        size={15}
                        color={item.severity.toLowerCase() === "critical" ? "#dc2626" : "#b07d1a"}
                        aria-hidden
                      />
                      <span style={{ color: "var(--muted)", fontSize: "0.82rem", fontWeight: 700 }}>
                        Severity: {item.severity}
                      </span>
                    </div>

                    {/* Meta rows */}
                    <div style={{ display: "grid", gap: "6px" }}>
                      <div style={{
                        alignItems: "center", background: "var(--card)",
                        border: "1px solid var(--line)", borderRadius: "var(--radius-sm)",
                        display: "flex", gap: "10px", justifyContent: "space-between", padding: "8px 12px"
                      }}>
                        <span style={{ color: "var(--muted)", fontSize: "0.82rem", fontWeight: 700 }}>Source ID</span>
                        <strong style={{ color: "var(--ink)", fontSize: "0.82rem", wordBreak: "break-all" }}>{item.source_id}</strong>
                      </div>
                      {Object.entries(item.payload).slice(0, 3).map(([key, value]) => (
                        <div
                          key={`${item.id}-${key}`}
                          style={{
                            alignItems: "center", background: "var(--card)",
                            border: "1px solid var(--line)", borderRadius: "var(--radius-sm)",
                            display: "flex", gap: "10px", justifyContent: "space-between", padding: "8px 12px"
                          }}
                        >
                          <span style={{ color: "var(--muted)", fontSize: "0.82rem", fontWeight: 700 }}>{key}</span>
                          <strong style={{ color: "var(--ink)", fontSize: "0.82rem", wordBreak: "break-all" }}>
                            {readableValue(value)}
                          </strong>
                        </div>
                      ))}
                    </div>

                    {/* Payload preview */}
                    <pre style={{
                      background: "var(--card)",
                      border: "1px solid var(--line)",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--ink)",
                      fontFamily: '"Cascadia Mono", "Consolas", monospace',
                      fontSize: "0.78rem",
                      margin: 0,
                      maxHeight: "200px",
                      overflow: "auto",
                      padding: "10px 12px"
                    }}>
                      {JSON.stringify(item.payload, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div> : null}
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon, iconBg, iconColor, label, value, sub
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="card" style={{ display: "grid", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", margin: 0, textTransform: "uppercase" }}>
          {label}
        </p>
        <span style={{
          alignItems: "center", background: iconBg, borderRadius: "999px",
          color: iconColor, display: "inline-flex", height: "34px",
          justifyContent: "center", width: "34px"
        }}>
          {icon}
        </span>
      </div>
      <strong style={{ color: "var(--navy-950)", fontSize: "clamp(1.8rem, 3vw, 2.4rem)", lineHeight: 1 }}>{value}</strong>
      <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: 0 }}>{sub}</p>
    </div>
  );
}
