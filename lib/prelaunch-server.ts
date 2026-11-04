import type { NextRequest } from "next/server";
import { getBackendUrl, prelaunchReceiptCookie, reservationReceipt } from "@/lib/server";
import { guardMutation, readJsonBody, bodyError, privateJson } from "@/lib/web-security";

const receiptPattern = /^[A-Za-z0-9_-]{43}$/;

export async function prelaunchStatus() {
  try {
    const upstream = await fetch(getBackendUrl("/prelaunch/status"), {
      cache: "no-store", signal: AbortSignal.timeout(12_000),
    });
    const value = await upstream.json();
    if (!upstream.ok || !["prelaunch", "open"].includes(value.phase)
      || typeof value.campaign_enabled !== "boolean" || typeof value.email_delivery_enabled !== "boolean"
      || value.email_bonus !== 1 || value.registration_bonus !== 2 || value.redemption_days !== 30) throw new Error();
    return privateJson({
      phase: value.phase, campaign_enabled: value.campaign_enabled, email_delivery_enabled: value.email_delivery_enabled,
      email_bonus: 1, registration_bonus: 2, redemption_days: 30,
      redeem_until: typeof value.redeem_until === "string" ? value.redeem_until : null,
      expected_launch_at: typeof value.expected_launch_at === "string" ? value.expected_launch_at : null,
    });
  } catch {
    return privateJson({ detail: "Le informazioni sul lancio non sono disponibili. Riprova tra poco." }, 503);
  }
}

const actions = ["subscribe", "confirm", "unsubscribe", "join", "profile-link", "reserve", "reservation", "reservation-confirm", "referral"] as const;
type Action = typeof actions[number];

export async function prelaunchMutation(request: NextRequest, action: Action) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  if (!actions.includes(action)) return privateJson({ detail: "Not found" }, 404);
  let body: string;
  try { body = (await readJsonBody(request, 4096))!; }
  catch (error) { return bodyError(error); }

  const receipt = reservationReceipt(request);
  if (action === "reservation") {
    if (!receipt) return privateJson({ detail: "Per riprendere, apri il link ricevuto via email." }, 400);
    body = JSON.stringify({ token: receipt });
  }
  if (action === "reserve") {
    const input = JSON.parse(body);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      return privateJson({ detail: "Controlla i dati e riprova." }, 400);
    }
    delete input.browser_token;
    body = JSON.stringify({ ...input, browser_token: receipt });
  }

  try {
    const upstream = await fetch(getBackendUrl("/prelaunch/" + action), {
      method: "POST", headers: { "Content-Type": "application/json" }, body,
      cache: "no-store", signal: AbortSignal.timeout(12_000),
    });
    const result = await upstream.json();
    if (!upstream.ok) {
      const detail = action === "referral" ? "Questo invito non è disponibile."
        : action === "reserve" && upstream.status === 429 ? "Troppe richieste. Riprova tra poco."
        : action === "reserve" && upstream.status === 409 ? "La fase di prenotazione è terminata. Ricarica la pagina."
        : ["reserve", "subscribe", "join"].includes(action) ? "Non siamo riusciti a salvare la richiesta. Controlla i dati e riprova."
        : "Il link non è valido, è già stato utilizzato oppure è scaduto. Richiedine uno nuovo o accedi al tuo account.";
      const response = privateJson({ detail }, upstream.status);
      response.headers.set("Referrer-Policy", "no-referrer");
      return response;
    }
    let resultForBrowser: Record<string, string | boolean> = { status: "ok" };
    if (action === "profile-link" && result.mode === "confirm") {
      resultForBrowser = { mode: "confirm" };
    } else if (action === "profile-link" || action === "reservation") {
      if (typeof result.email !== "string" || result.email.length > 255) throw new Error();
      resultForBrowser = { email: result.email };
      if (action === "profile-link" && result.confirm_only === true) {
        resultForBrowser.confirm_only = true;
        resultForBrowser.confirmed = result.confirmed === true;
      }
      if (action === "reservation" && typeof result.referral === "string" && result.referral.length <= 128) {
        resultForBrowser.referral = result.referral;
      }
    } else if (action === "referral") {
      if (typeof result.inviter !== "string" || result.inviter.length > 80) throw new Error();
      resultForBrowser = { inviter: result.inviter };
    }
    const response = privateJson(resultForBrowser);
    if (action === "reserve") {
      const nextReceipt = result.receipt;
      if (nextReceipt != null && (typeof nextReceipt !== "string" || !receiptPattern.test(nextReceipt))) throw new Error();
      response.cookies.set(prelaunchReceiptCookie, nextReceipt ?? "", {
        httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
        path: "/", maxAge: nextReceipt ? 172800 : 0,
      });
    }
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch {
    return privateJson({ detail: "Il servizio non è disponibile. Riprova tra poco." }, 503);
  }
}
