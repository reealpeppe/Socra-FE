"use client";
import Link from "next/link";
import {useLaunchStatus} from "@/lib/prelaunch";
import styles from "./Prelaunch.module.css";
export function PrelaunchNotice() {
  const {state} = useLaunchStatus();
  if(state?.phase !== "prelaunch")return null;
  return <aside className={styles.notice} aria-label="Pre-lancio Socra">
    <strong>Socra sta arrivando.</strong> Parti dalla tua email e prepara il profilo prima dell’apertura della community.
    <Link href="/prelancio">Inizia da qui</Link>
  </aside>;
}
