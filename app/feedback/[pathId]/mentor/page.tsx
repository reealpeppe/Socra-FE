"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Gauge, MessageSquareText, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ClientApiError, clientPost } from "@/lib/api";

export default function MentorFeedbackPage({ params }: { params: { pathId: string } }) {
  const router = useRouter();
  const [effort, setEffort] = useState(8);
  const [reliability, setReliability] = useState(8);
  const [competence, setCompetence] = useState(7);
  const [topic, setTopic] = useState("etf_funds");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const internalScore = Math.round(((effort + reliability) / 20) * 100);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await clientPost(`/feedback/${params.pathId}/mentor`, {
        answers: { effort, reliability },
        text_note: text || null,
        internal_score: internalScore
      });
      await clientPost(`/feedback/${params.pathId}/mentee-competence`, { topic, score: competence }).catch(() => undefined);
      router.push(`/paths/${params.pathId}`);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Feedback non salvato");
    }
  }

  return (
    <AppShell>
      <OnboardingGate>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "24px", maxWidth: "700px" }}>
          {/* Header */}
          <div>
            <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
              Lascia il tuo feedback
            </h1>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Valuta impegno e affidabilità del mentee. La competenza resta un segnale controllato.
            </p>
          </div>

          {/* Score summary card */}
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
                Score interno calcolato
              </p>
              <strong style={{ color: "var(--navy-950)", fontSize: "2rem", lineHeight: 1 }}>{internalScore}</strong>
            </div>
          </div>

          {error ? <p className="error">{error}</p> : null}

          {/* Form card */}
          <div className="card">
            <div style={{ display: "grid", gap: "20px" }}>
              <div style={{
                background: "#fff8e8", border: "1px solid rgba(245,182,47,0.3)",
                borderRadius: "var(--radius-sm)", padding: "12px 14px"
              }}>
                <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: 0 }}>
                  Usa valori da 1 a 10. La nota è opzionale e resta nel flusso feedback.
                </p>
              </div>

              <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
                <NumberField label="Impegno" value={effort} onChange={setEffort} />
                <NumberField label="Affidabilità" value={reliability} onChange={setReliability} />
                <NumberField label="Competenza topic" value={competence} onChange={setCompetence} />
                <div style={{ display: "grid", gap: "6px" }}>
                  <label style={{ color: "var(--navy-950)", fontSize: "0.85rem", fontWeight: 800 }}>Topic</label>
                  <input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} />
                </div>
              </div>

              {/* Textarea full width */}
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
            <button className="button dark" type="submit" style={{ gap: "8px", minWidth: "200px" }}>
              <Star size={16} aria-hidden /> Invia feedback
            </button>
          </div>
        </form>
      </OnboardingGate>
    </AppShell>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <label style={{ color: "var(--navy-950)", fontSize: "0.85rem", fontWeight: 800 }}>{label}</label>
      <div style={{ alignItems: "center", display: "grid", gap: "10px", gridTemplateColumns: "minmax(0, 1fr) 72px" }}>
        <input
          className="input"
          type="range"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ accentColor: "var(--gold-500)", paddingLeft: 0, paddingRight: 0 }}
        />
        <input
          className="input"
          type="number"
          min={1}
          max={10}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ textAlign: "center" }}
        />
      </div>
    </div>
  );
}
