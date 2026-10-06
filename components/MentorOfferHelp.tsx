"use client";
import {useId,useState} from 'react';
import styles from './SkillLearning.module.css';

export function MentorOfferHelp(){
  const id=useId(),[open,setOpen]=useState(false);
  return <div className={styles.offerHelp}>
    <p className="muted">“Posso aiutare” indica le attività su cui vuoi offrire un confronto. Prima seleziona la capacità che sai svolgere.</p>
    <button className="button secondary" type="button" aria-expanded={open} aria-controls={id} onClick={()=>setOpen(v=>!v)}>Cosa significa Posso aiutare?</button>
    <div id={id} hidden={!open} className={styles.notice}><p>Selezionando questa voce scegli di offrire aiuto ad altre persone su questa attività. Potrai ricevere richieste compatibili quando la tua disponibilità come mentor è attiva. Puoi cambiare scelta o mettere in pausa la disponibilità dalle impostazioni. I percorsi già aperti continuano.</p></div>
  </div>;
}
