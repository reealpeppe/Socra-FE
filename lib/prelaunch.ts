"use client";
import { createContext, useEffect, useState } from "react";
import { ClientApiError } from "@/lib/api";

export const PrelaunchModeContext = createContext(false);

export type LaunchStatus = {
  phase: "prelaunch" | "open";
  campaign_enabled: boolean;
  email_delivery_enabled: boolean;
  email_bonus: number;
  registration_bonus: number;
  redemption_days: number;
  redeem_until: string | null;
  expected_launch_at?: string | null;
};

export type Intent = "learn" | "teach" | "both";
export type Preparation = {
  first_name: string;
  intent: Intent | null;
  next_step: "details" | "intent" | "experience" | "goal" | "ready";
  experience_saved: boolean;
  email_verified: boolean;
  goal: string | null;
  verification_delivery: string | null;
};
export type LaunchArea = LaunchStatus & {
  preparation: Preparation;
  referrals: { code: string | null; accepted: number; ready: number };
  credits: number;
  reserved_bonus: number;
};

export function launchDate(date?: string | null) {
  if (!date) return null;
  const parsed = new Date(date);
  if (!Number.isFinite(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Rome",
  }).format(parsed);
}

export function preparationHref(preparation: Preparation) {
  switch (preparation.next_step) {
    case "details": return "/settings";
    case "intent": return "/prelancio/prepara";
    case "experience": return preparation.experience_saved ? "/competenze" : "/onboarding";
    case "goal": return "/goal";
    case "ready": return "/prelancio/profilo-pronto";
  }
}

export function useLaunchStatus() {
  const [state, setState] = useState<LaunchStatus | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    const refresh = () => {
      fetch("/api/prelaunch/status", { cache: "no-store" }).then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json() as LaunchStatus;
        if (active) { setState(data); setError(false); }
      }).catch(() => { if (active) setError(true); });
    };
    refresh();
    const interval = window.setInterval(refresh, 60000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);
  return { state, error };
}

type Action = "subscribe" | "confirm" | "unsubscribe" | "join" | "profile-link"
  | "reserve" | "reservation" | "reservation-confirm" | "referral" | "profile-confirm";

export async function launchPost<T = { status: string }>(action: Action, payload: unknown): Promise<T> {
  const response = await fetch("/api/prelaunch/" + action, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload), cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) {
    if (action === "profile-confirm" && response.status === 401) {
      throw new ClientApiError(response.status, "Accedi all’account con cui hai preparato il profilo per completare la conferma.");
    }
    throw new ClientApiError(response.status, typeof data.detail === "string" ? data.detail : "Operazione non riuscita. Riprova.");
  }
  return data;
}
