import { NextResponse, type NextRequest } from "next/server";
import { getBackendUrl, setSessionCookie } from "@/lib/server";
import type { TokenResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const payload = await request.json();
  const backendResponse = await fetch(getBackendUrl("/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  const body = await backendResponse.json();
  const response = NextResponse.json(body, { status: backendResponse.status });
  if (backendResponse.ok) {
    setSessionCookie(response, (body as TokenResponse).access_token);
  }
  return response;
}
