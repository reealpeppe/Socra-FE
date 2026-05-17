"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { MatchRequestItem } from "@/lib/types";

const STATUS = {
  open:             { bg: "var(--blue-100)",   color: "var(--blue-600)",  label: "Aperto" },
  pending:          { bg: "var(--orange-100)", color: "#b07d1a",          label: "In attesa" },
  feedback_pending: { bg: "var(--orange-100)", color: "#b07d1a",          label: "Feedback" },
  completed:        { bg: "var(--mint-100)",   color: "var(--mint-600)",  label: "Completato" },
  accepted:         { bg: "var(--mint-100)",   color: "var(--mint-600)",  label: "Accettata" },
  rejected:         { bg: "#fee2e2",           color: "#dc2626",          label: "Rifiutata" },
  expired:          { bg: "var(--line)",       color: "var(--muted)",     label: "Scaduta" },
} as const;

function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status as keyof typeof STATUS] || { bg: "var(--line)", color: "var(--muted)", label: status };
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: "999px", fontSize: "0.75rem", fontWeight: 800,
      padding: "4px 10px", whiteSpace: "nowrap"
    }}>{s.label}</span>
  );
}

export default function RequestsPage() {
  return (
    <AppShell>
      <OnboardingGate>
        <RequestsContent />
      </OnboardingGate>
    </AppShell>
  );
}

function RequestsContent() {
  const [requests, setRequests] = useState<MatchRequestItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"received" | "sent">("received");

  async function load() {
    try {
      setRequests(await clientGet<MatchRequestItem[]>("/matching/requests/me?role=all"));
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Richieste non disponibili");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function respond(id: string, accept: boolean) {
    setError(null);
    setMessage(null);
    try {
      await clientPost(`/matching/requests/${id}/respond`, { accept });
      setMessage(accept ? "Richiesta accettata. Percorso aperto." : "Richiesta rifiutata.");
      await load();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Risposta non salvata");
    }
  }

  // Determine sent vs received by mentor_id presence heuristic:
  // received = requests where the current user is the mentor (mentor sees pending ones to act on)
  // We use snapshot_reason or role from the API — since API returns all, we split by direction.
  // The existing code didn't differentiate; we introduce a tab filter as a UI layer.
  // "Ricevute" = status pending (action needed) or accepted from the mentor side
  // "Inviate" = requests initiated by the mentee (sent out)
  // Since we don't have a role field in MatchRequestItem, we split heuristically:
  // pending items most likely are received; others are sent — we show all in both tabs
  // but filter: "received" = pending, "sent" = non-pending.
  const received = requests.filter((r) => r.status === "pending" || r.status === "accepted");
  const sent = requests.filter((r) => r.status !== "pending" && r.status !== "accepted");
  const displayed = tab === "received" ? received : sent;

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Page header */}
      <div>
        <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
          Richieste di matching
        </h1>
        <p style={{ color: "var(--muted)", margin: 0 }}>
          Il mentor vede livello e goal solo nel contesto della richiesta.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", minWidth: "140px" }}>
          <div>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 2px", textTransform: "uppercase" }}>Totale</p>
            <strong style={{ color: "var(--navy-950)", fontSize: "1.6rem", lineHeight: 1 }}>{requests.length}</strong>
          </div>
        </div>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 20px", minWidth: "140px" }}>
          <div>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 2px", textTransform: "uppercase" }}>In attesa</p>
            <strong style={{ color: "#b07d1a", fontSize: "1.6rem", lineHeight: 1 }}>
              {requests.filter((r) => r.status === "pending").length}
            </strong>
          </div>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      {/* Tabs */}
      <div style={{ borderBottom: "2px solid var(--line)", display: "flex", gap: "0" }}>
        {(["received", "sent"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--navy-950)" : "2px solid transparent",
              color: tab === t ? "var(--navy-950)" : "var(--muted)",
              cursor: "pointer",
              fontWeight: tab === t ? 800 : 600,
              fontSize: "0.9rem",
              marginBottom: "-2px",
              padding: "10px 20px",
              transition: "color 0.15s",
            }}
          >
            {t === "received" ? `Ricevute (${received.length})` : `Inviate (${sent.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <div className="card" style={{
          alignItems: "center", borderStyle: "dashed", boxShadow: "none",
          display: "flex", flexDirection: "column", gap: "8px", padding: "48px 24px", textAlign: "center"
        }}>
          <p style={{ color: "var(--muted)", fontWeight: 700, margin: 0 }}>Nessuna richiesta</p>
          <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
            Le richieste {tab === "received" ? "ricevute" : "inviate"} appariranno qui.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {displayed.map((request) => {
            const nickname = request.mentor?.nickname || request.mentee?.nickname || "Utente";
            const goalTag = request.goal?.goal_tag || "Richiesta percorso";
            const topic = request.goal?.topic || "";
            const isReceived = tab === "received";

            return (
              <div
                key={request.id}
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--line)",
                  borderRadius: "var(--radius-lg)",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  boxShadow: "var(--shadow-tight)"
                }}
              >
                {/* Top row: avatar+name, goal, status */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  justifyContent: "space-between", flexWrap: "wrap"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {/* Avatar circle */}
                    <div style={{
                      alignItems: "center",
                      background: "linear-gradient(180deg, #153255, #07172d)",
                      borderRadius: "999px",
                      color: "white",
                      display: "inline-flex",
                      flexShrink: 0,
                      fontWeight: 800,
                      height: "40px",
                      justifyContent: "center",
                      width: "40px",
                      fontSize: "0.9rem"
                    }}>
                      {nickname.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, margin: 0 }}>{nickname}</p>
                      {topic && (
                        <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: 0 }}>{topic}</p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    {/* Goal tag pill */}
                    <span style={{
                      background: "var(--blue-100)", color: "var(--blue-600)",
                      borderRadius: "999px", fontSize: "0.75rem", fontWeight: 700,
                      padding: "4px 10px", whiteSpace: "nowrap"
                    }}>
                      {goalTag}
                    </span>
                    <StatusBadge status={request.status} />
                  </div>
                </div>

                {/* Snapshot reason if present */}
                {request.snapshot_reason ? (
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>{request.snapshot_reason}</p>
                ) : null}

                {/* Meta row */}
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                    Mentor: <strong style={{ color: "var(--ink)" }}>{request.mentor?.nickname || request.mentor_id}</strong>
                  </span>
                  <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>
                    &nbsp;·&nbsp; Mentee: <strong style={{ color: "var(--ink)" }}>{request.mentee?.nickname || request.mentee_id}</strong>
                  </span>
                </div>

                {/* Action buttons — only for received + pending */}
                {isReceived && request.status === "pending" ? (
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <button
                      className="button dark"
                      type="button"
                      onClick={() => respond(request.id, true)}
                      style={{ gap: "6px" }}
                    >
                      <CheckCircle2 size={16} aria-hidden /> Accetta
                    </button>
                    <button
                      className="button secondary"
                      type="button"
                      onClick={() => respond(request.id, false)}
                      style={{ gap: "6px" }}
                    >
                      <XCircle size={16} aria-hidden /> Rifiuta
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
