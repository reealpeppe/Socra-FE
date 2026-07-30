"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Award, MessageSquareText, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { PathItem, UserMe } from "@/lib/types";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";

const QUESTIONS = [
  {
    key: "outcome",
    label: "Come si è concluso il tuo percorso?",
    options: [
      ["goal_reached", "Obiettivo raggiunto"],
      ["strong_improvement", "Forte miglioramento"],
      ["partial_improvement", "Miglioramento parziale"],
      ["no_change", "Nessun cambiamento"],
      ["negative", "Esperienza negativa"],
    ],
  },
  {
    key: "concrete_change",
    label: "Quanto è cambiata concretamente la tua situazione?",
    options: [
      ["much", "Molto"],
      ["enough", "Abbastanza"],
      ["little", "Poco"],
      ["none", "Per niente"],
    ],
  },
  {
    key: "guidance",
    label: "Quanto ti sei sentito guidato durante il percorso?",
    options: [
      ["always", "Sempre guidato"],
      ["often", "Spesso guidato"],
      ["little", "Poco guidato"],
      ["none", "Per niente guidato"],
    ],
  },
  {
    key: "autonomy",
    label: "Oggi ti senti più autonomo nelle decisioni rispetto a prima?",
    options: [
      ["much_more", "Molto più autonomo"],
      ["more", "Più autonomo"],
      ["little_more", "Poco più autonomo"],
      ["not_more", "Per niente"],
    ],
  },
  {
    key: "would_repeat",
    label: "Rifaresti questo percorso con questa persona?",
    options: [
      ["immediately", "Sì, subito"],
      ["with_improvements", "Sì, ma con qualche miglioramento"],
      ["unsure", "Non sono sicuro"],
      ["no", "No"],
    ],
  },
  {
    key: "result_dependency",
    label: "Da cosa è dipeso il risultato?",
    options: [
      ["mentor", "Principalmente dal mentor"],
      ["balanced", "Equilibrato"],
      ["me", "Principalmente da me"],
    ],
  },
] as const;

const BADGES = [
  ["clear", "Chiaro e comprensibile"],
  ["goal_focused", "Focalizzato sugli obiettivi"],
  ["practical", "Pratico e concreto"],
  ["competent", "Competente"],
  ["present", "Presente e disponibile"],
] as const;

