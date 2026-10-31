"use client";
import {useState} from "react";
import {clientPatch} from "@/lib/api";
export type LaunchSchedule={automation_enabled:boolean;expected_launch_at:string|null;first_reminder_days:number|null;final_reminder_days:number|null;announcement_days:number|null};
function localDate(value:string|null){
  if(!value)return '';
  const date=new Date(value);
  return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16);
}
export function PrelaunchScheduleEditor({initial,onSaved}:{initial:LaunchSchedule;onSaved:()=>Promise<void>}){
  const [enabled,setEnabled]=useState(initial.automation_enabled),[date,setDate]=useState(localDate(initial.expected_launch_at));
  const [first,setFirst]=useState(initial.first_reminder_days?.toString()||''),[last,setLast]=useState(initial.final_reminder_days?.toString()||''),[notice,setNotice]=useState(initial.announcement_days?.toString()||'');
  const [busy,setBusy]=useState(false),[message,setMessage]=useState<string|null>(null),[error,setError]=useState<string|null>(null);
  async function save(event:React.FormEvent){
    event.preventDefault();setBusy(true);setError(null);setMessage(null);
    try{
      await clientPatch('/prelaunch/admin/schedule',{automation_enabled:enabled,expected_launch_at:date?new Date(date).toISOString():null,
        first_reminder_days:first?Number(first):null,final_reminder_days:last?Number(last):null,announcement_days:notice?Number(notice):null});
      await onSaved();setMessage(enabled?'Calendario salvato. I promemoria automatici sono attivi.':'Calendario salvato. I promemoria automatici restano disattivati.');
    }catch(reason){setError(reason instanceof Error?reason.message:'Calendario non salvato. Controlla data e intervalli.');}
    finally{setBusy(false);}
  }
  return <form className="stack" onSubmit={save}>
    <h2>Calendario delle comunicazioni</h2>
    <p>Data e intervalli sono da concordare prima degli invii. Finché non li definisci e attivi esplicitamente i promemoria, nessuna comunicazione automatica parte.</p>
    <label className="stack">Data prevista di lancio (ora del tuo dispositivo)<input className="input" type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} disabled={busy}/></label>
    <label className="stack">Primo promemoria: giorni dopo la richiesta email<input className="input" type="number" min={1} max={365} placeholder="Da definire" value={first} onChange={e=>setFirst(e.target.value)} disabled={busy}/></label>
    <label className="stack">Ultimo promemoria: giorni prima del lancio<input className="input" type="number" min={1} max={365} placeholder="Da definire" value={last} onChange={e=>setLast(e.target.value)} disabled={busy}/></label>
    <label className="stack">Avviso a tutti: giorni prima del lancio<input className="input" type="number" min={1} max={365} placeholder="Da definire" value={notice} onChange={e=>setNotice(e.target.value)} disabled={busy}/></label>
    <p className="muted">I due promemoria vanno solo a chi non ha creato l’account. L’ultimo deve precedere l’avviso a tutti. L’apertura effettiva resta un comando separato.</p>
    <label><input type="checkbox" checked={enabled} onChange={e=>setEnabled(e.target.checked)} disabled={busy||!date||!first||!last||!notice}/> Attiva i promemoria automatici</label>
    {error?<p className="error" role="alert">{error}</p>:null}{message?<p role="status">{message}</p>:null}
    <button className="button secondary" type="submit" disabled={busy}>{busy?'Salvataggio…':'Salva calendario'}</button>
  </form>;
}
