import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/competenze", "/dashboard", "/feedback", "/goal", "/matching", "/onboarding", "/paths", "/profiles", "/requests", "/settings", "/tour", "/wallet"];

export function proxy(request: NextRequest) {
  const pathname=request.nextUrl.pathname;
  const monitoring=pathname==="/admin/monitoraggio" || pathname.startsWith("/admin/monitoraggio/");
  const isProtected=protectedPrefixes.some(prefix=>pathname.startsWith(prefix));
  const hasSession=Boolean(request.cookies.get("socra_session")?.value);
  // Monitoring performs full session/permission/MFA validation in its server
  // routes, including canonical-origin redirects. Preserve all existing gates.
  if(isProtected && !hasSession && !monitoring){
    const loginUrl=new URL("/login",request.url);
    loginUrl.searchParams.set("next",`${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }
  const response=NextResponse.next();
  if(monitoring){
    response.headers.set("Cache-Control","private, no-store");
    response.headers.set("X-Robots-Tag","noindex, nofollow");
    response.headers.set("Referrer-Policy","no-referrer");
  }
  return response;
}
export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
