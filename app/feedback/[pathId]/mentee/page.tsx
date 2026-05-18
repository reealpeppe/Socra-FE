"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, MessageSquareText, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";
import { ClientApiError, clientGet, clientPost } from "@/lib/api";
import type { PathItem } from "@/lib/types";

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

export default function MenteeFeedbackPage({ params }: { params: { pathId: string } }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [badges, setBadges] = useState<string[]>([]);
  const [externalPromotion, setExternalPromotion] = useState(false);
  const [competence, setCompetence] = useState(7);
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    clientGet<PathItem>(`/paths/${params.pathId}`)
      .then((path) => setTopic(path.goal?.topic || "undefined"))
      .catch(() => setTopic("undefined"));
  }, [params.pathId]);

  const isComplete = useMemo(
    () => QUESTIONS.every((question) => answers[question.key]) && badges.length <= 3 && !!topic,
    [answers, badges.length, topic]
  );

  function toggleBadge(value: string) {
    setBadges((current) => {
      if (current.includes(value)) return current.filter((badge) => badge !== value);
      if (current.length >= 3) return current;
      return [...current, value];
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await clientPost(`/feedback/${params.pathId}/mentee`, {
        answers: { ...answers, external_promotion: externalPromotion },
        badges,
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
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "24px", maxWidth: "760px" }}>
          <div>
            <h1 style={{ color: "var(--navy-950)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", margin: "0 0 4px" }}>
              Feedback sul mentor
            </h1>
            <p style={{ color: "var(--muted)", margin: 0 }}>
              Racconta com&apos;è andato il percorso: useremo le risposte per migliorare l&apos;esperienza e valorizzare i punti di forza del mentor.
            </p>
          </div>

          {error ? <p className="error">{error}</p> : null}

          <div className="card" style={{ display: "grid", gap: "18px" }}>
            {QUESTIONS.map((question) => (
              <div key={question.key} style={{ display: "grid", gap: "8px" }}>
                <label style={{ color: "var(--navy-950)", fontSize: "0.88rem", fontWeight: 800 }}>{question.label}</label>
                <select
                  className="input"
                  value={answers[question.key] || ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.key]: event.target.value }))}
                  required
                >
                  <option value="">Seleziona</option>
                  {question.options.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="card" style={{ display: "grid", gap: "18px" }}>
            <div>
              <label style={{ alignItems: "center", color: "var(--navy-950)", display: "flex", fontSize: "0.88rem", fontWeight: 800, gap: "6px" }}>
                <Award size={16} aria-hidden /> Punti di forza del mentor
              </label>
              <p style={{ color: "var(--muted)", fontSize: "0.82rem", margin: "4px 0 0" }}>
                Puoi selezionarne al massimo 3. Quelli più ricorrenti potranno comparire sul profilo del mentor.
              </p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {BADGES.map(([value, label]) => {
                const selected = badges.includes(value);
                return (
                  <button
                    key={value}
                    className={selected ? "button dark" : "button secondary"}
                    type="button"
                    onClick={() => toggleBadge(value)}
                    style={{ fontSize: "0.82rem" }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <label style={{ alignItems: "center", color: "var(--navy-950)", display: "flex", gap: "8px", fontSize: "0.88rem", fontWeight: 800 }}>
              <input
                checked={externalPromotion}
                onChange={(event) => setExternalPromotion(event.target.checked)}
                type="checkbox"
              />
              Il mentor ha promosso corsi, consulenze, prodotti o servizi esterni
            </label>

            <div style={{ display: "grid", gap: "6px" }}>
              <label style={{ color: "var(--navy-950)", fontSize: "0.88rem", fontWeight: 800 }}>
                Come valuti la tua conoscenza su questo argomento oggi?
              </label>
              <div style={{ alignItems: "center", display: "grid", gap: "10px", gridTemplateColumns: "minmax(0, 1fr) 72px" }}>
                <input className="input" min={1} max={10} type="range" value={competence} onChange={(event) => setCompetence(Number(event.target.value))} />
                <input className="input" min={1} max={10} type="number" value={competence} onChange={(event) => setCompetence(Number(event.target.value))} style={{ textAlign: "center" }} />
              </div>
            </div>

            <div style={{ display: "grid", gap: "6px" }}>
              <label style={{ color: "var(--navy-950)", fontSize: "0.88rem", fontWeight: 800 }}>Argomento del percorso</label>
              <input className="input" value={topic} onChange={(event) => setTopic(event.target.value)} required />
            </div>

            <div style={{ display: "grid", gap: "6px" }}>
              <label style={{ alignItems: "center", color: "var(--navy-950)", display: "flex", fontSize: "0.88rem", fontWeight: 800, gap: "6px" }}>
                <MessageSquareText size={15} aria-hidden /> Nota opzionale
              </label>
              <textarea className="input" value={text} onChange={(event) => setText(event.target.value)} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button className="button dark" type="submit" disabled={!isComplete} style={{ gap: "8px", minWidth: "200px" }}>
              <Star size={16} aria-hidden /> Invia feedback
            </button>
          </div>
        </form>
      </OnboardingGate>
    </AppShell>
  );
}
