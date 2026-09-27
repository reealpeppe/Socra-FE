import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { monitoringCookie, monitoringStatus } from "@/lib/monitoring-server";
import { MonitoringMfa } from "@/components/MonitoringMfa";

export const dynamic="force-dynamic";
export const metadata: Metadata={title:"Accesso al monitoraggio",robots:{index:false,follow:false}};

export default async function MonitoringVerification() {
  const store=await cookies();
  const access=await monitoringStatus(store.get("socra_session")?.value,store.get(monitoringCookie)?.value);
  if(access.status===401) redirect("/login?next=/admin/monitoraggio");
  if(access.status!==200) return <main style={{maxWidth:560,margin:"80px auto",padding:24}}><h1>Monitoraggio riservato</h1><p>{access.status===403?"Questo account non è autorizzato ad accedere alla dashboard.":"Monitoraggio temporaneamente non disponibile. Riprova più tardi."}</p><a href="/dashboard">Torna a Socra</a></main>;
  if(access.body.unlocked) redirect("/admin/monitoraggio");
  return <MonitoringMfa enrolled={Boolean(access.body.enrolled)} />;
}
