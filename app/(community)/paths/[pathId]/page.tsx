"use client";
import { DiscussionPreferences } from "@/components/DiscussionPreferences";
import { useConfirmation } from "@/components/ConfirmationDialog";
import { EmailSharingNotice } from "@/components/EmailSharingNotice";

import Link from "next/link";
import { useParams } from "next/navigation";
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

export default function PathDetailPage() {
  const { pathId } = useParams<{ pathId: string }>();
  return (
    <AppShell primaryAction={{ href: "/paths", label: "I tuoi percorsi" }}>
      <OnboardingGate>
        <PathDetailContent pathId={pathId} />
      </OnboardingGate>
    </AppShell>
  );
}

function PathDetailContent({ pathId }: { pathId: string }) {
  const { confirm, confirmationDialog } = useConfirmation();
  const [path, setPath] = useState<PathItem | null>(null);
  const [callRoom, setCallRoom] = useState<CallRoom | null>(null);
  const [meetAvailable, setMeetAvailable] = useState(false);
  const [user, setUser] = useState<UserMe | null>(null);
  const [notes, setNotes] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [emailSharing, setEmailSharing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [userResponse, pathResponse, capabilities] = await Promise.all([
        clientGet<UserMe>("/auth/me"),
        clientGet<PathItem>(`/paths/${pathId}`),
        clientGet<{ google_meet_available: boolean }>("/calls/capabilities").catch(() => null)
      ]);
      setUser(userResponse);
      setPath(pathResponse);
      setMeetAvailable(capabilities?.google_meet_available === true);
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
    } finally {
      setLoading(false);
    }
  }, [pathId]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const params = new URLSearchParams(window.location.search);
      if (params.get("feedback") === "sent") {
        setMessage("Feedback inviato correttamente.");
        params.delete("feedback");
      } else if (params.get("goalReviewed") === "1") {
        setMessage("Obiettivo aggiornato correttamente.");
        params.delete("goalReviewed");
      } else {
        return;
      }
      const query = params.toString();
      window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
    });
    return () => {
      active = false;
    };
  }, []);

  async function closeSide() {
    if (!await confirm("Confermi di aver concluso il percorso e di voler chiudere il tuo lato?")) return;
    setError(null);
    setMessage(null);
    setPendingAction("close");
    try {
      await clientPost(`/paths/${pathId}/close-side`, { notes });
      setMessage("Chiusura lato utente registrata.");
      await load();
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Chiusura non registrata");
    } finally {
      setPendingAction(null);
    }
  }

  async function reportIssue() {
    if (!report.trim()) {
      setError("Descrivi brevemente il problema prima di inviare.");
      return;
    }
    setError(null);
    setMessage(null);
    setPendingAction("report");
    try {
      await clientPost("/reports", { path_id: pathId, reason: "path_issue", details: report.trim() });
      setMessage("Segnalazione inviata al team Socra.");
      setReport("");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Segnalazione non inviata");
    } finally {
      setPendingAction(null);
    }
  }

  async function prepareMeet() {
    setError(null);
    setMessage(null);
    setPendingAction("prepare-meet");
    const meetWindow = window.open("about:blank", "_blank");
    if (meetWindow) meetWindow.opener = null;
    try {
      const room = await clientPost<CallRoom>("/calls/first-session/room", { path_id: pathId });
      setCallRoom(room);
      if (meetWindow) {
        meetWindow.location.replace(room.join_url);
        setMessage("Google Meet aperto in una nuova scheda.");
      } else {
        setMessage("Link Google Meet pronto. Aprilo con il pulsante qui sotto.");
      }
    } catch (err) {
      meetWindow?.close();
      setError(err instanceof ClientApiError ? err.message : "Meet non disponibile");
    } finally {
      setPendingAction(null);
    }
  }

  async function replaceMeet() {
    if (!await confirm("Il link attuale non sarà più utilizzabile. Vuoi crearne uno nuovo?")) return;
    setError(null);
    setMessage(null);
    setPendingAction("replace-meet");
    try {
      const room = await clientPost<CallRoom>("/calls/first-session/room/replace", { path_id: pathId });
      setCallRoom(room);
      setMessage("Nuovo link Google Meet creato e inviato alla controparte.");
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Nuovo link non creato");
    } finally {
      setPendingAction(null);
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
    setPendingAction("sync");
    try {
      const result = await clientPost<CallMetadataSync>("/calls/first-session/sync-metadata", { path_id: pathId });
      await load();
      if (result.verification_status === "verified") {
        setMessage("Prima sessione verificata.");
      } else if (result.verification_status === "pending_provider_metadata") {
        setMessage("Google sta ancora elaborando i dati della sessione. Riprova tra qualche minuto.");
      } else if (result.verification_status === "insufficient_participants") {
        setError("Non risultano almeno due partecipanti alla prima sessione. Verifica di aver usato il link del percorso e riprova.");
      } else {
        setError("La prima sessione non risulta ancora verificata. Riprova dopo aver concluso l’incontro.");
      }
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Verifica della sessione non riuscita");
    } finally {
      setPendingAction(null);
    }
  }

  const role = path && user ? (path.mentor_id === user.id ? "mentor" : path.mentee_id === user.id ? "mentee" : null) : null;
  const feedbackHref = role ? `/feedback/${pathId}/${role}` : null;
  const feedbackLabel = role === "mentor" ? "Lascia feedback sull’apprendista" : "Lascia feedback sul mentor";
  const isCompleted = path?.status === "completed";
  const ownClosed = role === "mentor" ? !!path?.mentor_closed_at : role === "mentee" ? !!path?.mentee_closed_at : false;
  const ownFeedbackSubmitted = role === "mentor"
    ? !!path?.mentor_feedback_submitted
    : role === "mentee"
      ? !!path?.mentee_feedback_submitted
      : false;
  const firstCallCompleted = !!path?.first_call_completed;
  const actionPending = pendingAction !== null;
  const pathsHref = role ? `/paths?tab=${role}` : "/paths";

  async function shareEmail() {
    if (!emailSharing || actionPending || !role) return;
    setPendingAction("email-sharing"); setError(null); setMessage(null);
    try {
      await clientPost(`/paths/${pathId}/email-sharing`, { accepted: true });
      await load(); setEmailSharing(false);
      setMessage("La tua conferma di condivisione email è stata salvata.");
    } catch (err) { setError(err instanceof ClientApiError ? err.message : "Conferma non salvata."); }
    finally { setPendingAction(null); }
  }

  return (
    <div style={{ display: "grid", gap: "24px", margin: "0 auto", maxWidth: "1100px", width: "100%" }}>
      {confirmationDialog}
      <div>
        <Link
          href={pathsHref}
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

      {error ? <p className="error" role="alert">{error}</p> : null}
      {message ? <p className="success" role="status">{message}</p> : null}
      {loading && !path ? <div className="card" role="status">Caricamento percorso…</div> : null}
      {!loading && !path ? (
        <div className="card" style={{ display: "grid", gap: "12px", justifyItems: "start" }}>
          <strong>Percorso non disponibile</strong>
          <p className="muted">Riprova oppure torna all&apos;elenco dei tuoi percorsi.</p>
          <div className="cluster">
            <button className="button secondary" type="button" onClick={() => void load()}>Riprova</button>
            <Link className="button" href="/paths">Vai ai percorsi</Link>
          </div>
        </div>
      ) : null}

      {path ? (
        <>
          <div className="card">
            <div style={{ display: "grid", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
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

              <div className="path-people-grid">
                <PersonCard role="Mentor" name={path.mentor?.nickname || "Mentor Socra"} />
                <PersonCard role="Apprendista" name={path.mentee?.nickname || "Apprendista Socra"} />
              </div>
              <DiscussionPreferences labels={path.goal?.discussion_type_labels} />

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <ClosePill label="Apprendista" closed={!!path.mentee_closed_at} />
                <ClosePill label="Mentor" closed={!!path.mentor_closed_at} />
              </div>
            </div>
          </div>

          {role ? <section className="card stack" aria-labelledby="path-contacts-title">
            <div><p className="eyebrow">Privato tra voi</p><h2 id="path-contacts-title" style={{ fontSize: "1.15rem", margin: 0 }}>Contatti per il percorso</h2></div>
            {path.contacts ? <>
              <p className="muted">Avete entrambi accettato lo scambio. Scrivetevi per concordare il primo incontro e i passaggi successivi.</p>
              <div className="path-people-grid">
                {(["mentor", "mentee"] as const).map(side => <div key={side} className="stack" style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: 16, gap: 6, minWidth: 0 }}>
                  <small className="muted">{side === "mentor" ? "Mentor" : "Apprendista"}</small>
                  <strong>{path.contacts![side].display_name}</strong>
                  <a href={`mailto:${path.contacts![side].email}`} style={{ overflowWrap: "anywhere", color: "var(--navy-950)", textUnderlineOffset: 3 }}>{path.contacts![side].email}</a>
                </div>)}
              </div>
              {!user?.email_delivery_enabled ? <p className="muted">L’invio email è disattivato: i contatti restano disponibili qui.</p> : null}
            </> : path.contact_sharing?.self_accepted ? <>
              <p className="muted">In attesa della conferma dell’altra persona. Nessun recapito sarà mostrato prima di entrambe le conferme.</p>
              <button className="button secondary" type="button" disabled={actionPending || loading} onClick={() => void load()}>Aggiorna conferme</button>
            </> : <>
              <p className="muted">Questo percorso è stato aperto prima dello scambio contatti. Il percorso resta attivo; per mostrare le email serve la conferma di entrambe le persone, senza nuovi addebiti.</p>
              {path.contact_sharing?.other_accepted ? <p className="muted">L’altra persona ha già confermato.</p> : null}
              <EmailSharingNotice accepted={emailSharing} onChange={setEmailSharing} disabled={actionPending} />
              <button className="button dark" type="button" disabled={!emailSharing || actionPending} onClick={() => void shareEmail()}>{pendingAction === "email-sharing" ? "Conferma…" : "Conferma condivisione"}</button>
            </>}
          </section> : null}

          <div className="path-action-grid">
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
                  {firstCallCompleted
                    ? "La partecipazione al primo incontro è stata verificata. Non sono necessarie altre azioni per questa verifica."
                    : meetAvailable
                    ? "Organizza il primo incontro con Google Meet. Il link resta disponibile finché il percorso non viene completato."
                    : "Google Meet integrato non è disponibile in questo momento. Per la verifica del primo incontro usa “Segnala un problema” e concorda i passaggi con l’amministrazione."}
                </p>
                <span style={{
                  alignSelf: "start",
                  background: firstCallCompleted ? "var(--mint-100)" : "var(--orange-100)",
                  borderRadius: "999px",
                  color: firstCallCompleted ? "var(--mint-600)" : "#8a6111",
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  padding: "5px 10px"
                }}>
                  {firstCallCompleted ? "Prima sessione verificata" : "Prima sessione da completare"}
                </span>

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
                    <button className="button secondary" type="button" onClick={replaceMeet} disabled={actionPending || !meetAvailable}>
                      <RefreshCcw size={15} /> {pendingAction === "replace-meet" ? "Creazione…" : "Crea nuovo link"}
                    </button>
                    {!firstCallCompleted ? (
                      <button className="button secondary" type="button" onClick={syncMetadata} disabled={actionPending || !meetAvailable}>
                        <RefreshCcw size={15} /> {pendingAction === "sync" ? "Verifica…" : "Verifica prima sessione"}
                      </button>
                    ) : null}
                  </div>
                ) : meetAvailable ? (
                  <button className="button dark" type="button" onClick={prepareMeet} disabled={actionPending}>
                    {pendingAction === "prepare-meet" ? "Preparazione…" : "Prepara Google Meet"}
                  </button>
                ) : null}
              </div>
            </div>

            <div className="card">
              <div style={{ display: "grid", gap: "14px" }}>
                <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>
                  {isCompleted ? "Percorso completato" : ownClosed ? "Il tuo lato è chiuso" : "Concludi il percorso"}
                </h2>
                {!role ? (
                  <p className="error" role="alert">Non fai parte di questo percorso.</p>
                ) : ownClosed ? (
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                    {ownFeedbackSubmitted
                      ? isCompleted
                        ? "Entrambe le persone hanno chiuso il percorso e inviato il feedback."
                        : "Feedback inviato. Il percorso si completa quando anche l’altra persona conclude i passaggi richiesti."
                      : "Ora completa il feedback. Le risposte dell’altra persona restano nascoste finché non invia anche la propria."}
                  </p>
                ) : !firstCallCompleted ? (
                  <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                    Puoi chiudere il tuo lato dopo che la prima sessione con entrambi i partecipanti è stata verificata.
                  </p>
                ) : (
                  <>
                    <label htmlFor="closure-notes" style={{ color: "var(--navy-950)", fontSize: "0.85rem", fontWeight: 800 }}>
                      Nota privata opzionale
                    </label>
                    <textarea
                      id="closure-notes"
                      className="input"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Aggiungi una nota per il team Socra…"
                      disabled={actionPending}
                    />
                    <button className="button dark" type="button" onClick={closeSide} disabled={actionPending || isCompleted}>
                      <CheckCircle2 size={15} /> {pendingAction === "close" ? "Chiusura…" : "Chiudi il mio lato"}
                    </button>
                  </>
                )}
                {feedbackHref && ownClosed && !ownFeedbackSubmitted ? (
                  <Link className="button secondary" href={feedbackHref}>
                    {feedbackLabel}
                  </Link>
                ) : null}
                {isCompleted && role === "mentee" && !path.goal_review_completed ? (
                  <Link className="button dark" href={`/goal?pathId=${encodeURIComponent(pathId)}`}>
                    Rivedi il tuo obiettivo
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {isCompleted && (path.mentee_feedback_note || path.mentor_feedback_note) ? (
            <div className="card">
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <p className="eyebrow">Privato tra voi</p>
                  <h2 style={{ fontSize: "1rem", fontWeight: 800, margin: 0 }}>Note del percorso</h2>
                </div>
                <p style={{ color: "var(--muted)", fontSize: "0.84rem", margin: 0 }}>
                  Questi testi sono visibili soltanto a mentor, apprendista e admin. Non compaiono nei profili o nei matching futuri.
                </p>
                {path.mentee_feedback_note ? (
                  <div style={{ background: "var(--paper)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
                    <strong style={{ display: "block", fontSize: "0.78rem", marginBottom: "5px" }}>Nota dell’apprendista</strong>
                    <p style={{ color: "var(--muted)", fontSize: "0.86rem", lineHeight: 1.55, margin: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{path.mentee_feedback_note}</p>
                  </div>
                ) : null}
                {path.mentor_feedback_note ? (
                  <div style={{ background: "var(--paper)", borderRadius: "var(--radius-sm)", padding: "12px 14px" }}>
                    <strong style={{ display: "block", fontSize: "0.78rem", marginBottom: "5px" }}>Nota del mentor</strong>
                    <p style={{ color: "var(--muted)", fontSize: "0.86rem", lineHeight: 1.55, margin: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}>{path.mentor_feedback_note}</p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <details className="card" style={{ borderColor: "#fda29b" }}>
            <summary style={{ alignItems: "center", cursor: "pointer", display: "flex", gap: "8px", fontWeight: 800 }}>
                <AlertTriangle size={18} color="#c43f31" aria-hidden />
                Segnala un problema
            </summary>
            <div style={{ display: "grid", gap: "14px", marginTop: "16px" }}>
              <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                Descrivi cosa è successo: la segnalazione sarà esaminata dal team Socra.
              </p>
              <label htmlFor="path-report" style={{ color: "var(--navy-950)", fontSize: "0.85rem", fontWeight: 800 }}>
                Descrizione
              </label>
              <textarea
                id="path-report"
                className="input"
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Descrivi il problema…"
                disabled={actionPending}
              />
              <button className="button danger" type="button" onClick={reportIssue} disabled={actionPending || !report.trim()}>
                {pendingAction === "report" ? "Invio…" : "Invia segnalazione"}
              </button>
            </div>
          </details>
        </>
      ) : null}
      <style jsx>{`
        .path-people-grid,
        .path-action-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .path-people-grid {
          gap: 10px;
        }
        @media (max-width: 760px) {
          .path-people-grid,
          .path-action-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
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
      {closed ? <CheckCircle2 size={13} aria-hidden /> : null}
      {label}: {closed ? "ha concluso" : "non ha ancora concluso"}
    </span>
  );
}
