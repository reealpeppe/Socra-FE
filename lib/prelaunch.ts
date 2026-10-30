"use client";
import {useEffect, useState} from "react";
export type LaunchStatus = {phase:"prelaunch"|"open";campaign_enabled:boolean;email_delivery_enabled:boolean;
  email_bonus:number;registration_bonus:number;redemption_days:number;redeem_until:string|null};
export function useLaunchStatus() {
  const [state,setState] = useState<LaunchStatus|null>(null);
  const [error,setError] = useState(false);
  useEffect(() => {
    let active=true;
    const refresh=() => {
      fetch("/api/prelaunch/status",{cache:"no-store"}).then(async response => {
        if (!response.ok) throw new Error();
        const data = await response.json() as LaunchStatus;
        if(active) {setState(data);setError(false);}
      }).catch(() => {if(active)setError(true);});
    };
    refresh();
    const interval=window.setInterval(refresh,60000);
    return () => {active=false;window.clearInterval(interval);};
  },[]);
  return {state,error};
}
export async function launchPost(action:"subscribe"|"confirm"|"unsubscribe", payload:unknown) {
  const response = await fetch("/api/prelaunch/"+action,{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload),cache:"no-store"});
  const data = await response.json();
  if(!response.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Operazione non riuscita. Riprova.");
  return data;
}
