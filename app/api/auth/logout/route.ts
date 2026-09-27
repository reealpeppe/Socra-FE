import type { NextRequest } from "next/server";
import { clearSessionCookie, getBackendUrl } from "@/lib/server";
import { guardMutation, privateJson } from "@/lib/web-security";

export async function POST(request: NextRequest) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  const token = request.cookies.get("socra_session")?.value;
  if (token) {
    await fetch(getBackendUrl("/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000)
    }).catch(() => undefined);
  }
  const response = privateJson({ status: "ok" });
  clearSessionCookie(response);
  return response;
}
