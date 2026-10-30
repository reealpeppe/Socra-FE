"use client";
import Link from "next/link";
import {useLaunchStatus} from "@/lib/prelaunch";
import styles from "./Prelaunch.module.css";
export function PrelaunchNotice() {
  const {state} = useLaunchStatus();
  if(state?.phase !== "prelaunch")return null;
  return <aside className={styles.notice} aria-label="Pre-lancio Socra">
    <strong>Socra sta arrivando.</strong> Puoi già registrarti e preparare il tuo profilo: gli scambi apriranno al lancio.
    <Link href="/prelancio">Avvisami al lancio</Link><Link href="/prelancio/condizioni">Scopri i bonus</Link>
  </aside>;
}
