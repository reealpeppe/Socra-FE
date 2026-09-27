"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import OnboardingSurvey from "@/components/OnboardingSurvey";
import { clientGet, clientPost } from "@/lib/api";
import { instrumentOptions } from "@/lib/options";

type Review = { id: string; topic: string; status: string; approved: boolean | null; reason?: string };

export default function CompetencesPage() {
  const [editing, setEditing] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestKey = useRef("");
  useEffect(() => {
    let active = true;
    clientGet<Review[]>("/competences-v3/me/external-experience")
      .then((rows) => { if (active) setReviews(rows); })
      .catch(() => { if (active) setError("Non riusciamo a caricare le verifiche precedenti. Ricarica la pagina per riprovare."); });
    return () => { active = false; };
  }, []);
  if (editing) return <OnboardingSurvey reassessment />;
  return <AppShell><OnboardingGate><div className="stack" style={{ maxWidth: 860, marginInline: "auto", width: "100%" }}>
    <h1>La tua esperienza, nel tempo</h1>
    <section className="card stack">
      <h2>Hai imparato qualcosa di nuovo?</h2>
      <p>Rivedi conoscenze ed esperienza pratica. Le risposte restano private e ci aiutano a proporti confronti pertinenti, argomento per argomento.</p>
      <p className="muted">Puoi scegliere gli strumenti su cui condividere la tua esperienza. Per confronti più approfonditi contano anche i percorsi svolti, i feedback e le eventuali verifiche.</p>
      <button className="button dark" onClick={() => setEditing(true)}>Rivedi le risposte</button>
    </section>
    <form className="card stack" onSubmit={async (event) => {
      event.preventDefault();
      if (busy || !topic || description.trim().length < 50) return;
      setBusy(true); setError(null); setMessage(null);
      if (!requestKey.current) requestKey.current = crypto.randomUUID();
      try {
        await clientPost("/competences-v3/me/external-experience", { topic, description: description.trim(), idempotency_key: requestKey.current });
        setMessage("Richiesta inviata. Gli admin potranno contattarti per una verifica tecnica.");
        setDescription(""); requestKey.current = "";
        const rows = await clientGet<Review[]>("/competences-v3/me/external-experience"); setReviews(rows);
      } catch (err) { setError(err instanceof Error ? err.message : "Richiesta non inviata."); }
      finally { setBusy(false); }
    }}>
      <h2>Esperienza maturata fuori da Socra</h2>
      <p>Prima aggiorna la survey, poi descrivi cosa hai imparato e messo in pratica. La verifica riguarda la tua preparazione, non i risultati economici.</p>
      <label htmlFor="experience-topic">Argomento</label>
      <select id="experience-topic" className="input" required disabled={busy} value={topic} onChange={(event) => { setTopic(event.target.value); requestKey.current = ""; }}>
        <option value="">Scegli uno strumento</option>
        {instrumentOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <label htmlFor="experience-description">Cosa hai imparato e praticato?</label>
      <textarea id="experience-description" className="input" rows={5} required minLength={50} maxLength={2000} disabled={busy} value={description}
        onChange={(event) => { setDescription(event.target.value); requestKey.current = ""; }} aria-describedby="experience-hint" />
      <small id="experience-hint">{description.trim().length}/2000 · almeno 50 caratteri. Non inserire estratti conto, documenti, saldi o credenziali.</small>
      <button type="submit" className="button dark" disabled={busy || !topic || description.trim().length < 50}>{busy ? "Invio…" : "Richiedi una verifica"}</button>
    </form>
    {error ? <p className="error" role="alert">{error}</p> : null}
    {message ? <p role="status">{message}</p> : null}
    {reviews.length ? <section className="card stack"><h2>Le tue richieste</h2>{reviews.map((review) => <div key={review.id}>
      <strong>{instrumentOptions.find((item) => item.value === review.topic)?.label || "Strumento"}</strong>
      <p>{review.status === "superseded" ? "Sostituita da una richiesta più recente" : review.status === "resolved" ? review.approved ? "Verifica completata: approvata" : "Verifica completata: non approvata" : "In attesa di verifica"}</p>
      {review.reason ? <p>{review.reason}</p> : null}
    </div>)}</section> : null}
    <Link href="/settings">Torna alle impostazioni</Link>
  </div></OnboardingGate></AppShell>;
}
