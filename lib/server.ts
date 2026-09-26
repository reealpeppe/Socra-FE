import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { guardMutation, privateJson, readJsonBody, bodyError } from "@/lib/web-security";

const sessionCookie = "socra_session";
const backendBaseUrl = process.env.SOCRA_API_BASE_URL || "http://127.0.0.1:8000";

export function getBackendUrl(path: string): string {
  return `${backendBaseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function getSessionToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(sessionCookie)?.value;
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set(sessionCookie, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(sessionCookie, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });
}

async function proxyPrivateBackend(request: NextRequest, path: string[], verificationRequest = false): Promise<NextResponse> {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  // Route segments are decoded by Next. Deny alternate URL spellings before fetch
  // normalizes them, and keep all token-producing auth routes in dedicated handlers.
  if (!path.length || path.some(segment => !/^[A-Za-z0-9_-]+$/.test(segment)) ||
      (path[0] === "auth" && !(path.length === 2 && path[1] === "me" && request.method === "GET") && !verificationRequest)) {
    return privateJson({ detail: "Backend route unavailable" }, 404);
  }
  const token = request.cookies.get(sessionCookie)?.value;
  if (!token) {
    return privateJson({ detail: "Authentication required" }, 401);
  }

  let body: string | undefined;
  try { if (!["GET", "HEAD"].includes(request.method)) body = await readJsonBody(request, (verificationRequest ? 16 : 256) * 1024, true); }
  catch (error) { return bodyError(error); }

  const search = request.nextUrl.search || "";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), request.method === "GET" ? 12_000 : 22_000);
  let response: Response;
  let text: string;
  try {
    response = await fetch(getBackendUrl(`${path.join("/")}${search}`), {
      method: request.method,
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "application/json",
        Authorization: `Bearer ${token}`
      },
      body,
      cache: "no-store",
      signal: controller.signal
    });
    text = await response.text();
  } catch {
    return privateJson({ detail: controller.signal.aborted ? "Backend timeout" : "Backend unavailable" }, controller.signal.aborted ? 504 : 503);
  } finally { clearTimeout(timer); }
  const proxiedResponse = new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json",
      "Cache-Control": "private, no-store"
    }
  });
  if (response.status === 401) clearSessionCookie(proxiedResponse);
  return proxiedResponse;
}

export function proxyBackend(request: NextRequest, path: string[]): Promise<NextResponse> {
  return proxyPrivateBackend(request, path);
}

export function requestEmailVerification(request: NextRequest): Promise<NextResponse> {
  // Fixed authenticated action; it never creates or returns a session token.
  return proxyPrivateBackend(request, ["auth", "email-verification", "request"], true);
}

export async function authenticate(request: NextRequest, action: "login" | "register"): Promise<NextResponse> {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  let payload: string | undefined;
  try { payload = await readJsonBody(request, 16 * 1024); }
  catch (error) { return bodyError(error); }
  try {
    const upstream = await fetch(getBackendUrl(`/auth/${action}`), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: payload,
      cache: "no-store", signal: AbortSignal.timeout(12_000)
    });
    const body = await upstream.json();
    if (!upstream.ok) return privateJson({ detail: body.detail || "Authentication failed" }, upstream.status);
    if (typeof body.access_token !== "string" || !body.access_token || typeof body.user_id !== "string") {
      return privateJson({ detail: "Invalid backend response" }, 502);
    }
    const response = privateJson({ user_id: body.user_id });
    setSessionCookie(response, body.access_token);
    return response;
  } catch { return privateJson({ detail: "Backend unavailable" }, 503); }
}
