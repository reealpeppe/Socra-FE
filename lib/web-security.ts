import { NextResponse, type NextRequest } from "next/server";

export function privateJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function guardMutation(request: NextRequest): NextResponse | undefined {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origins = (process.env.SOCRA_PUBLIC_ORIGINS || (process.env.NODE_ENV === "production"
    ? "https://www.socra.it,https://socra.it" : "http://localhost:3000,http://127.0.0.1:3000")).split(",").map(value => value.trim());
  const origin = request.headers.get("Origin");
  if (!origin || !origins.includes(origin) || request.headers.get("Sec-Fetch-Site") === "cross-site") {
    return privateJson({ detail: "Untrusted request origin" }, 403);
  }
}

export class RequestBodyError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function readJsonBody(request: NextRequest, limit: number, allowEmpty = false): Promise<string | undefined> {
  const reader = request.body?.getReader();
  if (!reader) {
    if (allowEmpty) return undefined;
    throw new RequestBodyError(400, "JSON body required");
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw new RequestBodyError(413, "Request body too large");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  if (!size && allowEmpty) return undefined;
  if (request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new RequestBodyError(415, "Content-Type must be application/json");
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
    return JSON.stringify(parsed);
  } catch { throw new RequestBodyError(400, "Invalid JSON object"); }
}

export function bodyError(error: unknown): NextResponse {
  return error instanceof RequestBodyError ? privateJson({ detail: error.message }, error.status)
    : privateJson({ detail: "Invalid request body" }, 400);
}
