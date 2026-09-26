import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, getBackendUrl } from "@/lib/server";
import { guardMutation, readJsonBody, privateJson, bodyError } from "@/lib/web-security";

/** Only fixed public account actions are exposed; the session bearer never enters the response. */
export async function proxyAccountAction(request: NextRequest, path: "email-verification/confirm" | "password-reset/request" | "password-reset/confirm") {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  let payload: string | undefined;
  try { payload = await readJsonBody(request, 16 * 1024); }
  catch (error) { return bodyError(error); }
  const upstream = await fetch(getBackendUrl(`/auth/${path}`), {
    method: "POST", headers: { "Content-Type": "application/json" }, body: payload,
    cache: "no-store", signal: AbortSignal.timeout(12_000),
  }).catch(() => null);
  if (!upstream) return privateJson({ detail: "Backend unavailable" }, 503);
  const response = new NextResponse(await upstream.text(), { status: upstream.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  if (upstream.ok && path === "password-reset/confirm") clearSessionCookie(response);
  return response;
}
