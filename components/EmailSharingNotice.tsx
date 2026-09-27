"use client";

import { useId } from "react";

export function EmailSharingNotice({ accepted, onChange, disabled = false }: {
  accepted: boolean; onChange: (accepted: boolean) => void; disabled?: boolean;
}) {
  const id = useId();
  return <div className="email-sharing-notice">
    <p>Per organizzare gli incontri, dopo l’accettazione del percorso ciascuno riceverà l’email dell’altra persona. I recapiti saranno visibili solo a voi nel percorso, mai nei profili pubblici o nelle proposte in attesa. Questa condivisione non è un consenso al marketing.</p>
    <label htmlFor={id}>
      <input id={id} type="checkbox" required checked={accepted} disabled={disabled} onChange={event => onChange(event.target.checked)} />
      <span>Accetto la condivisione della mia email con l’altra persona per organizzare questo percorso.</span>
    </label>
    <style jsx>{`
      .email-sharing-notice { background: var(--paper); border: 1px solid var(--line); border-left: 3px solid var(--gold-500); border-radius: 12px; display: grid; gap: 12px; padding: 14px 16px; }
      p { color: var(--muted); font-size: .84rem; line-height: 1.6; margin: 0; }
      label { align-items: flex-start; cursor: pointer; display: flex; gap: 10px; font-size: .86rem; font-weight: 700; line-height: 1.5; }
      input { accent-color: var(--navy-950); flex-shrink: 0; height: 18px; margin-top: 2px; width: 18px; }
      input:focus-visible { outline: 3px solid var(--gold-500); outline-offset: 3px; }
    `}</style>
  </div>;
}
