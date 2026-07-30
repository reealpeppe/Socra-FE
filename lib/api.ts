import type { ApiError } from "@/lib/types";

const jsonHeaders = { "Content-Type": "application/json" };

export class ClientApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ClientApiError";
    this.status = status;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { detail: text };
    }
  }
  if (!response.ok) {
    const error = body as ApiError | null;
    throw new ClientApiError(response.status, friendlyErrorMessage(error, response.status));
  }
  return body as T;
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  "Onboarding survey already completed": "Hai già completato la survey iniziale.",
  "section must be onboarding": "La survey inviata non è valida.",
  "A user cannot open a path with themself": "Non puoi aprire un percorso con te stesso.",
  "Mentor is no longer available for new paths": "Il mentor non è più disponibile per nuovi percorsi.",
  "The reviewed goal must belong to the mentee and completed path": "Questo obiettivo non appartiene al percorso completato.",
  "Competence topic is required": "Indica il topic della competenza.",
  "Competence topic must match the canonical path goal topic": "Il topic della competenza non corrisponde al percorso.",
  "Call metadata end time must be after start time": "I dati della prima sessione non hanno un intervallo valido.",
  "Only path participants or admins can record call metadata": "Solo i partecipanti al percorso possono verificare la sessione.",
  "Notification not found": "Notifica non disponibile.",
  "Wallet account not found": "Portafoglio crediti non disponibile.",
  "Debt limit exceeded": "L’operazione supererebbe il limite massimo di debito.",
  "Authentication required": "Accedi per continuare.",
  "Invalid token": "La sessione non è più valida. Accedi di nuovo.",
  "Invalid session": "La sessione è scaduta. Accedi di nuovo.",
  "Invalid user": "Account non disponibile.",
  "Invalid credentials": "Username, email o password non corretti.",
  "Account is not active": "L’account non è attivo.",
  "Essential consent is required": "Il consenso essenziale è obbligatorio.",
  "User already exists": "Esiste già un account con questo username o questa email.",
  "Complete onboarding before using this feature": "Completa la survey iniziale prima di continuare.",
  "Review the goal of your completed path before starting a new mentee operation": "Rivedi l’obiettivo del percorso completato prima di iniziarne uno nuovo.",
  "Goal not found": "Obiettivo non disponibile.",
  "Goal is not active": "L’obiettivo non è più attivo.",
  "A user cannot request themself as mentor": "Non puoi inviare una richiesta a te stesso.",
  "Mentor not found": "Mentor non disponibile.",
  "Level gap is not allowed without invitation": "Il livello del mentor non è compatibile con il tuo.",
  "Pending match request already exists": "Hai già una richiesta in attesa per questo mentor.",
  "Mentor is not a valid candidate": "Questo mentor non è disponibile per l’obiettivo attivo.",
  "Mentee already has an open path": "Hai già un percorso aperto come mentee.",
  "Mentor has reached open path capacity": "Il mentor ha già raggiunto il limite di tre percorsi aperti.",
  "Wallet account is required": "Portafoglio crediti non disponibile.",
  "Debt must be settled before opening a new mentee path": "Devi prima ripianare il debito in crediti.",
  "Insufficient balance for L0/L1 path": "I crediti disponibili non bastano per aprire questo percorso.",
  "Debt limit would be exceeded": "L’apertura supererebbe il limite massimo di debito.",
  "Match request not found": "Richiesta non disponibile.",
  "Only the requested mentor can respond": "Solo il mentor destinatario può rispondere.",
  "Match request is not pending": "La richiesta non è più in attesa.",
  "Path not found": "Percorso non disponibile.",
  "User is not part of this path": "Non fai parte di questo percorso.",
  "Complete the verified first call before closing the path": "Completa la prima sessione verificata prima di chiudere il percorso.",
  "This side is already closed": "Hai già chiuso il tuo lato del percorso.",
  "Only the mentee can update the path goal": "Solo il mentee può rivedere l’obiettivo.",
  "The path goal can be reviewed only after path completion": "Puoi rivedere l’obiettivo solo dopo il completamento del percorso.",
  "The completed path goal has already been reviewed": "L’obiettivo di questo percorso è già stato rivisto.",
  "Invalid feedback actor": "Questo feedback non è disponibile per il tuo ruolo.",
  "Feedback already submitted": "Hai già inviato il feedback.",
  "Close your side of the path before sending feedback": "Chiudi prima il tuo lato del percorso.",
  "Path is not ready for feedback": "Il percorso non è ancora pronto per il feedback.",
  "Competence vote already submitted": "Hai già inviato la valutazione della competenza.",
  "Select at most 3 mentor badges": "Puoi selezionare al massimo 3 punti di forza.",
  "Call room not found": "Sessione Google Meet non disponibile.",
  "Only path participants or admins can access call room": "Solo i partecipanti al percorso possono aprire questa sessione.",
  "Cannot create or replace call rooms for a completed path": "Il percorso è completato: non puoi creare un nuovo link.",
  "First-call metadata already exists": "La prima sessione è già stata verificata.",
  "Only L1 or L2 users can opt in as mentors": "Il tuo profilo non può ancora attivare la disponibilità come mentor.",
  "User not found": "Profilo non disponibile.",
};

function friendlyErrorMessage(error: ApiError | null, status: number): string {
  const detail = error?.detail as unknown;
  if (Array.isArray(detail)) return "Controlla i campi indicati e riprova.";
  const raw = typeof detail === "string"
    ? detail
    : typeof error?.message === "string"
      ? error.message
      : "";
  if (raw && ERROR_TRANSLATIONS[raw]) return ERROR_TRANSLATIONS[raw];
  if (
    raw.startsWith("D3.")
    || raw.startsWith("D4.")
    || raw.startsWith("section_d.")
    || raw.startsWith("Missing mentee feedback answers")
    || raw.startsWith("Missing mentor feedback answers")
    || raw.startsWith("Invalid mentee feedback answer")
    || raw.startsWith("Invalid mentor feedback answer")
    || raw.startsWith("Mentor feedback answer out of range")
    || raw.startsWith("Invalid mentor badges")
  ) {
    return "Controlla le risposte indicate e riprova.";
  }
  if (
    raw.startsWith("SOCRA_GOOGLE_")
    || raw.startsWith("Credenziali OAuth Google")
    || raw.startsWith("Google Meet non configurato:")
  ) {
    return "Google Meet non è configurato. Contatta il team Socra.";
  }
  if (raw) return raw;
  return `Richiesta non riuscita (${status})`;
}

export async function clientGet<T>(path: string): Promise<T> {
  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    credentials: "include",
    cache: "no-store"
  });
  return parseResponse<T>(response);
}

export async function clientPost<T>(path: string, payload?: unknown): Promise<T> {
  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  return parseResponse<T>(response);
}

export async function clientPatch<T>(path: string, payload?: unknown): Promise<T> {
  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    method: "PATCH",
    credentials: "include",
    headers: jsonHeaders,
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  return parseResponse<T>(response);
}

export async function authPost<T>(path: "login" | "register" | "logout", payload?: unknown): Promise<T> {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    credentials: "include",
    headers: jsonHeaders,
    body: payload === undefined ? undefined : JSON.stringify(payload)
  });
  return parseResponse<T>(response);
}

export function formatCredits(label: string | undefined): string {
  return !label || label === "coin" ? "crediti" : label;
}
