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
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = body as ApiError | null;
    throw new ClientApiError(response.status, error?.detail || error?.message || "Request failed");
  }
  return body as T;
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
