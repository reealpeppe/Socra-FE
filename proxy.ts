import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = [
  "/admin",
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
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  const hasSession = Boolean(request.cookies.get("socra_session")?.value);
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
