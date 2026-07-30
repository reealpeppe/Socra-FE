"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronLeft, ChevronRight, Handshake, Target, Video } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { OnboardingGate } from "@/components/OnboardingGate";

const STEPS = [
  {
    icon: Target,
    eyebrow: "1 · Matching",
    title: "Scegli tra mentor compatibili",
    body: "Socra seleziona profili coerenti con il tuo obiettivo e il tuo punto di partenza, poi ti lascia sempre la scelta.",
    note: "Ogni suggerimento mostra una compatibilità sintetica e una motivazione leggibile.",
  },
  {
    icon: Handshake,
    eyebrow: "2 · Richiesta",
    title: "Il mentor ha 48 ore per rispondere",
    body: "Inviare una proposta non apre ancora il percorso. Quando l'altra persona accetta, nasce il percorso e al mentee viene applicato il costo previsto dal livello del mentor.",
    note: "Puoi avere un solo percorso attivo come mentee; un mentor può seguirne al massimo tre.",
  },
  {
    icon: Video,
    eyebrow: "3 · Percorso",
    title: "Prima sessione protetta, poi ritmo libero",
    body: "La prima sessione integrata è obbligatoria. Socra conserva solo i metadati indispensabili e non registra audio, video o conversazioni.",
    note: "Il percorso si completa quando entrambi chiudono il proprio lato e inviano il feedback indipendente.",
  },
] as const;

export default function TourPage() {
  return (
    <AppShell>
      <OnboardingGate>
        <Suspense fallback={<div className="card" role="status">Caricamento introduzione…</div>}>
          <TourContent />
        </Suspense>
      </OnboardingGate>
    </AppShell>
  );
}

function TourContent() {
  const searchParams = useSearchParams();
  const goalId = searchParams.get("goalId");
  const [current, setCurrent] = useState(0);
  const item = STEPS[current];
  const Icon = item.icon;
  const matchingHref = goalId ? `/matching?goalId=${encodeURIComponent(goalId)}` : "/matching";

  return (
    <div className="tour-wrap">
      <div>
        <p className="eyebrow">Prima di iniziare</p>
        <h1>Come funziona un percorso Socra</h1>
        <p className="muted">Tre passaggi, nessuna promessa di rendimento e nessuna dinamica da “guru”.</p>
      </div>

      <div className="tour-progress" aria-label={`Passaggio ${current + 1} di ${STEPS.length}`}>
        {STEPS.map((step, index) => (
          <button
            key={step.title}
            type="button"
            aria-label={`Vai al passaggio ${index + 1}: ${step.title}`}
            aria-current={index === current ? "step" : undefined}
            onClick={() => setCurrent(index)}
          >
            {index < current ? <CheckCircle2 size={15} aria-hidden /> : index + 1}
          </button>
        ))}
      </div>

      <section className="card tour-card" aria-live="polite">
        <span className="tour-icon"><Icon size={28} aria-hidden /></span>
        <p className="eyebrow">{item.eyebrow}</p>
        <h2>{item.title}</h2>
        <p>{item.body}</p>
        <div className="tour-note">{item.note}</div>
      </section>

      <div className="tour-actions">
        {current === 0 ? (
          <Link className="button secondary" href="/goal">
            <ChevronLeft size={16} aria-hidden /> Modifica obiettivo
          </Link>
        ) : (
          <button className="button secondary" type="button" onClick={() => setCurrent((value) => value - 1)}>
            <ChevronLeft size={16} aria-hidden /> Indietro
          </button>
        )}
        {current < STEPS.length - 1 ? (
          <button className="button dark" type="button" onClick={() => setCurrent((value) => value + 1)}>
            Continua <ChevronRight size={16} aria-hidden />
          </button>
        ) : (
          <Link className="button dark" href={matchingHref}>
            Cerca mentor <ChevronRight size={16} aria-hidden />
          </Link>
        )}
      </div>

      <style jsx>{`
        .tour-wrap {
          display: grid;
          gap: 22px;
          max-width: 760px;
        }
        .tour-wrap h1 {
          color: var(--navy-950);
          font-size: clamp(1.7rem, 4vw, 2.5rem);
          margin: 4px 0 8px;
        }
        .tour-progress {
          display: flex;
          gap: 9px;
        }
        .tour-progress button {
          align-items: center;
          background: var(--paper);
          border: 1px solid var(--line);
          border-radius: 999px;
          color: var(--muted);
          display: inline-flex;
          font-weight: 850;
          height: 34px;
          justify-content: center;
          width: 34px;
        }
        .tour-progress button[aria-current="step"] {
          background: var(--navy-950);
          border-color: var(--navy-950);
          color: var(--gold-500);
        }
        .tour-card {
          display: grid;
          gap: 12px;
          min-height: 320px;
          padding: clamp(22px, 5vw, 38px);
        }
        .tour-card h2 {
          color: var(--navy-950);
          font-size: clamp(1.35rem, 3vw, 1.8rem);
          margin: 0;
        }
        .tour-card > p:not(.eyebrow) {
          color: var(--muted);
          font-size: 1rem;
          line-height: 1.65;
          margin: 0;
          max-width: 62ch;
        }
        .tour-icon {
          align-items: center;
          background: var(--navy-950);
          border-radius: 999px;
          color: var(--gold-500);
          display: inline-flex;
          height: 58px;
          justify-content: center;
          width: 58px;
        }
        .tour-note {
          align-self: end;
          background: var(--blue-100);
          border-radius: var(--radius-sm);
          color: var(--blue-600);
          font-size: 0.86rem;
          font-weight: 700;
          line-height: 1.5;
          padding: 13px 15px;
        }
        .tour-actions {
          display: flex;
          gap: 12px;
          justify-content: space-between;
        }
        @media (max-width: 520px) {
          .tour-actions {
            align-items: stretch;
            display: grid;
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
