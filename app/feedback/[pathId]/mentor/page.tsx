"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Gauge, MessageSquareText, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { PathItem, UserMe } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";

export default function MentorFeedbackPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const router = useRouter();
  const [effort, setEffort] = useState<number | null>(null);
  const [reliability, setReliability] = useState<number | null>(null);
  const [competence, setCompetence] = useState<number | null>(null);
  const [topic, setTopic] = useState("");
  const [topicLabel, setTopicLabel] = useState("");
  const [text, setText] = useState("");
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      clientGet<UserMe>("/auth/me"),
      clientGet<PathItem>(`/paths/${pathId}`),
    ])
      .then(([me, path]) => {
        if (!active) return;
        if (path.mentor_id !== me.id) throw new Error("Questo feedback è riservato al mentor del percorso.");
        if (!path.mentor_closed_at && path.status !== "completed") {
          throw new Error("Chiudi prima il tuo lato del percorso.");
        }
        if (path.mentor_feedback_submitted) throw new Error("Hai già inviato il feedback per questo percorso.");
        const topicCode = path.goal?.topic_code;
        if (!topicCode) throw new Error("Argomento del percorso non disponibile.");
        setTopic(topicCode);
        setTopicLabel(path.goal?.topic || topicCode);
        setEligible(true);
      })
      .catch((err: { message?: string }) => {
        if (active) setError(err.message || "Feedback non disponibile.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pathId]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!eligible || effort === null || reliability === null || competence === null || !topic) {
      setError("Completa tutte le valutazioni obbligatorie.");
      const targetId = effort === null
        ? "mentor-effort"
        : reliability === null
          ? "mentor-reliability"
          : "mentor-competence";
      window.requestAnimationFrame(() => document.getElementById(targetId)?.focus());
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await clientPost(`/feedback/${pathId}/mentor`, {
        answers: { effort, reliability },
        text_note: text.trim() || null,
        competence_topic: topic,
        competence_score: competence,
      });
      router.push(`/paths/${pathId}?feedback=sent`);
    } catch (err) {
      setError(err instanceof ClientApiError ? err.message : "Feedback non salvato");
    } finally {
      setSubmitting(false);
    }
  }

  const completedRequired = [effort, reliability, competence].filter((value) => value !== null).length;
  const isDirty = effort !== null || reliability !== null || competence !== null || text.length > 0;
  useUnsavedChangesGuard(eligible && isDirty);

  return (
    <AppShell primaryAction={{ href: `/paths/${pathId}`, label: "Torna al percorso" }}>
      <OnboardingGate>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "24px", margin: "0 auto", maxWidth: "700px", width: "100%" }}>
          <div>
            <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
              Feedback sul mentee
            </h1>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Le valutazioni numeriche restano indipendenti. L’eventuale nota testuale sarà visibile solo a voi due e agli admin, dopo che entrambi avrete inviato il feedback.
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
              <strong style={{ color: "var(--navy-950)", fontSize: "1.05rem", lineHeight: 1 }}>
                Nessuna risposta è preselezionata
              </strong>
            </div>
          </div>

          {loading ? <div className="card" role="status">Caricamento feedback…</div> : null}
          {error ? <p className="error" role="alert">{error}</p> : null}

          {!loading && eligible ? (
            <>
              <div className="card">
                <p className="muted" role="status" aria-live="polite" style={{ marginBottom: "16px" }}>
                  Valutazioni completate: {completedRequired} di 3
                </p>
                <div className="mentor-feedback-grid">
                  <ScoreField
                    id="mentor-effort"
                    label="Impegno e partecipazione"
                    min={1}
                    max={5}
                    value={effort}
                    onChange={setEffort}
                    disabled={submitting}
                  />
                  <ScoreField
                    id="mentor-reliability"
                    label="Affidabilità"
                    min={1}
                    max={5}
                    value={reliability}
                    onChange={setReliability}
                    disabled={submitting}
                  />
                  <ScoreField
                    id="mentor-competence"
                    label={`Conoscenza del mentee su “${topicLabel}” oggi`}
                    min={1}
                    max={10}
                    value={competence}
                    onChange={setCompetence}
                    disabled={submitting}
                  />
                </div>

                <div style={{ display: "grid", gap: "6px", marginTop: "20px" }}>
                  <label htmlFor="mentor-feedback-note" style={{
                    alignItems: "center", color: "var(--navy-950)",
                    display: "flex", fontSize: "0.85rem", fontWeight: 800, gap: "6px"
                  }}>
                    <MessageSquareText size={15} aria-hidden /> Nota condivisa opzionale
                  </label>
                  <p id="mentor-feedback-note-hint" className="muted" style={{ fontSize: "0.8rem", margin: 0 }}>
                    Diventa visibile soltanto a mentor, mentee e admin dopo entrambi i feedback. Non comparirà sul profilo pubblico.
                  </p>
                  <textarea
                    id="mentor-feedback-note"
                    name="mentor_feedback_note"
                    className="input"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    disabled={submitting}
                    aria-describedby="mentor-feedback-note-hint mentor-feedback-note-count"
                    placeholder="Scrivi un messaggio sul percorso…"
                  />
                  <span id="mentor-feedback-note-count" className="muted" style={{ fontSize: "0.75rem", textAlign: "right" }}>
                    {text.length} caratteri
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="button dark" type="submit" disabled={submitting} style={{ gap: "8px", minWidth: "200px" }}>
                  <Star size={16} aria-hidden /> {submitting ? "Invio…" : "Invia feedback"}
                </button>
              </div>
            </>
          ) : null}
          <style jsx>{`
            .mentor-feedback-grid {
              display: grid;
              gap: 18px;
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
            @media (max-width: 640px) {
              .mentor-feedback-grid {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
        </form>
      </OnboardingGate>
    </AppShell>
  );
}

function ScoreField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  disabled,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min: number;
  max: number;
  disabled: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: "6px" }}>
      <label htmlFor={id} style={{ color: "var(--navy-950)", fontSize: "0.85rem", fontWeight: 800 }}>{label}</label>
      <select
        id={id}
        name={id}
        className="input"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        disabled={disabled}
        required
      >
        <option value="">Seleziona da {min} a {max}</option>
        {Array.from({ length: max - min + 1 }, (_, index) => min + index).map((score) => (
          <option key={score} value={score}>{score}</option>
        ))}
      </select>
    </div>
  );
}
