import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "node:crypto";

const protectedPrefixes = [
  "/admin",
  "/competenze",
  "/dashboard",
  "/feedback",
  "/goal",
  "/matching",
  "/onboarding",
  "/paths",
  "/profiles",
  "/requests",
  "/settings",
  "/tour",
  "/wallet"
];

export function proxy(request: NextRequest) {
  const monitoring=request.nextUrl.pathname==="/admin/monitoraggio" || request.nextUrl.pathname.startsWith("/admin/monitoraggio/");
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const nonce = randomBytes(18).toString("base64");
  const csp = [
    "default-src 'self'",
    request.nextUrl.pathname==="/admin/monitoraggio" ? "script-src 'self'" : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'",
    "connect-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'"
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  const hasSession = Boolean(request.cookies.get("socra_session")?.value);
  if (isProtected && !hasSession && !monitoring) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Content-Security-Policy", csp);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "private, no-store");
  if(monitoring){
    response.headers.set("X-Robots-Tag","noindex, nofollow");
    response.headers.set("Referrer-Policy","no-referrer");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
