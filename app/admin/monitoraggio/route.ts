import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { monitoringCookie, monitoringStatus, monitoringOrigin, privateHeaders } from "@/lib/monitoring-server";
import { monitoringHTML } from "@/lib/monitoring-shell";

export const dynamic="force-dynamic";
export async function GET(request: NextRequest) {
  const origin=monitoringOrigin(request.nextUrl.origin);
  if(!origin) return NextResponse.json({detail:"Monitoraggio non configurato"},{status:503,headers:privateHeaders});
  const store=await cookies();
  const access=await monitoringStatus(store.get("socra_session")?.value,store.get(monitoringCookie)?.value);
  if(access.status===401) return NextResponse.redirect(new URL("/login?next=/admin/monitoraggio",origin),{headers:privateHeaders});
  if(access.status!==200) return new NextResponse('<!doctype html><html lang="it"><meta charset="utf-8"><title>Monitoraggio riservato</title><main><h1>Monitoraggio riservato</h1><p>'+ (access.status===403?'Questo account non è autorizzato ad accedere alla dashboard.':'Monitoraggio temporaneamente non disponibile.')+'</p><a href="/dashboard">Torna a Socra</a></main></html>',{status:access.status,headers:{...privateHeaders,"Content-Type":"text/html; charset=utf-8"}});
  if(!access.body.unlocked) return NextResponse.redirect(new URL("/admin/monitoraggio/verifica",origin),{headers:privateHeaders});
  return new NextResponse(monitoringHTML,{headers:{...privateHeaders,"Content-Type":"text/html; charset=utf-8", "Content-Security-Policy":"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"}});
}
