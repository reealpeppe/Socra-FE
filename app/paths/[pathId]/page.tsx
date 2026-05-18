"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, Copy, ExternalLink, RefreshCcw, UserRound, Video } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { CallMetadataSync, CallRoom, PathItem, UserMe } from "@/lib/types";

const STATUS = {
  open: { bg: "var(--blue-100)", color: "var(--blue-600)", label: "Aperto" },
  pending: { bg: "var(--orange-100)", color: "#b07d1a", label: "In attesa" },
  feedback_pending: { bg: "var(--orange-100)", color: "#b07d1a", label: "Feedback" },
  completed: { bg: "var(--mint-100)", color: "var(--mint-600)", label: "Completato" },
  accepted: { bg: "var(--mint-100)", color: "var(--mint-600)", label: "Accettata" },
  rejected: { bg: "#fee2e2", color: "#dc2626", label: "Rifiutata" },
  expired: { bg: "var(--line)", color: "var(--muted)", label: "Scaduta" },
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

export default function PathDetailPage({ params }: { params: { pathId: string } }) {
  return (
    <AppShell>
      <OnboardingGate>
        <PathDetailContent pathId={params.pathId} />
      </OnboardingGate>
    </AppShell>
  );
}

function PathDetailContent({ pathId }: { pathId: string }) {
  const [path, setPath] = useState<PathItem | null>(null);
  const [callRoom, setCallRoom] = useState<CallRoom | null>(null);
  const [user, setUser] = useState<UserMe | null>(null);
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [userResponse, pathResponse] = await Promise.all([
        clientGet<UserMe>("/auth/me"),
        clientGet<PathItem>(`/paths/${pathId}`)
      ]);
      setUser(userResponse);
      setPath(pathResponse);
      try {
        const room = await clientGet<CallRoom>(`/calls/first-session/room?path_id=${encodeURIComponent(pathId)}`);
        setCallRoom(room);
      } catch (roomErr) {
        if (roomErr instanceof ClientApiError && roomErr.status === 404) {
          setCallRoom(null);
        } else {
          throw roomErr;
        }
      }
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Percorso non disponibile");
    }
  }, [pathId]);

  useEffect(() => {
    load();
  }, [load]);

  async function closeSide() {
    setError(null);
    setMessage(null);
    try {
      await clientPost(`/paths/${pathId}/close-side`, { notes });
      setMessage("Chiusura lato utente registrata.");
      await load();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Chiusura non registrata");
    }
  }

  async function reportIssue() {
    setError(null);
    setMessage(null);
    try {
      await clientPost("/reports", { path_id: pathId, reason: "path_issue", details: report });
      setMessage("Segnalazione inviata al team Socra.");
      setReport("");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Segnalazione non inviata");
    }
  }

  async function prepareMeet() {
    setError(null);
    setMessage(null);
    try {
      const room = await clientPost<CallRoom>("/calls/first-session/room", { path_id: pathId });
      setCallRoom(room);
      window.open(room.join_url, "_blank", "noopener,noreferrer");
      setMessage("Link Google Meet pronto. Le informazioni della sessione saranno aggiornate dopo l'incontro.");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Meet non disponibile");
    }
  }

  async function replaceMeet() {
    setError(null);
    setMessage(null);
    try {
      const room = await clientPost<CallRoom>("/calls/first-session/room/replace", { path_id: pathId });
      setCallRoom(room);
      setMessage("Nuovo link Google Meet creato e inviato alla controparte.");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Nuovo link non creato");
    }
  }

  async function copyMeetLink() {
    if (!callRoom) return;
    try {
      await navigator.clipboard.writeText(callRoom.join_url);
      setMessage("Link copiato.");
    } catch {
      setError("Link non copiato");
    }
  }

  async function syncMetadata() {
    setError(null);
    setMessage(null);
    try {
      await clientPost<CallMetadataSync>("/calls/first-session/sync-metadata", { path_id: pathId });
      setMessage("Informazioni della sessione aggiornate.");
      await load();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Aggiornamento della sessione non riuscito");
    }
  }

  const role = path && user ? (path.mentor_id === user.id ? "mentor" : path.mentee_id === user.id ? "mentee" : null) : null;
  const feedbackHref = role ? `/feedback/${pathId}/${role}` : null;
  const feedbackLabel = role === "mentor" ? "Feedback mentor" : "Feedback mentee";
  const isCompleted = path?.status === "completed";

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div>
        <Link
          href="/paths"
          style={{
            alignItems: "center", color: "var(--muted)", display: "inline-flex",
            fontSize: "0.85rem", fontWeight: 700, gap: "4px", textDecoration: "none"
          }}
        >
          <ChevronLeft size={16} /> Torna ai percorsi
        </Link>
      </div>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
            {path?.goal?.goal_tag || "Dettaglio percorso"}
          </h1>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: 0 }}>
            La prima sessione usa solo informazioni essenziali per la sicurezza della piattaforma, senza registrare la chiamata.
          </p>
        </div>
        {path && <StatusBadge status={path.status} />}
      </div>

      {error ? <p className="error">{error}</p> : null}
      {message ? <p className="success">{message}</p> : null}

      {path ? (
        <>
          <div className="card">
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <StatusBadge status={path.status} />
                {path.goal?.topic && (
                  <span style={{
                    background: "var(--blue-100)", border: "1px solid #cfdbff",
                    borderRadius: "999px", color: "var(--blue-600)",
                    fontSize: "0.78rem", fontWeight: 800, padding: "4px 10px"
                  }}>
                    {path.goal.topic}
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <PersonCard role="Mentor" name={path.mentor?.nickname || path.mentor?.user_id || path.mentor_id} />
                <PersonCard role="Mentee" name={path.mentee?.nickname || path.mentee?.user_id || path.mentee_id} />
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <ClosePill label="Mentee" closed={!!path.mentee_closed_at} />
                <ClosePill label="Mentor" closed={!!path.mentor_closed_at} />
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
            <div className="card">
              <div style={{ display: "grid", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    alignItems: "center", background: "var(--navy-950)", borderRadius: "999px",
                    color: "var(--gold-500)", display: "inline-flex",
                    height: "38px", justifyContent: "center", width: "38px", flexShrink: 0
                  }}>
                    <Video size={18} aria-hidden />
                  </span>
                  <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>Prima sessione</h2>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                  Google Meet gestito da Socra. Il link resta disponibile finché il percorso non viene completato.
                </p>

                {isCompleted ? (
                  <span style={{
                    background: "var(--line)", borderRadius: "999px", color: "var(--muted)",
                    fontSize: "0.8rem", fontWeight: 800, padding: "5px 12px", alignSelf: "start"
                  }}>
                    Riunione chiusa
                  </span>
                ) : callRoom ? (
                  <div style={{ display: "grid", gap: "10px" }}>
                    <div style={{
                      background: "var(--paper)", border: "1px solid var(--line)",
                      borderRadius: "var(--radius-sm)", padding: "10px 12px"
                    }}>
                      <p style={{ color: "var(--muted)", fontSize: "0.8rem", margin: "0 0 4px", overflowWrap: "anywhere" }}>
                        {callRoom.join_url}
                      </p>
                      {callRoom.provider_meeting_code && (
                        <span style={{
                          background: "var(--blue-100)", borderRadius: "999px", color: "var(--blue-600)",
                          fontSize: "0.75rem", fontWeight: 800, padding: "3px 8px"
                        }}>
                          {callRoom.provider_meeting_code}
                        </span>
                      )}
                    </div>
                    <a className="button dark" href={callRoom.join_url} target="_blank" rel="noreferrer">
                      <ExternalLink size={15} /> Apri Google Meet
                    </a>
                    <button className="button secondary" type="button" onClick={copyMeetLink}>
                      <Copy size={15} /> Copia link
                    </button>
                    <button className="button secondary" type="button" onClick={replaceMeet}>
                      <RefreshCcw size={15} /> Crea nuovo link
                    </button>
                    <button className="button secondary" type="button" onClick={syncMetadata}>
                      <RefreshCcw size={15} /> Aggiorna sessione
                    </button>
                    <span style={{
                      alignSelf: "start", background: "var(--line)", borderRadius: "999px",
                      color: "var(--muted)", fontSize: "0.75rem", fontWeight: 800, padding: "4px 10px"
                    }}>
                      {callRoom.status}
                    </span>
                  </div>
                ) : (
                  <button className="button dark" type="button" onClick={prepareMeet}>
                    Prepara Google Meet
                  </button>
                )}
              </div>
            </div>

            <div className="card">
              <div style={{ display: "grid", gap: "14px" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>Chiudi il tuo lato</h2>
                <textarea
                  className="input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Note opzionali"
                />
                <button className="button dark" type="button" onClick={closeSide}>
                  <CheckCircle2 size={15} /> Chiudi percorso
                </button>
                {feedbackHref ? (
                  <Link className="button secondary" href={feedbackHref}>
                    {feedbackLabel}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          <div className="card" style={{ borderColor: "#fda29b" }}>
            <div style={{ display: "grid", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} color="#c43f31" aria-hidden />
                <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>Segnala problema</h2>
              </div>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                La segnalazione sarà esaminata dal team Socra e non produce blocchi automatici.
              </p>
              <textarea
                className="input"
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Descrivi il problema"
              />
              <button className="button danger" type="button" onClick={reportIssue}>
                Invia segnalazione
              </button>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function PersonCard({ role, name }: { role: string; name: string | undefined }) {
  const initial = typeof name === "string" && name.length > 0 ? name.slice(0, 1).toUpperCase() : "?";
  return (
    <div style={{
      alignItems: "center",
      background: "var(--paper)",
      border: "1px solid var(--line)",
      borderRadius: "var(--radius-sm)",
      display: "flex",
      gap: "12px",
      padding: "14px"
    }}>
      <span style={{
        alignItems: "center", background: "var(--blue-100)", borderRadius: "999px",
        color: "var(--blue-600)", display: "inline-flex", flexShrink: 0,
        height: "38px", justifyContent: "center", width: "38px"
      }}>
        <UserRound size={18} aria-hidden />
      </span>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: "var(--muted)", fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 2px", textTransform: "uppercase" }}>{role}</p>
        <p style={{ color: "var(--navy-950)", fontWeight: 700, margin: 0, overflowWrap: "anywhere" }}>{name || initial}</p>
      </div>
    </div>
  );
}

function ClosePill({ label, closed }: { label: string; closed: boolean }) {
  return (
    <span style={{
      alignItems: "center",
      background: closed ? "var(--mint-100)" : "var(--orange-100)",
      borderRadius: "999px",
      color: closed ? "var(--mint-600)" : "#b07d1a",
      display: "inline-flex",
      fontSize: "0.78rem",
      fontWeight: 800,
      gap: "5px",
      padding: "5px 12px"
    }}>
      <CheckCircle2 size={13} aria-hidden />
      {label} {closed ? "chiuso" : "aperto"}
    </span>
  );
}
