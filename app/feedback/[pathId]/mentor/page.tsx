"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gauge, MessageSquareText, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { PathItem } from "@/lib/types";

export default function MentorFeedbackPage({ params }: { params: { pathId: string } }) {
  const router = useRouter();
  const [effort, setEffort] = useState(4);
  const [reliability, setReliability] = useState(4);
  const [competence, setCompetence] = useState(7);
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientGet<PathItem>(`/paths/${params.pathId}`)
      .then((path) => setTopic(path.goal?.topic || "undefined"))
      .catch(() => setTopic("undefined"));
  }, [params.pathId]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await clientPost(`/feedback/${params.pathId}/mentor`, {
        answers: { effort, reliability },
        text_note: text || null,
      });
      await clientPost(`/feedback/${params.pathId}/mentee-competence`, { topic, score: competence });
      router.push(`/paths/${params.pathId}`);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Feedback non salvato");
    }
  }

  return (
    <AppShell>
      <OnboardingGate>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "24px", maxWidth: "700px" }}>
          <div>
            <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
              Feedback sul mentee
            </h1>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Condividi una valutazione sintetica su partecipazione, affidabilità e progressi del mentee.
            </p>
          </div>

          <div className="card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px 24px" }}>
            <span style={{
              alignItems: "center", background: "var(--navy-950)", borderRadius: "999px",
              color: "var(--gold-500)", display: "inline-flex", flexShrink: 0,
              height: "44px", justifyContent: "center", width: "44px"
            }}>
              <Gauge size={22} aria-hidden />
            </span>
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.75rem", fontWeight: 800, letterSpacing: "0.08em", margin: "0 0 2px", textTransform: "uppercase" }}>
                Valutazione del percorso
              </p>
              <strong style={{ color: "var(--navy-950)", fontSize: "1.05rem", lineHeight: 1 }}>Usa le scale qui sotto per descrivere l&apos;esperienza</strong>
            </div>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="card">
            <div style={{ display: "grid", gap: "20px" }}>
              <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <NumberField label="Impegno e partecipazione" min={1} max={5} value={effort} onChange={setEffort} />
                <NumberField label="Affidabilità" min={1} max={5} value={reliability} onChange={setReliability} />
                <NumberField label="Conoscenza dell&apos;argomento oggi" min={1} max={10} value={competence} onChange={setCompetence} />
                <div style={{ display: "grid", gap: "6px" }}>
                  <label style={{ color: "var(--navy-950)", fontSize: "0.85rem", fontWeight: 800 }}>Argomento del percorso</label>
                  <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: "grid", gap: "6px" }}>
                <label style={{
                  alignItems: "center", color: "var(--navy-950)",
                  display: "flex", fontSize: "0.85rem", fontWeight: 800, gap: "6px"
                }}>
                  <MessageSquareText size={15} aria-hidden /> Nota opzionale
                </label>
                <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="button dark" type="submit" disabled={!topic} style={{ gap: "8px", minWidth: "200px" }}>
              <Star size={16} aria-hidden /> Invia feedback
            </button>
          </div>
        </form>
      </OnboardingGate>
    </AppShell>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <label style={{ color: "var(--navy-950)", fontSize: "0.85rem", fontWeight: 800 }}>{label}</label>
      <div style={{ alignItems: "center", display: "grid", gap: "10px", gridTemplateColumns: "minmax(0, 1fr) 72px" }}>
        <input
          className="input"
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ accentColor: "var(--gold-500)", paddingLeft: 0, paddingRight: 0 }}
        />
        <input
          className="input"
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ textAlign: "center" }}
        />
      </div>
    </div>
  );
}
