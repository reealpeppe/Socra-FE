"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clientGet, clientPost } from "@/lib/api";

type Alternative = { topic: string; goal_tag: string; topic_label: string; goal_label: string; message: string };

export function GoalAlternatives({ goalId }: { goalId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<Alternative[]>([]);
  const [choice, setChoice] = useState<Alternative | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestKey = useRef("");
  useEffect(() => {
    let active = true;
    clientGet<Alternative[]>(`/matching/alternatives?goal_id=${encodeURIComponent(goalId)}`)
      .then((result) => { if (active) setItems(result); })
      .catch(() => { if (active) setError("Non riusciamo a verificare gli obiettivi alternativi. Puoi riprovare aggiornando la ricerca."); });
    return () => { active = false; };
  }, [goalId]);
  if (!items.length) return error ? <p className="muted" role="status">{error}</p> : null;
  return <section className="card stack" style={{ textAlign: "left", width: "100%" }}>
    <h2>Un altro punto da cui partire?</h2>
    <p>Questi percorsi hanno persone disponibili, ma rispondono a un obiettivo diverso. Il tuo obiettivo non cambia senza la tua conferma.</p>
    {items.map((item) => <button type="button" className="button secondary" aria-pressed={choice === item} key={`${item.topic}:${item.goal_tag}`} disabled={busy}
      onClick={() => { setChoice(item); setConfirmed(false); requestKey.current = crypto.randomUUID(); setError(null); }}>{item.goal_label} · {item.topic_label}</button>)}
    {choice ? <form className="stack" onSubmit={async (event) => {
      event.preventDefault();
      if (!confirmed || busy) return;
      setBusy(true); setError(null);
      try {
        const result = await clientPost<{ goal_id: string }>("/matching/alternatives/choose", {
          goal_id: goalId, topic: choice.topic, goal_tag: choice.goal_tag, confirm: true, idempotency_key: requestKey.current,
        });
        router.push(`/matching?goalId=${result.goal_id}`);
      } catch (err) { setError(err instanceof Error ? err.message : "Scelta non salvata."); }
      finally { setBusy(false); }
    }}>
      <p>{choice.message}</p>
      <label className="cluster"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(event) => setConfirmed(event.target.checked)} />Voglio sostituire il mio obiettivo attivo con questo. Nessun percorso viene avviato.</label>
      <button type="submit" className="button dark" disabled={!confirmed || busy}>{busy ? "Salvataggio…" : "Conferma nuovo obiettivo"}</button>
    </form> : null}
    {error ? <p className="error" role="alert">{error}</p> : null}
  </section>;
}
