"use client";
import {useState} from "react";
import {UserPlus} from "lucide-react";
import type {Goal} from "@/lib/types";
import {InvitationDialog} from "./InvitationDialog";
import styles from "./Invitation.module.css";

export function InviteSomeone({goals,ownerId,prominent=false}:{goals:Goal[];ownerId:string;prominent?:boolean}){
  const [open,setOpen]=useState(false);
  const trigger=<button className={prominent?'button primary':'button secondary'} type="button" onClick={()=>setOpen(true)}>{prominent?'Crea un invito':'Invita qualcuno'}</button>;
  return <>{prominent?<section className={`card ${styles.panel}`} aria-labelledby="invite-someone-title"><span className={styles.icon}><UserPlus size={24} aria-hidden="true"/></span><h2 id="invite-someone-title">Conosci qualcuno che può aiutarti?</h2><p>Invitalo su Socra per iniziare un percorso insieme. Il vostro primo percorso da invito non userà i tuoi crediti. Se è una persona nuova su Socra, quando lo completerete riceverete 3 coin bonus ciascuno.</p>{trigger}</section>:trigger}{open?<InvitationDialog key={ownerId} goals={goals} onClose={()=>setOpen(false)}/>:null}</>;
}
