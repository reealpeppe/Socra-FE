"use client";
import {useSearchParams} from "next/navigation";
import {useLaunchStatus} from "@/lib/prelaunch";
import {PrelaunchSignup} from "./PrelaunchSignup";
import styles from "./Prelaunch.module.css";
export function PrelaunchAuthBoundary({mode,children}:{mode:"login"|"register";children:React.ReactNode}){
  const {state,error}=useLaunchStatus();
  const existing=useSearchParams().get('accesso')==='1';
  if(error)return <main className={styles.page} id="main-content"><div className={styles.content}><p role="alert">Non riusciamo a verificare l’apertura della community. Riprova tra poco.</p><button className="button secondary" onClick={()=>window.location.reload()}>Riprova</button></div></main>;
  if(!state)return <main className={styles.page} id="main-content"><p role="status">Un momento…</p></main>;
  if(state.phase==='prelaunch' && !(mode==='login' && existing))return <PrelaunchSignup/>;
  return <>{children}</>;
}
