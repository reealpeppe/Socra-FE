import { NextResponse, type NextRequest } from "next/server";
import { getBackendUrl } from "@/lib/server";
import { guardMutation, readJsonBody, privateJson, bodyError } from "@/lib/web-security";

export async function POST(request: NextRequest) {
  const rejected = guardMutation(request);
  if (rejected) return rejected;
  let payload: string | undefined;
  try { payload = await readJsonBody(request, 4096); }
  catch (error) { return bodyError(error); }
  try {
    const upstream = await fetch(getBackendUrl("/mentor-alerts/unsubscribe"), {
      method: "POST", headers: { "Content-Type": "application/json" }, body: payload,
      cache: "no-store", signal: AbortSignal.timeout(12_000),
    });
    return new NextResponse(await upstream.text(), { status: upstream.status, headers: {
      "Content-Type": "application/json", "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer",
    } });
  } catch { return privateJson({ detail: "Servizio non disponibile. Riprova tra poco." }, 503); }
}
