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
  "/wallet"
];

export function middleware(request: NextRequest) {
  const isProtected = protectedPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix));
  const hasSession = Boolean(request.cookies.get("socra_session")?.value);
  if (isProtected && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
