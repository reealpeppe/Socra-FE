"use client";
import Link from "next/link";
import {usePathname,useRouter} from "next/navigation";
import {useEffect,useState} from "react";
import {Brand} from "@/components/Brand";
import {authPost,cachedClientValue,clientGet,refreshClientSession,ClientApiError} from "@/lib/api";
import type {UserMe} from "@/lib/types";
import styles from "./Prelaunch.module.css";

export function PrelaunchGate({children}:{children:React.ReactNode}) {
  const pathname=usePathname();
  const personal=["/onboarding","/competenze","/goal","/settings"].includes(pathname);
  const [user,setUser]=useState<UserMe|null>(() => cachedClientValue<UserMe>("/auth/me") ?? null);
  const [error,setError]=useState<string|null>(null);
  useEffect(() => {
    let active=true, generation=0;
    function refresh() {
      const current=++generation;
      clientGet<UserMe>("/auth/me").then(value => {
        if(active && current===generation){setUser(value);setError(null);}
      }).catch(reason => {if(active && current===generation){
        setUser(null);setError(reason instanceof ClientApiError && reason.status===401 ? "Accedi al tuo account per continuare." : "Non riusciamo a verificare l’accesso. Riprova tra poco.");
      }});
    }
    refresh();
    window.addEventListener("socra:session-refresh",refresh);
    const interval=window.setInterval(() => {refreshClientSession();},60000);
    return () => {active=false;window.removeEventListener("socra:session-refresh",refresh);window.clearInterval(interval);};
  },[pathname]);
  if(personal) return <>{user?.prelaunch_blocked ? <aside className={styles.preparation}>
    <strong>Socra sta arrivando!</strong> Prima del lancio ti avviseremo via email. Prepara il tuo profilo se non lo hai già fatto.
    {" "}<Link href="/dashboard">Il tuo accesso al lancio</Link>
  </aside>:null}{children}</>;
  if(!user) return <main className={styles.page} id="main-content"><div className={styles.content}>
    {error ? <><p role="alert">{error}</p><button className="button secondary" onClick={refreshClientSession}>Riprova</button> <Link href={`/login?next=${encodeURIComponent(pathname + window.location.search)}`}>Vai all&apos;accesso</Link></>
      : <p role="status">Verifica dell’accesso…</p>}
  </div></main>;
  if(!user.prelaunch_blocked)return <>{children}</>;
  return <WaitingScreen user={user}/>;
}
function WaitingScreen({user}:{user:UserMe}) {
  const router=useRouter();
  const [error,setError]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  async function logout() {
    setBusy(true);setError(null);
    try {await authPost("logout");router.push("/");router.refresh();}
    catch {setError("Non siamo riusciti a uscire. Riprova.");setBusy(false);}
  }
  return <div className={styles.waiting}>
    <header><Link href="/" aria-label="Socra, pagina iniziale"><Brand variant="dark"/></Link>
      <button className="button ghost" onClick={() => void logout()} disabled={busy}>{busy ? "Uscita…" : "Esci"}</button></header>
    <main id="main-content">
      <div className={styles.preview} aria-hidden="true"><div/><div/></div>
      <section className={styles.waitCard} aria-labelledby="launch-title">
        <p className="eyebrow">Il tuo account è pronto</p>
        <h1 id="launch-title">Socra sta arrivando!</h1>
        <p>Prima del lancio ti avviseremo via email. Nel frattempo, prepara il tuo profilo se non lo hai già fatto.</p>
        <p className={styles.fine}>Survey, esperienza e obiettivi restano salvati e puoi aggiornarli quando vuoi.</p>
        {!user.email_verified ? <p>Conferma il tuo indirizzo dalle impostazioni per ricevere l’avviso e rendere valido il bonus.</p>:null}
        <div className={styles.actions}>
          <Link className="button dark" href="/settings">Modifica il tuo profilo</Link>
          <Link className="button secondary" href="/competenze">La mia esperienza</Link>
          <Link className="button secondary" href="/goal">I miei obiettivi</Link>
        </div>
        <p className={styles.fine}><Link href="/onboarding">Riprendi la survey</Link> · <Link href="/prelancio/condizioni">Condizioni dei bonus</Link></p>
        <button className="button ghost" onClick={refreshClientSession}>Controlla se Socra è aperta</button>
        {error ? <p className={styles.error} role="alert">{error}</p>:null}
      </section>
    </main>
  </div>;
}