export default function MenteeFeedbackPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [badges, setBadges] = useState<string[]>([]);
  const [externalPromotion, setExternalPromotion] = useState(false);
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
        if (path.mentee_id !== me.id) throw new Error("Questo feedback è riservato al mentee del percorso.");
        if (!path.mentee_closed_at && path.status !== "completed") {
          throw new Error("Chiudi prima il tuo lato del percorso.");
        }
        if (path.mentee_feedback_submitted) throw new Error("Hai già inviato il feedback per questo percorso.");
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

  const isComplete = useMemo(
    () => eligible
      && QUESTIONS.every((question) => answers[question.key])
      && competence !== null
      && badges.length <= 3
      && !!topic,
    [answers, badges.length, competence, eligible, topic]
  );
  const isDirty = Object.keys(answers).length > 0
    || badges.length > 0
    || externalPromotion
    || competence !== null
    || text.length > 0;
  useUnsavedChangesGuard(eligible && isDirty);

  function toggleBadge(value: string) {
    setBadges((current) => {
      if (current.includes(value)) return current.filter((badge) => badge !== value);
      if (current.length >= 3) return current;
      return [...current, value];
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!isComplete || competence === null) {
      setError("Completa tutte le valutazioni obbligatorie.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await clientPost(`/feedback/${pathId}/mentee`, {
        answers: { ...answers, external_promotion: externalPromotion },
        badges,
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

  return (
    <AppShell>
      <OnboardingGate>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "24px", maxWidth: "760px" }}>
          <div>
            <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
              Feedback sul mentor
            </h1>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Le valutazioni restano indipendenti e non vengono mostrate all&apos;altra persona.
            </p>
          </div>

          {loading ? <div className="card" role="status">Caricamento feedback…</div> : null}
          {error ? <p className="error" role="alert">{error}</p> : null}

          {!loading && eligible ? (
            <>
              <div className="card" style={{ display: "grid", gap: "18px" }}>
                {QUESTIONS.map((question) => {
                  const id = `feedback-${question.key}`;
                  return (
                    <div key={question.key} style={{ display: "grid", gap: "8px" }}>
                      <label htmlFor={id} style={{ color: "var(--navy-950)", fontSize: "0.88rem", fontWeight: 800 }}>
                        {question.label}
                      </label>
                      <select
                        id={id}
                        name={question.key}
                        className="input"
                        value={answers[question.key] || ""}
                        onChange={(event) => setAnswers((current) => ({ ...current, [question.key]: event.target.value }))}
                        disabled={submitting}
                        required
                      >
                        <option value="">Seleziona una risposta</option>
                        {question.options.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              <div className="card" style={{ display: "grid", gap: "18px" }}>
                <div>
                  <span style={{ alignItems: "center", color: "var(--navy-950)", display: "flex", fontSize: "0.88rem", fontWeight: 800, gap: "6px" }}>
                    <Award size={16} aria-hidden /> Punti di forza del mentor
                  </span>
                  <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "4px 0 0" }}>
                    Facoltativo, massimo 3. I più ricorrenti possono comparire sul profilo pubblico.
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {BADGES.map(([value, label]) => {
                    const selected = badges.includes(value);
                    const limitReached = badges.length >= 3 && !selected;
                    return (
                      <button
                        key={value}
                        className={selected ? "button dark" : "button secondary"}
                        type="button"
                        aria-pressed={selected}
                        disabled={submitting || limitReached}
                        onClick={() => toggleBadge(value)}
                        style={{ fontSize: "0.82rem" }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <label style={{ alignItems: "flex-start", color: "var(--navy-950)", display: "flex", gap: "8px", fontSize: "0.88rem", fontWeight: 800 }}>
                  <input
                    checked={externalPromotion}
                    onChange={(event) => setExternalPromotion(event.target.checked)}
                    type="checkbox"
                    disabled={submitting}
                    style={{ marginTop: "3px" }}
                  />
                  Il mentor ha promosso corsi, consulenze, prodotti o servizi esterni
                </label>

                <div style={{ display: "grid", gap: "7px" }}>
                  <label htmlFor="mentee-competence" style={{ color: "var(--navy-950)", fontSize: "0.88rem", fontWeight: 800 }}>
                    Come valuti oggi la tua conoscenza su “{topicLabel}”?
                  </label>
                  <select
                    id="mentee-competence"
                    name="competence"
                    className="input"
                    value={competence ?? ""}
                    onChange={(event) => setCompetence(event.target.value ? Number(event.target.value) : null)}
                    disabled={submitting}
                    required
                  >
                    <option value="">Seleziona da 1 a 10</option>
                    {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => (
                      <option key={score} value={score}>
                        {score}{score === 1 ? " — conoscenza iniziale" : score === 10 ? " — conoscenza molto approfondita" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gap: "6px" }}>
                  <label htmlFor="mentee-feedback-note" style={{ alignItems: "center", color: "var(--navy-950)", display: "flex", fontSize: "0.88rem", fontWeight: 800, gap: "6px" }}>
                    <MessageSquareText size={15} aria-hidden /> Nota opzionale
                  </label>
                  <textarea
                    id="mentee-feedback-note"
                    className="input"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    disabled={submitting}
                    placeholder="Aggiungi un commento utile al team Socra"
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="button dark" type="submit" disabled={!isComplete || submitting} style={{ gap: "8px", minWidth: "200px" }}>
                  <Star size={16} aria-hidden /> {submitting ? "Invio…" : "Invia feedback"}
                </button>
              </div>
            </>
          ) : null}
        </form>
      </OnboardingGate>
    </AppShell>
  );
}
