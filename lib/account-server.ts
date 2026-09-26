import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, getBackendUrl } from "@/lib/server";

/** Only fixed public account actions are exposed; the session bearer never enters the response. */
export async function proxyAccountAction(request: NextRequest, path: "email-verification/confirm" | "password-reset/request" | "password-reset/confirm") {
  let payload: unknown;
  try { payload = await request.json(); }
  catch { return NextResponse.json({ detail: "Invalid request" }, { status: 400 }); }
  const upstream = await fetch(getBackendUrl(`/auth/${path}`), {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    cache: "no-store", signal: AbortSignal.timeout(12_000),
  }).catch(() => null);
  if (!upstream) return NextResponse.json({ detail: "Backend unavailable" }, { status: 503 });
  const response = new NextResponse(await upstream.text(), { status: upstream.status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
  if (upstream.ok && path === "password-reset/confirm") clearSessionCookie(response);
  return response;
}
