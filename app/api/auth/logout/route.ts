import { NextResponse, type NextRequest } from "next/server";
import { clearSessionCookie, getBackendUrl } from "@/lib/server";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("socra_session")?.value;
  if (token) {
    await fetch(getBackendUrl("/auth/logout"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store"
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ status: "ok" });
  clearSessionCookie(response);
  return response;
}
