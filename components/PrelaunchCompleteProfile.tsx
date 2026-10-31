"use client";
import {useEffect,useRef,useState} from "react";
import Link from "next/link";
import {launchPost} from "@/lib/prelaunch";
import {RegistrationForm} from "./RegistrationForm";
import styles from "./Prelaunch.module.css";
export function PrelaunchCompleteProfile(){
  const [proof,setProof]=useState<{token:string;email:string}|null>(null),[error,setError]=useState<string|null>(null);
  const personalToken=useRef<string|null>(null);
  useEffect(()=>{
    let active=true;
    if(personalToken.current===null)personalToken.current=new URLSearchParams(window.location.hash.slice(1)).get('token')||'';
    const token=personalToken.current;
    window.history.replaceState(null,'',window.location.pathname);
    if(!token){queueMicrotask(()=>{if(active)setError('Riapri il link personale dalla tua email oppure richiedine uno nuovo.');});return()=>{active=false;};}
    launchPost('profile-link',{token}).then(value=>{if(active)setProof({token,email:value.email});})
      .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'Link non disponibile.');});
    return()=>{active=false;};
  },[]);
  if(proof)return <RegistrationForm proof={proof}/>;
  return <main className={styles.page} id="main-content"><div className={styles.content}>
    {error?<><h1>Riprendiamo da qui.</h1><p role="alert">{error}</p><Link className="button dark" href="/prelancio">Richiedi un nuovo link</Link><p><Link href="/login?accesso=1">Hai già un account? Accedi</Link></p><p><Link href="/register">Se Socra è già aperta, crea il tuo account</Link></p></>:<p role="status">Verifica del tuo link personale…</p>}
  </div></main>;
}
