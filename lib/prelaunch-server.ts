import type {NextRequest} from "next/server";
import {getBackendUrl} from "@/lib/server";
import {guardMutation, readJsonBody, bodyError, privateJson} from "@/lib/web-security";

export async function prelaunchStatus() {
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 12000);
  try {
    const upstream = await fetch(getBackendUrl("/prelaunch/status"), {cache:"no-store", signal:controller.signal});
    const value = await upstream.json();
    if (!upstream.ok || !["prelaunch","open"].includes(value.phase)
      || typeof value.campaign_enabled !== "boolean" || typeof value.email_delivery_enabled !== "boolean"
      || value.email_bonus !== 1 || value.registration_bonus !== 2 || value.redemption_days !== 30) throw new Error();
    return privateJson({phase:value.phase, campaign_enabled:value.campaign_enabled,
      email_delivery_enabled:value.email_delivery_enabled, email_bonus:1, registration_bonus:2, redemption_days:30,
      redeem_until:typeof value.redeem_until === "string" ? value.redeem_until : null});
  } catch { return privateJson({detail:"Le informazioni sul lancio non sono disponibili. Riprova tra poco."},503); }
  finally { clearTimeout(timer); }
}
export async function prelaunchMutation(request:NextRequest, action:"subscribe"|"confirm"|"unsubscribe") {
  const rejected = guardMutation(request); if (rejected) return rejected;
  if (!["subscribe","confirm","unsubscribe"].includes(action)) return privateJson({detail:"Not found"},404);
  let body:string;
  try { body = (await readJsonBody(request,4096))!; } catch (error) { return bodyError(error); }
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(),12000);
  try {
    const upstream = await fetch(getBackendUrl("/prelaunch/" + action), {
      method:"POST", headers:{"Content-Type":"application/json"}, body, cache:"no-store", signal:controller.signal
    });
    await upstream.text();
    const response = privateJson(upstream.ok ? {status:"ok"} : {
      detail:action === "subscribe" ? "Non siamo riusciti a salvare la richiesta. Controlla l’indirizzo e riprova."
        : "Il link non è valido o è scaduto. Puoi richiedere un nuovo avviso dal sito."
    }, upstream.status);
    response.headers.set("Referrer-Policy","no-referrer");
    return response;
  } catch { return privateJson({detail:"Il servizio non è disponibile. Riprova tra poco."},503); }
  finally { clearTimeout(timer); }
}
