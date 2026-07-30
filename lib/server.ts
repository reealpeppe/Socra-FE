import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

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

export async function proxyBackend(request: NextRequest, path: string[]): Promise<NextResponse> {
  const token = request.cookies.get(sessionCookie)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Authentication required" }, { status: 401 });
  }

  const search = request.nextUrl.search || "";
  let response: Response;
  try {
    response = await fetch(getBackendUrl(`${path.join("/")}${search}`), {
      method: request.method,
      headers: {
        "Content-Type": request.headers.get("Content-Type") || "application/json",
        Authorization: `Bearer ${token}`
      },
      body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
      cache: "no-store"
    });
  } catch {
    return NextResponse.json({ detail: "Backend unavailable" }, { status: 503 });
  }

  const text = await response.text();
  const proxiedResponse = new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/json"
    }
  });
  if (response.status === 401) clearSessionCookie(proxiedResponse);
  return proxiedResponse;
}
