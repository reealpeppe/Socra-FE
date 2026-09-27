import { NextResponse, type NextRequest } from "next/server";
import { getBackendUrl } from "@/lib/server";
import { readJsonBody, bodyError } from "@/lib/web-security";

export const monitoringCookie = "socra_monitoring";
export const privateHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" };
const routes: Record<string, string> = { access:"GET", meta:"GET", dashboard:"GET", "export.csv":"GET", "mfa/enroll":"POST", "mfa/confirm":"POST", "mfa/verify":"POST", lock:"POST" };

export function monitoringOrigin(fallback?: string): string | undefined {
  const configured=process.env.SOCRA_APP_ORIGIN;
  if (!configured && process.env.NODE_ENV==="production") return undefined;
  try {
    const url=new URL(configured || fallback || "");
    const local=["localhost","127.0.0.1","[::1]"].includes(url.hostname);
    if (url.username || url.password || url.search || url.hash || url.pathname!=="/" ||
        (url.protocol!=="https:" && !(url.protocol==="http:" && (local || process.env.NODE_ENV!=="production")))) return undefined;
    return url.origin;
  } catch { return undefined; }
}

export function clearMonitoringCookie(response: NextResponse): void {
  response.cookies.set(monitoringCookie, "", {httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});
}

export async function monitoringStatus(token?: string, grant?: string): Promise<{status: number; body: {enrolled?: boolean; unlocked?: boolean; detail?: string}}> {
  if (process.env.NODE_ENV==="production" && !monitoringOrigin()) return {status:503,body:{}};
  if (!token) return {status:401,body:{}};
  const response = await fetch(getBackendUrl("/monitoring/access"), {headers:{Authorization:`Bearer ${token}`, ...(grant?{"X-Monitoring-Grant":grant}:{})},cache:"no-store",signal:AbortSignal.timeout(12_000)}).catch(()=>null);
  if (!response) return {status:503,body:{}};
  return {status:response.status,body:await response.json()};
}

export async function monitoringProxy(request: NextRequest, path: string): Promise<NextResponse> {
  const fail=(status:number,detail:string)=>NextResponse.json({detail},{status,headers:privateHeaders});
  if (!routes[path]) return fail(404,"Risorsa non disponibile");
  if (request.method!==routes[path]) return fail(405,"Metodo non consentito");
  const origin=monitoringOrigin(request.nextUrl.origin);
  if (!origin) return fail(503,"Monitoraggio non configurato");
  if (request.method==="POST" && (request.headers.get("origin")!==origin || request.headers.get("Sec-Fetch-Site")==="cross-site")) return fail(403,"Origine non consentita");
  const token=request.cookies.get("socra_session")?.value;
  if (!token) return fail(401,"Accedi a Socra per continuare");
  const grant=request.cookies.get(monitoringCookie)?.value;
  let requestBody: string | undefined;
  try {if(request.method==="POST") requestBody=await readJsonBody(request,16*1024);}
  catch(error){const response=bodyError(error);for(const [name,value] of Object.entries(privateHeaders)) response.headers.set(name,value);return response;}
  const upstream=await fetch(getBackendUrl(`/monitoring/${path}${request.nextUrl.search}`), {
    method:request.method,headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`,...(grant?{"X-Monitoring-Grant":grant}:{})},
    body:requestBody,cache:"no-store",signal:AbortSignal.timeout(15_000)
  }).catch(()=>null);
  if (!upstream) return fail(503,"Monitoraggio temporaneamente non disponibile");
  let proof: string | undefined;
  let seconds=0;
  let body: string | ArrayBuffer;
  const kind=upstream.headers.get("Content-Type") || "application/json";
  if (kind.includes("application/json")) {
    const payload=await upstream.json();
    if (upstream.ok && typeof payload.grant_token==="string") {
      proof=payload.grant_token;seconds=Math.min(28800,Math.max(0,Number(payload.expires_in)||0));
    }
    delete payload.grant_token;
    body=JSON.stringify(payload);
  } else body=await upstream.arrayBuffer();
  const response=new NextResponse(body,{status:upstream.status,headers:{...privateHeaders,"Content-Type":kind,
    ...(upstream.headers.get("Content-Disposition")?{"Content-Disposition":upstream.headers.get("Content-Disposition")!}:{})}});
  if (proof) response.cookies.set(monitoringCookie,proof,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:seconds});
  if (upstream.status===401 || (upstream.status===403 && request.method==="GET") || (upstream.ok && path==="lock")) clearMonitoringCookie(response);
  return response;
}
