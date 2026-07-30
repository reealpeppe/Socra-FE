"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Database, ShieldAlert } from "lucide-react";
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

const SEVERITY_LABELS: Record<string, string> = {
  critical: "Critica",
  high: "Alta",
  medium: "Media",
  low: "Bassa"
};

const SOURCE_LABELS: Record<string, string> = {
  report: "Segnalazione",
  path_report: "Segnalazione percorso",
  call_anomaly: "Anomalia prima sessione",
  identity_review: "Verifica identità",
  level_review: "Verifica profilo"
};

const PAYLOAD_LABELS: Record<string, string> = {
  reason: "Motivo",
  details: "Dettagli",
  verification_status: "Stato verifica",
  anomaly_flags: "Segnali rilevati",
  path_id: "Percorso",
  user_id: "Utente",
  created_at: "Creata il"
};

function SeverityBadge({ severity }: { severity: string }) {
  const s = SEVERITY_STYLES[severity.toLowerCase()] || SEVERITY_STYLES.low;
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800,
      padding: "4px 10px", whiteSpace: "nowrap", textTransform: "capitalize"
    }}>
      {SEVERITY_LABELS[severity.toLowerCase()] || "Da valutare"}
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
  if (Array.isArray(value)) return value.map(String).join(", ");
  return "Informazione disponibile";
}

function safePayloadEntries(payload: Record<string, unknown>) {
  const blocked = /token|secret|password|authorization|transcript|email/i;
  return Object.entries(payload)
    .filter(([key, value]) => !blocked.test(key) && (
      value === null
      || ["string", "number", "boolean"].includes(typeof value)
      || (Array.isArray(value) && value.every((item) => ["string", "number", "boolean"].includes(typeof item)))
    ))
    .slice(0, 6);
}

export default function AdminPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [retryVersion, setRetryVersion] = useState(0);

  const openItems = items.filter((item) => item.status !== "resolved" && item.status !== "closed").length;
  const highSeverityItems = items.filter((item) => ["high", "critical"].includes(item.severity.toLowerCase())).length;

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setLoading(true);
      setError(null);
      setAccessDenied(false);
    });
    clientGet<ReviewItem[]>("/admin/review-queue")
      .then((rows) => {
        if (active) setItems(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (!active) return;
        if (err instanceof ClientApiError && err.status === 403) {
          setAccessDenied(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Coda admin non disponibile");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [retryVersion]);

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
      <div className="admin-page">
        {/* Page header */}
        <div>
          <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
            Amministrazione
          </h1>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            Consulta le segnalazioni e gli elementi che richiedono verifica.
          </p>
        </div>

        {loading ? <p className="muted" role="status">Caricamento coda di revisione…</p> : null}

        {/* Metric cards */}
        {!loading && !error ? <div className="admin-metrics">
          <MetricCard
            icon={<ClipboardList size={20} aria-hidden />}
            iconBg="var(--blue-100)"
            iconColor="var(--blue-600)"
            label="Verifiche attive"
            value={String(openItems)}
            sub="Elementi ancora da esaminare"
          />
          <MetricCard
            icon={<ShieldAlert size={20} aria-hidden />}
            iconBg="#fee2e2"
            iconColor="#dc2626"
            label="Priorità alta"
            value={String(highSeverityItems)}
            sub="Priorità alta o critica"
          />
          <MetricCard
            icon={<Database size={20} aria-hidden />}
            iconBg="var(--mint-100)"
            iconColor="var(--mint-600)"
            label="Totale"
            value={String(items.length)}
            sub="Elementi presenti nella coda"
          />
        </div> : null}

        {error ? (
          <div className="error" role="alert" style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between" }}>
            <span>{error}</span>
            <button className="button secondary" type="button" onClick={() => setRetryVersion((value) => value + 1)}>Riprova</button>
          </div>
        ) : null}

        {/* Coda di verifica */}
        {!loading && !error ? <div className="card">
          <div style={{ display: "grid", gap: "16px" }}>
            <h2 style={{ color: "var(--navy-950)", fontSize: "1.1rem", fontWeight: 800, margin: 0 }}>
              Coda di verifica
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
                        <p style={{ color: "var(--navy-950)", fontWeight: 700, margin: 0 }}>{SOURCE_LABELS[item.source_type] || "Elemento da verificare"}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <SeverityBadge severity={item.severity} />
                        <StatusBadge status={item.status} />
                      </div>
                    </div>

                    {/* Meta rows */}
                    <div style={{ display: "grid", gap: "6px" }}>
                      <div style={{
                        alignItems: "center", background: "var(--card)",
                        border: "1px solid var(--line)", borderRadius: "var(--radius-sm)",
                        display: "flex", gap: "10px", justifyContent: "space-between", padding: "8px 12px"
                      }}>
                        <span style={{ color: "var(--muted)", fontSize: "0.82rem", fontWeight: 700 }}>Riferimento</span>
                        <strong style={{ color: "var(--ink)", fontSize: "0.82rem", wordBreak: "break-all" }}>{item.source_id}</strong>
                      </div>
                      {safePayloadEntries(item.payload).map(([key, value]) => (
                        <div
                          key={`${item.id}-${key}`}
                          style={{
                            alignItems: "center", background: "var(--card)",
                            border: "1px solid var(--line)", borderRadius: "var(--radius-sm)",
                            display: "flex", gap: "10px", justifyContent: "space-between", padding: "8px 12px"
                          }}
                        >
                          <span style={{ color: "var(--muted)", fontSize: "0.82rem", fontWeight: 700 }}>{PAYLOAD_LABELS[key] || "Informazione"}</span>
                          <strong style={{ color: "var(--ink)", fontSize: "0.82rem", wordBreak: "break-all" }}>
                            {readableValue(value)}
                          </strong>
                        </div>
                      ))}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div> : null}
        <style jsx>{`
          .admin-page {
            display: grid;
            gap: 24px;
            margin: 0 auto;
            max-width: 1180px;
            width: 100%;
          }
          .admin-metrics {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          @media (max-width: 760px) {
            .admin-metrics {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
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
