"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { TabPanel, Tabs } from "@/components/Ui";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { MatchRequestItem, UserMe, Wallet } from "@/lib/types";

type RequestWithCost = MatchRequestItem & {
  cost_at_request?: number;
};

type MatchRespondResult = {
  id: string;
  status: string;
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "In attesa", className: "amber" },
  accepted: { label: "Accettata", className: "green" },
  rejected: { label: "Rifiutata", className: "danger" },
  expired: { label: "Scaduta", className: "" },
  expired_by_timeout: { label: "Scaduta", className: "" }
};

const expiryFormatter = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit"
});

function requestTiming(request: MatchRequestItem): string | null {
  const terminalTimestamp = request.updated_at || request.created_at;
  const timestamp = request.status === "pending" || request.status.startsWith("expired")
    ? request.expires_at
    : terminalTimestamp;
  if (!timestamp || Number.isNaN(new Date(timestamp).getTime())) return null;
  const formatted = expiryFormatter.format(new Date(timestamp));
  if (request.status === "pending") return `Scade il: ${formatted}`;
  if (request.status.startsWith("expired")) return `Scaduta il: ${formatted}`;
  if (request.status === "accepted") return `Accettata il: ${formatted}`;
  if (request.status === "rejected") return `Rifiutata il: ${formatted}`;
  return null;
}

export default function RequestsPage() {
  return (
    <AppShell>
      <OnboardingGate>
        <Suspense fallback={<div className="card" role="status">Caricamento proposte…</div>}>
          <RequestsContent />
        </Suspense>
      </OnboardingGate>
    </AppShell>
  );
}

function RequestsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTab: "received" | "sent" = searchParams.get("tab") === "sent" ? "sent" : "received";
  const [me, setMe] = useState<UserMe | null>(null);
  const [requests, setRequests] = useState<RequestWithCost[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"received" | "sent">(requestedTab);
  const [loading, setLoading] = useState(true);
  const [pendingResponses, setPendingResponses] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    setError(null);
    const [userResult, requestsResult, walletResult] = await Promise.allSettled([
      clientGet<UserMe>("/auth/me"),
      clientGet<RequestWithCost[]>("/matching/requests/me?role=all"),
      clientGet<Wallet>("/wallet/me")
    ]);
    if (userResult.status === "fulfilled") setMe(userResult.value);
    else setMe(null);
    if (requestsResult.status === "fulfilled") {
      setRequests(Array.isArray(requestsResult.value) ? requestsResult.value : []);
    } else {
      setRequests([]);
    }
    setWallet(walletResult.status === "fulfilled" ? walletResult.value : null);
    if (userResult.status === "rejected" || requestsResult.status === "rejected") {
      setError("Non riusciamo a caricare le proposte. Riprova.");
    }
    setLoading(false);
  }

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, []);

  useEffect(() => {
    queueMicrotask(() => setTab(requestedTab));
  }, [requestedTab]);

  async function respond(id: string, accept: boolean) {
    if (pendingResponses.has(id)) return;
    const request = requests.find((item) => item.id === id);
    if (!request) return;
    if (accept) {
      const cost = request.initiator_role === "mentor" ? request.cost_at_request : 0;
      const costCopy = typeof cost === "number" && cost > 0
        ? ` Il percorso costerà ${cost} ${cost === 1 ? "credito" : "crediti"}. Crediti disponibili: ${wallet?.balance ?? "non disponibili"}.`
        : "";
      if (!window.confirm(`Vuoi accettare e aprire questo percorso?${costCopy}`)) return;
    }
    if (!accept && !window.confirm("Vuoi rifiutare questa proposta? L'altra persona potrà continuare la ricerca.")) return;
    setError(null);
    setMessage(null);
    setPendingResponses((current) => new Set(current).add(id));
    try {
      const result = await clientPost<MatchRespondResult>(`/matching/requests/${id}/respond`, { accept });
      if (result.status === "expired" || result.status === "expired_by_timeout") {
        setMessage("La richiesta è scaduta prima della risposta. Nessun percorso è stato aperto.");
      } else if (accept && result.status === "open") {
        setMessage("Proposta accettata. Il percorso è aperto.");
      } else if (!accept && result.status === "rejected") {
        setMessage("Richiesta rifiutata.");
      } else {
        setError("La risposta è stata salvata, ma lo stato ricevuto non è riconosciuto. Aggiorna la pagina.");
      }
      await load();
    } catch (err) {
      if (err instanceof ClientApiError && err.status === 409) {
        setMessage("La richiesta non è più disponibile. Nessun percorso è stato aperto.");
        await load();
      } else {
        setError(err instanceof ClientApiError ? err.message : "Risposta non salvata");
      }
    } finally {
      setPendingResponses((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  }

  function selectTab(next: "received" | "sent") {
    setTab(next);
    router.replace(`/requests?tab=${next}`, { scroll: false });
  }

  const received = useMemo(
    () => requests.filter((request) => (
      request.initiator_role === "mentor"
        ? request.mentee_id === me?.id
        : request.mentor_id === me?.id
    )),
    [requests, me?.id]
  );
  const sent = useMemo(
    () => requests.filter((request) => (
      request.initiator_role === "mentor"
        ? request.mentor_id === me?.id
        : request.mentee_id === me?.id
    )),
    [requests, me?.id]
  );
  const displayed = tab === "received" ? received : sent;

  return (
    <div className="requests-page">
      <div className="requests-header">
        <div>
          <p className="eyebrow">Matching</p>
          <h1>Proposte di percorso</h1>
          <p className="muted">Chi riceve la proposta decide: il percorso si apre soltanto dopo l’accettazione.</p>
        </div>
        <div className="cluster">
          {me?.is_coach ? <Link href="/matching/mentees" className="button dark">Cerca mentee</Link> : null}
          <Link href="/matching" className="button secondary">Trova un mentor</Link>
        </div>
      </div>

      <div className="requests-stats">
        <StatCard label="Ricevute" value={loading || error ? "—" : received.length} />
        <StatCard label="Inviate" value={loading || error ? "—" : sent.length} />
        <StatCard label="In attesa" value={loading || error ? "—" : requests.filter((request) => request.status === "pending").length} />
      </div>

      {error ? (
        <div className="error" role="alert" style={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between" }}>
          <span>{error}</span>
          <button className="button secondary" type="button" onClick={() => void load()}>Riprova</button>
        </div>
      ) : null}
      {message ? <p className="success" role="status">{message}</p> : null}

      <Tabs
        id="requests"
        panelId="requests-panel"
        ariaLabel="Richieste"
        value={tab}
        onValueChange={(value) => selectTab(value === "sent" ? "sent" : "received")}
        items={[
          { value: "received", label: `Ricevute (${received.length})` },
          { value: "sent", label: `Inviate (${sent.length})` },
        ]}
      />

      <TabPanel id="requests-panel" labelledBy={`requests-tab-${tab}`}>
      {loading ? (
        <div className="card requests-empty"><p className="muted" role="status">Caricamento richieste…</p></div>
      ) : error ? null : displayed.length === 0 ? (
        <div className="card requests-empty">
          <strong>Nessuna richiesta</strong>
          <p className="muted">Le richieste {tab === "received" ? "ricevute" : "inviate"} appariranno qui.</p>
        </div>
      ) : (
        <div className="requests-list">
          {displayed.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              isReceived={tab === "received"}
              canRespond={request.initiator_role === "mentor" || me?.is_coach === true}
              pending={pendingResponses.has(request.id)}
              onRespond={respond}
            />
          ))}
        </div>
      )}
      </TabPanel>

      <RequestsStyles />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card requests-stat">
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

function RequestRow({
  request,
  isReceived,
  canRespond,
  pending,
  onRespond
}: {
  request: RequestWithCost;
  isReceived: boolean;
  canRespond: boolean;
  pending: boolean;
  onRespond: (id: string, accept: boolean) => void;
}) {
  const initiatedByMentor = request.initiator_role === "mentor";
  const person = isReceived
    ? (initiatedByMentor ? request.mentor : request.mentee)
    : (initiatedByMentor ? request.mentee : request.mentor);
  const personName = person?.nickname || person?.username || "Utente Socra";
  const status = STATUS_LABELS[request.status] || { label: request.status, className: "" };
  const timing = requestTiming(request);

  return (
    <article className="requests-row">
      <div className="requests-avatar" aria-hidden>{personName.slice(0, 1).toUpperCase()}</div>
      <div className="requests-row-main">
        <div className="requests-row-head">
          <div>
            <h2>{personName}</h2>
            <p className="muted">
              {isReceived
                ? initiatedByMentor
                  ? "Ti propone di iniziare un percorso insieme"
                  : "Vuole iniziare un percorso con te"
                : initiatedByMentor
                  ? "Proposta inviata al mentee"
                  : "Richiesta inviata al mentor"}
            </p>
          </div>
          <span className={`pill ${status.className}`.trim()}>{status.label}</span>
        </div>
        <div className="requests-goal">
          <strong>{request.goal?.goal_tag || "Obiettivo Socra"}</strong>
          {request.goal?.topic ? <span>{request.goal.topic}</span> : null}
          {isReceived && request.mentee?.level ? <span>Livello mentee: {request.mentee.level}</span> : null}
          {isReceived && initiatedByMentor && typeof request.cost_at_request === "number" ? (
            <span>
              Costo all&apos;accettazione: {request.cost_at_request} {request.cost_at_request === 1 ? "credito" : "crediti"}
            </span>
          ) : null}
        </div>
        <div className="requests-meta">
          <span>Mentor: {request.mentor?.nickname || "Profilo mentor"}</span>
          <span>Mentee: {request.mentee?.nickname || "Profilo mentee"}</span>
          {timing ? <span>{timing}</span> : null}
        </div>
        {request.status === "accepted" && request.path_id ? (
          <Link className="button secondary" href={`/paths/${request.path_id}`}>Apri il percorso</Link>
        ) : null}
        {isReceived && request.status === "pending" && canRespond ? (
          <div className="requests-actions">
            <button className="button dark" type="button" disabled={pending} onClick={() => onRespond(request.id, true)}>
              <CheckCircle2 size={16} aria-hidden /> {pending ? "Salvataggio…" : "Accetta"}
            </button>
            <button className="button secondary" type="button" disabled={pending} onClick={() => onRespond(request.id, false)}>
              <XCircle size={16} aria-hidden /> Rifiuta
            </button>
          </div>
        ) : isReceived && request.status === "pending" ? (
          <div className="requests-action-blocked">
            <p>La disponibilità come mentor è disattivata. Riattivala prima di rispondere.</p>
            <Link className="button secondary" href="/settings">Gestisci ruolo mentor</Link>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function RequestsStyles() {
  return (
    <style jsx global>{`
      .requests-page {
        display: grid;
        gap: 20px;
        margin: 0 auto;
        max-width: 980px;
        width: 100%;
      }

      .requests-header {
        align-items: flex-end;
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        justify-content: space-between;
      }

      .requests-header h1 {
        color: var(--navy-950, #07172d);
        font-size: clamp(1.8rem, 3vw, 2.6rem);
        margin: 0 0 6px;
      }

      .requests-stats {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .requests-stat {
        padding: 16px;
      }

      .requests-stat p {
        color: var(--muted);
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        margin: 0 0 4px;
        text-transform: uppercase;
      }

      .requests-stat strong {
        color: var(--navy-950, #07172d);
        font-size: 1.8rem;
      }

      .requests-empty {
        display: grid;
        gap: 8px;
        justify-items: center;
        padding: 42px 20px;
        text-align: center;
      }

      .requests-list {
        display: grid;
        gap: 12px;
      }

      .requests-row {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: var(--radius-lg, 16px);
        box-shadow: var(--shadow-tight, 0 10px 26px rgba(18, 35, 61, 0.06));
        display: grid;
        gap: 14px;
        grid-template-columns: auto minmax(0, 1fr);
        padding: 18px;
      }

      .requests-avatar {
        align-items: center;
        background: linear-gradient(180deg, #153255, #07172d);
        border-radius: 999px;
        color: white;
        display: inline-flex;
        font-weight: 900;
        height: 44px;
        justify-content: center;
        width: 44px;
      }

      .requests-row-main {
        display: grid;
        gap: 12px;
        min-width: 0;
      }

      .requests-row-head {
        align-items: flex-start;
        display: flex;
        gap: 12px;
        justify-content: space-between;
      }

      .requests-row-head h2 {
        color: var(--navy-950, #07172d);
        font-size: 1rem;
        margin: 0 0 2px;
      }

      .requests-goal {
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm, 10px);
        display: grid;
        gap: 2px;
        padding: 10px 12px;
      }

      .requests-goal span,
      .requests-meta {
        color: var(--muted);
        font-size: 0.82rem;
      }

      .requests-meta,
      .requests-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .requests-action-blocked {
        align-items: flex-start;
        background: var(--paper);
        border: 1px solid var(--line);
        border-radius: var(--radius-sm, 10px);
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: space-between;
        padding: 10px 12px;
      }

      .requests-action-blocked p {
        color: var(--muted);
        flex: 1 1 260px;
        font-size: 0.84rem;
        margin: 0;
      }

      @media (max-width: 680px) {
        .requests-stats {
          grid-template-columns: 1fr;
        }

        .requests-row {
          grid-template-columns: 1fr;
        }

        .requests-row-head {
          display: grid;
        }
      }
    `}</style>
  );
}
